"""
UV fluorescence screening engine for dark-room olive-oil images.

The runtime pipeline uses only emitted fluorescence visible in the phone image.
It does not infer daylight oil color and it does not claim to measure UV-Vis
absorption metrics from a normal camera photo.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

import cv2
import numpy as np


BASE_DIR = Path(__file__).resolve().parent
REFERENCE_DIR = BASE_DIR / "reference_cache"
REFERENCE_PATH = REFERENCE_DIR / "aging_reference.json"
CALIBRATION_PATH = REFERENCE_DIR / "phone_calibration.json"

DEFAULT_CALIBRATION = {
    "schemaVersion": 1,
    "isCalibrated": False,
    "countsScale": 1000,
    "expectedPhoneToLabErrorPct": 25,
    "expectedAgingStepError": 2.0,
    "greenBaselineCutoffCounts": 35,
    "greenBaselineRatioCutoff": 0.08,
    "blueDominanceFraction": 0.45,
    "redWeakFraction": 0.22,
    "glareBlueEdgeCenterRatio": 1.7,
    "maxSaturatedPixelFraction": 0.18,
    "maxDarkRoomBorderMean": 45,
    "maxDarkRoomBorderBrightFraction": 0.12,
    "redSurfaceHotspotRatio": 1.6,
    "minRecoverySetupScore": 58,
}


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if math.isfinite(parsed) else fallback


def safe_round(value: Any, digits: int = 2) -> float:
    return round(safe_float(value), digits)


@lru_cache(maxsize=1)
def load_reference_cache() -> dict[str, Any]:
    reference: dict[str, Any] = {}
    calibration = dict(DEFAULT_CALIBRATION)

    if REFERENCE_PATH.exists():
        reference = json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))

    if CALIBRATION_PATH.exists():
        loaded = json.loads(CALIBRATION_PATH.read_text(encoding="utf-8"))
        calibration.update(loaded)

    return {
        "reference": reference,
        "calibration": calibration,
        "referenceLoaded": bool(reference),
        "calibrationLoaded": CALIBRATION_PATH.exists(),
    }


def _stat_mean(reference: dict[str, Any], step: int, section: str, feature: str) -> float | None:
    try:
        value = reference["steps"][str(step)][section][feature]["mean"]
    except KeyError:
        return None
    if value is None:
        return None
    return safe_float(value)


def _build_roi(img_bgr: np.ndarray) -> np.ndarray:
    height, width = img_bgr.shape[:2]
    y0, y1 = int(height * 0.12), int(height * 0.88)
    x0, x1 = int(width * 0.12), int(width * 0.88)
    return img_bgr[y0:y1, x0:x1]


def _inspect_image(
    img_bgr: np.ndarray,
    calibration: dict[str, Any],
    recovery_mode: bool = False,
) -> dict[str, Any]:
    flags: list[str] = []
    if img_bgr is None or img_bgr.size == 0:
        return {
            "valid": False,
            "flags": ["empty_image"],
            "metrics": {},
            "roi": None,
            "mask": None,
        }

    height, width = img_bgr.shape[:2]
    if height < 40 or width < 40:
        flags.append("image_too_small")

    full_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    border_mask = np.zeros((height, width), dtype=bool)
    border_y = max(1, int(height * 0.10))
    border_x = max(1, int(width * 0.10))
    border_mask[:border_y, :] = True
    border_mask[-border_y:, :] = True
    border_mask[:, :border_x] = True
    border_mask[:, -border_x:] = True
    border_pixels = full_gray[border_mask]
    border_mean = float(np.mean(border_pixels)) if border_pixels.size else 0.0
    border_bright_fraction = float(np.mean(border_pixels > 70)) if border_pixels.size else 0.0
    if (
        not recovery_mode
        and (
        border_mean > safe_float(calibration.get("maxDarkRoomBorderMean"), 45.0)
        or border_bright_fraction > safe_float(calibration.get("maxDarkRoomBorderBrightFraction"), 0.12)
        )
    ):
        flags.append("non_dark_room_background")

    roi = _build_roi(img_bgr)
    if roi.size == 0:
        return {
            "valid": False,
            "flags": ["empty_roi"],
            "metrics": {},
            "roi": roi,
            "mask": None,
        }

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    saturated = np.any(roi >= 248, axis=2)
    saturated_fraction = float(np.mean(saturated))
    if saturated_fraction > safe_float(calibration.get("maxSaturatedPixelFraction"), 0.18):
        flags.append("saturated_glare")

    signal_threshold = max(18.0, float(np.percentile(gray, 55)) * 0.35)
    signal_mask = (gray > signal_threshold) & (~saturated)
    if recovery_mode:
        recovery_mask = np.zeros_like(signal_mask, dtype=bool)
        recovery_mask[
            int(roi.shape[0] * 0.30) : int(roi.shape[0] * 0.90),
            int(roi.shape[1] * 0.18) : int(roi.shape[1] * 0.82),
        ] = True
        signal_mask &= recovery_mask
        flags.append("background_ignored_mask_only")
    signal_fraction = float(np.mean(signal_mask))
    if signal_fraction < 0.01:
        flags.append("dark_or_no_liquid_roi")

    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if blur_variance < 2.0 and signal_fraction < 0.08:
        flags.append("low_focus_or_flat_signal")

    roi_h, roi_w = gray.shape
    center_mask = np.zeros_like(signal_mask, dtype=bool)
    center_mask[int(roi_h * 0.25) : int(roi_h * 0.75), int(roi_w * 0.25) : int(roi_w * 0.75)] = True
    center_signal = signal_mask & center_mask
    edge_signal = signal_mask & (~center_mask)

    center_blue = _masked_channel_mean(roi[:, :, 0], center_signal)
    edge_blue = _masked_channel_mean(roi[:, :, 0], edge_signal)
    blue_edge_center_ratio = edge_blue / (center_blue + 1e-6)

    top_band = np.zeros_like(signal_mask, dtype=bool)
    top_band[: int(roi_h * 0.28), :] = True
    top_signal = signal_mask & top_band
    center_red = _masked_channel_mean(roi[:, :, 2], center_signal)
    top_red = _masked_channel_mean(roi[:, :, 2], top_signal)
    red_surface_ratio = top_red / (center_red + 1e-6)
    if (
        top_red > 80
        and red_surface_ratio > safe_float(calibration.get("redSurfaceHotspotRatio"), 1.6)
        and center_red < top_red * 0.65
    ):
        flags.append("red_surface_hotspot_suppressed" if recovery_mode else "red_surface_hotspot")

    if (
        edge_blue > 30
        and blue_edge_center_ratio > safe_float(calibration.get("glareBlueEdgeCenterRatio"), 1.7)
        and center_blue < edge_blue * 0.7
    ):
        flags.append("blue_edge_glare")

    invalid_flags = {
        "empty_image",
        "empty_roi",
        "image_too_small",
        "dark_or_no_liquid_roi",
        "blue_edge_glare",
        "non_dark_room_background",
        "red_surface_hotspot",
    }
    valid = not any(flag in invalid_flags for flag in flags)

    return {
        "valid": valid,
        "flags": flags,
        "metrics": {
            "signalFraction": signal_fraction,
            "saturatedPixelFraction": saturated_fraction,
            "blurVariance": blur_variance,
            "centerBlueMean": center_blue,
            "edgeBlueMean": edge_blue,
            "blueEdgeCenterRatio": blue_edge_center_ratio,
            "centerRedMean": center_red,
            "topRedMean": top_red,
            "redSurfaceRatio": red_surface_ratio,
            "borderMean": border_mean,
            "borderBrightFraction": border_bright_fraction,
        },
        "roi": roi,
        "mask": signal_mask,
    }


def _masked_channel_mean(channel: np.ndarray, mask: np.ndarray) -> float:
    if mask is None or not np.any(mask):
        return 0.0
    return float(np.mean(channel[mask]))


def quality_check(img_bgr: np.ndarray) -> dict[str, Any]:
    cache = load_reference_cache()
    inspected = _inspect_image(img_bgr, cache["calibration"])
    return {
        "valid": inspected["valid"],
        "qualityFlags": inspected["flags"],
        "qualityMetrics": inspected["metrics"],
    }


def uv_feature_extraction(img_bgr: np.ndarray) -> dict[str, float]:
    cache = load_reference_cache()
    inspected = _inspect_image(img_bgr, cache["calibration"])
    return _extract_uv_fingerprint(
        inspected.get("roi"),
        inspected.get("mask"),
        cache["calibration"],
    )


def _extract_uv_fingerprint(
    roi: np.ndarray | None,
    mask: np.ndarray | None,
    calibration: dict[str, Any],
) -> dict[str, float]:
    if roi is None or mask is None or not np.any(mask):
        return _empty_fingerprint()

    scale = safe_float(calibration.get("countsScale"), 1000.0)
    blue_mean = _masked_channel_mean(roi[:, :, 0], mask)
    green_mean = _masked_channel_mean(roi[:, :, 1], mask)
    red_mean = _masked_channel_mean(roi[:, :, 2], mask)

    blue = blue_mean / 255.0 * scale
    green = green_mean / 255.0 * scale
    red = red_mean / 255.0 * scale
    total = red + green + blue + 1e-9

    return {
        "redChlorophyll": safe_round(red),
        "greenBiologicalBaseline": safe_round(green),
        "blueOxidation": safe_round(blue),
        "redBlueRatio": safe_round(red / (blue + 1e-6), 4),
        "greenBlueRatio": safe_round(green / (blue + 1e-6), 4),
        "redFraction": safe_round(red / total, 4),
        "greenFraction": safe_round(green / total, 4),
        "blueFraction": safe_round(blue / total, 4),
    }


def _empty_fingerprint() -> dict[str, float]:
    return {
        "redChlorophyll": 0.0,
        "greenBiologicalBaseline": 0.0,
        "blueOxidation": 0.0,
        "redBlueRatio": 0.0,
        "greenBlueRatio": 0.0,
        "redFraction": 0.0,
        "greenFraction": 0.0,
        "blueFraction": 0.0,
    }


def authenticity_engine(
    fingerprint: dict[str, float],
    quality: dict[str, Any],
    calibration: dict[str, Any],
) -> dict[str, Any]:
    red = fingerprint["redChlorophyll"]
    green = fingerprint["greenBiologicalBaseline"]
    blue = fingerprint["blueOxidation"]
    red_fraction = fingerprint["redFraction"]
    green_fraction = fingerprint["greenFraction"]
    blue_fraction = fingerprint["blueFraction"]

    green_cutoff = safe_float(calibration.get("greenBaselineCutoffCounts"), 35.0)
    green_ratio_cutoff = safe_float(calibration.get("greenBaselineRatioCutoff"), 0.08)
    blue_dominance_fraction = safe_float(calibration.get("blueDominanceFraction"), 0.45)
    red_weak_fraction = safe_float(calibration.get("redWeakFraction"), 0.22)

    green_presence_score = max(
        clamp((green / max(green_cutoff, 1e-6)) * 100.0),
        clamp((fingerprint["greenBlueRatio"] / max(green_ratio_cutoff, 1e-6)) * 100.0),
        clamp((green_fraction / 0.08) * 100.0),
    )
    red_presence_score = max(
        clamp((red_fraction / 0.55) * 100.0),
        clamp((red / max(blue, 1.0)) * 55.0),
    )

    green_present = green_presence_score >= 60.0
    red_present = red_presence_score >= 55.0
    blue_dominant = blue_fraction >= blue_dominance_fraction or (blue > red * 1.3 and blue > green * 1.3)
    red_weak = red_fraction <= red_weak_fraction or red < blue * 0.55

    fake_evidence = 0.0
    if blue_dominant:
        fake_evidence += 38.0
    if red_weak:
        fake_evidence += 24.0
    if not green_present:
        fake_evidence += 34.0
    if not red_present and not green_present:
        fake_evidence += 14.0
    if "saturated_glare" in quality.get("flags", []):
        fake_evidence -= 8.0

    fake_probability = clamp(fake_evidence, 0.0, 98.0)
    authenticity_score = clamp(100.0 - fake_probability)

    if green_present and blue_dominant and red_weak:
        authenticity_score = max(authenticity_score, 64.0)
        fake_probability = min(fake_probability, 36.0)
    if red_present and green_present:
        authenticity_score = max(authenticity_score, 82.0)
        fake_probability = min(fake_probability, 18.0)
    if red_present and not blue_dominant:
        authenticity_score = max(authenticity_score, 76.0)
        fake_probability = min(fake_probability, 24.0)
    if not green_present and blue_dominant and red_weak:
        authenticity_score = min(authenticity_score, 18.0)
        fake_probability = max(fake_probability, 82.0)

    return {
        "authenticityScore": round(authenticity_score),
        "fakeProbability": round(fake_probability),
        "greenPresent": green_present,
        "redPresent": red_present,
        "blueDominant": blue_dominant,
        "redWeak": red_weak,
        "greenPresenceScore": round(green_presence_score),
        "redPresenceScore": round(red_presence_score),
    }


def freshness_engine(
    fingerprint: dict[str, float],
    authenticity: dict[str, Any],
    reference: dict[str, Any],
    calibration: dict[str, Any],
) -> dict[str, Any]:
    red_fraction = fingerprint["redFraction"]
    green_fraction = fingerprint["greenFraction"]
    blue_fraction = fingerprint["blueFraction"]
    red_blue_ratio = fingerprint["redBlueRatio"]

    blue_age = clamp((blue_fraction - 0.05) / 0.75, 0.0, 1.0)
    red_loss_age = clamp((0.72 - red_fraction) / 0.68, 0.0, 1.0)
    ratio_age = clamp((1.7 - red_blue_ratio) / 1.7, 0.0, 1.0)
    green_loss_age = clamp((0.18 - green_fraction) / 0.18, 0.0, 1.0)
    oxidation_index = clamp(
        (0.42 * blue_age + 0.32 * red_loss_age + 0.18 * ratio_age + 0.08 * green_loss_age) * 100.0,
        0.0,
        100.0,
    )

    if authenticity.get("blueDominant") and authenticity.get("redWeak"):
        oxidation_index = max(oxidation_index, 88.0)
    elif red_fraction >= 0.58 and blue_fraction <= 0.18:
        oxidation_index = min(oxidation_index, 18.0)

    estimated_step = int(round((oxidation_index / 100.0) * 9.0))
    estimated_step = max(0, min(9, estimated_step))
    freshness_score = round(clamp(100.0 - oxidation_index))

    expected_step_error = safe_float(calibration.get("expectedAgingStepError"), 2.0)
    aging_confidence = round(clamp(82.0 - expected_step_error * 6.0))
    if not calibration.get("isCalibrated", False):
        aging_confidence = min(aging_confidence, 70)

    closest_reference = _reference_step_summary(reference, estimated_step)
    distance_from_step0 = round(oxidation_index)

    return {
        "freshnessScore": freshness_score,
        "estimatedAgingStep": estimated_step,
        "agingConfidence": aging_confidence,
        "distanceFromAgingStep0": distance_from_step0,
        "closestReference": closest_reference,
    }


def _reference_step_summary(reference: dict[str, Any], step: int) -> dict[str, Any] | None:
    if not reference or "steps" not in reference or str(step) not in reference["steps"]:
        return None
    absorption = {
        key: _stat_mean(reference, step, "absorption", key)
        for key in ("K232", "K268", "deltaK")
    }
    fluorescence = {
        "redBlueRatio": _stat_mean(reference, step, "fluorescence", "red_blue_ratio"),
        "greenBlueRatio": _stat_mean(reference, step, "fluorescence", "green_blue_ratio"),
        "blue430450": _stat_mean(reference, step, "fluorescence", "blue_430_450"),
        "green510550": _stat_mean(reference, step, "fluorescence", "green_510_550"),
        "red660690": _stat_mean(reference, step, "fluorescence", "red_660_690"),
    }
    return {
        "agingStep": step,
        "fluorescence": {key: safe_round(value, 4) for key, value in fluorescence.items()},
        "absorption": {key: safe_round(value, 4) for key, value in absorption.items()},
    }


def report_builder(
    category: str,
    fingerprint: dict[str, float],
    authenticity: dict[str, Any],
    freshness: dict[str, Any] | None,
    quality: dict[str, Any],
    cache: dict[str, Any],
) -> str:
    if category == "invalid_image":
        if "non_dark_room_background" in quality.get("flags", []):
            return (
                "The image did not pass the dark-room UV quality gate because the background is bright. "
                "The red area may be visible-light reflection or a surface hotspot, so it is not enough to prove "
                "red chlorophyll fluorescence inside the liquid."
            )
        if "red_surface_hotspot" in quality.get("flags", []):
            return (
                "The red signal is concentrated near the top surface instead of the liquid center. Retake with a "
                "dark background and crop to the central liquid so the app can judge true fluorescence."
            )
        return (
            "The image did not pass the UV quality gate. Retake in a dark room, crop to the liquid center, "
            "and avoid glass-edge reflections or saturated UV glare."
        )
    if category == "fake_or_refined":
        return (
            "The UV fingerprint has weak red chlorophyll, strong blue emission, and a near-flat green biological "
            "baseline. That pattern fits refined or seed-oil fraud better than aged olive oil."
        )
    if category == "expired_olive_oil":
        return (
            "The sample is blue-dominant and red chlorophyll is mostly gone, but the green olive baseline remains "
            "measurable. The engine therefore treats it as real olive oil that is heavily oxidized or expired."
        )
    if category == "fresh_evoo":
        return (
            "The red chlorophyll signal is strong, the green biological baseline is present, and blue oxidation is "
            "low. The sample is closest to a fresh EVOO-like UV fingerprint."
        )
    return (
        "The sample keeps an olive-oil UV identity, but the freshness score is below a fresh EVOO-like profile. "
        "This points to real olive oil that has aged or oxidized."
    )


def _category_to_status(category: str) -> str:
    if category == "fresh_evoo":
        return "pure"
    if category in {"real_but_aged", "expired_olive_oil"}:
        return "warning"
    return "adulterated"


def _verdict(category: str) -> str:
    return {
        "fresh_evoo": "Fresh EVOO-like",
        "real_but_aged": "Real Olive Oil, Not Fresh Enough for EVOO",
        "expired_olive_oil": "Real Olive Oil but Expired",
        "fake_or_refined": "Likely Fake or Refined",
        "invalid_image": "Invalid UV Image",
    }.get(category, "Unknown")


def _setup_score(flags: list[str], recovery_used: bool = False) -> int:
    score = 100
    penalties = {
        "non_dark_room_background": 36,
        "red_surface_hotspot": 34,
        "blue_edge_glare": 30,
        "dark_or_no_liquid_roi": 60,
        "image_too_small": 45,
        "saturated_glare": 18,
        "low_focus_or_flat_signal": 16,
        "background_ignored_mask_only": 10,
        "red_surface_hotspot_suppressed": 18,
    }
    for flag in flags:
        score -= penalties.get(flag, 6)
    if recovery_used:
        score -= 8
    return int(clamp(score))


def _photo_setup_category(valid: bool, flags: list[str], recovery_used: bool) -> str:
    if valid and recovery_used:
        return "recovered_dark_uv_oil"
    if valid:
        return "valid_dark_uv_oil"
    if "dark_or_no_liquid_roi" in flags:
        return "no_liquid_detected"
    if "non_dark_room_background" in flags:
        return "daylight_or_stock_photo"
    if "red_surface_hotspot" in flags or "blue_edge_glare" in flags:
        return "glare_or_reflection"
    if "saturated_glare" in flags or "low_focus_or_flat_signal" in flags:
        return "blurry_or_saturated"
    return "wrong_crop"


def _photo_setup_report(
    original: dict[str, Any],
    selected: dict[str, Any],
    recovery_attempted: bool,
    recovery_used: bool,
) -> dict[str, Any]:
    original_flags = list(original.get("flags", []))
    selected_flags = list(selected.get("flags", []))
    all_flags = list(dict.fromkeys(original_flags + selected_flags))
    valid = bool(selected.get("valid", False))
    setup_score = _setup_score(all_flags if not recovery_used else selected_flags, recovery_used)

    reasons: list[str] = []
    retake: list[str] = []

    if "non_dark_room_background" in original_flags and not recovery_used:
        reasons.append("The background is too bright for a dark-room UV screening photo.")
        retake.append("Turn off room lights and place the sample against a black background.")
    if "non_dark_room_background" in original_flags and recovery_used:
        reasons.append("The background was bright, so the analyzer ignored non-sample pixels before scoring.")
    if "red_surface_hotspot" in original_flags:
        reasons.append("The red signal is concentrated near the liquid surface/top reflection, not the liquid center.")
        retake.append("Move the UV light to the side and crop to the central liquid, avoiding the top meniscus.")
    if "blue_edge_glare" in original_flags:
        reasons.append("Strong blue was concentrated on glass edges, which can be reflection rather than molecular fluorescence.")
        retake.append("Avoid bottle edges; use a vial or crop tighter into the liquid center.")
    if "dark_or_no_liquid_roi" in all_flags:
        reasons.append("The analyzer could not find enough usable liquid signal.")
        retake.append("Fill more of the frame with the oil sample under UV.")
    if "saturated_glare" in all_flags:
        reasons.append("Some pixels are saturated, which can hide the real UV fingerprint.")
        retake.append("Move the UV source farther away or lower exposure.")
    if not reasons and valid:
        reasons.append("The photo passed the setup checks for dark-room UV screening.")

    if not retake and not valid:
        retake.append("Retake in a dark room with the liquid centered and no visible reflections.")

    return {
        "validForAnalysis": valid,
        "setupScore": setup_score,
        "category": _photo_setup_category(valid, original_flags if original_flags else selected_flags, recovery_used),
        "enhancementAttempted": recovery_attempted,
        "enhancementApplied": recovery_used,
        "enhancementMethod": "mask_only_no_color_transform" if recovery_attempted else None,
        "recoveryLimitReason": None if recovery_used or not recovery_attempted else "Recovered image was still below the setup-quality limit.",
        "reasons": reasons,
        "retakeInstructions": retake,
    }


def _recover_image_if_possible(
    img_bgr: np.ndarray,
    original: dict[str, Any],
    calibration: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    original_flags = set(original.get("flags", []))
    recoverable = bool(
        original_flags
        & {"non_dark_room_background", "blue_edge_glare", "red_surface_hotspot", "saturated_glare"}
    )
    hard_fail = bool(original_flags & {"empty_image", "empty_roi", "image_too_small", "dark_or_no_liquid_roi"})
    if not recoverable or hard_fail:
        return original, _photo_setup_report(original, original, recovery_attempted=False, recovery_used=False)

    recovered = _inspect_image(img_bgr, calibration, recovery_mode=True)
    recovered_score = _setup_score(list(recovered.get("flags", [])), recovery_used=True)
    min_score = safe_float(calibration.get("minRecoverySetupScore"), 58.0)

    # A top red hotspot is too risky to convert into a confident oil verdict.
    if "red_surface_hotspot" in original_flags:
        setup = _photo_setup_report(original, recovered, recovery_attempted=True, recovery_used=False)
        setup["setupScore"] = min(setup["setupScore"], recovered_score)
        setup["validForAnalysis"] = False
        setup["category"] = "glare_or_reflection"
        setup["recoveryLimitReason"] = "Top red hotspot cannot be trusted as liquid-center fluorescence."
        return original, setup

    if recovered.get("valid") and recovered_score >= min_score:
        setup = _photo_setup_report(original, recovered, recovery_attempted=True, recovery_used=True)
        return recovered, setup

    setup = _photo_setup_report(original, recovered, recovery_attempted=True, recovery_used=False)
    setup["setupScore"] = min(setup["setupScore"], recovered_score)
    return original, setup


def _decision_trace(
    category: str,
    fingerprint: dict[str, float],
    authenticity: dict[str, Any],
    freshness: dict[str, Any] | None,
    quality: dict[str, Any],
) -> dict[str, Any]:
    if category == "invalid_image":
        rule = "quality_gate_failed"
    elif category == "fake_or_refined":
        rule = "fake_rule_red_weak_blue_high_green_absent"
    elif category == "expired_olive_oil":
        rule = "expired_rule_red_weak_blue_high_green_present"
    elif category == "fresh_evoo":
        rule = "fresh_rule_authenticity_and_freshness_high"
    else:
        rule = "aged_rule_authentic_but_freshness_below_evoo"

    return {
        "rule": rule,
        "qualityGatePassed": quality["valid"],
        "qualityFlags": quality["flags"],
        "signals": {
            "redDetected": bool(authenticity.get("redPresent", False)),
            "greenBaselinePresent": bool(authenticity.get("greenPresent", False)),
            "blueDominant": bool(authenticity.get("blueDominant", False)),
            "redWeak": bool(authenticity.get("redWeak", False)),
        },
        "scores": {
            "redPresenceScore": authenticity.get("redPresenceScore"),
            "greenPresenceScore": authenticity.get("greenPresenceScore"),
            "authenticityScore": authenticity.get("authenticityScore"),
            "fakeProbability": authenticity.get("fakeProbability"),
            "freshnessScore": freshness.get("freshnessScore") if freshness else None,
        },
        "channelFractions": {
            "redFraction": fingerprint.get("redFraction"),
            "greenFraction": fingerprint.get("greenFraction"),
            "blueFraction": fingerprint.get("blueFraction"),
        },
        "notes": [
            "A red-looking pixel region is only counted as useful evidence when it is inside the liquid ROI and not a surface/glare hotspot.",
            "The fake/refined rule requires weak red, dominant blue, and absent green baseline after the quality gate passes.",
        ],
    }


def analyze_uv_sample(img_bgr: np.ndarray, sample_name: str = "Live Sample") -> dict[str, Any]:
    cache = load_reference_cache()
    reference = cache["reference"]
    calibration = cache["calibration"]
    original_inspected = _inspect_image(img_bgr, calibration)
    inspected, photo_setup = _recover_image_if_possible(img_bgr, original_inspected, calibration)
    quality = {
        "valid": inspected["valid"],
        "flags": inspected["flags"],
        "metrics": inspected["metrics"],
    }
    fingerprint = _extract_uv_fingerprint(inspected.get("roi"), inspected.get("mask"), calibration)

    if not quality["valid"]:
        category = "invalid_image"
        authenticity = {
            "authenticityScore": 0,
            "fakeProbability": 0,
            "greenPresent": False,
            "redPresent": False,
            "blueDominant": False,
            "redWeak": True,
            "greenPresenceScore": 0,
            "redPresenceScore": 0,
        }
        freshness = None
    else:
        authenticity = authenticity_engine(fingerprint, quality, calibration)
        if (
            authenticity["fakeProbability"] >= 65
            and authenticity["blueDominant"]
            and authenticity["redWeak"]
            and not authenticity["greenPresent"]
        ):
            category = "fake_or_refined"
            freshness = None
        else:
            freshness = freshness_engine(fingerprint, authenticity, reference, calibration)
            if authenticity["blueDominant"] and authenticity["redWeak"] and authenticity["greenPresent"]:
                category = "expired_olive_oil"
                freshness["freshnessScore"] = min(freshness["freshnessScore"], 8)
                freshness["estimatedAgingStep"] = max(freshness["estimatedAgingStep"], 8)
                freshness["distanceFromAgingStep0"] = max(freshness["distanceFromAgingStep0"], 92)
            elif authenticity["authenticityScore"] >= 75 and freshness["freshnessScore"] >= 75:
                category = "fresh_evoo"
            else:
                category = "real_but_aged"

    freshness_score = freshness["freshnessScore"] if freshness else None
    estimated_step = freshness["estimatedAgingStep"] if freshness else None
    aging_confidence = freshness["agingConfidence"] if freshness else None
    evoo_score = (
        round(authenticity["authenticityScore"] * freshness_score / 100.0)
        if freshness_score is not None
        else None
    )
    if category == "expired_olive_oil" and evoo_score is not None:
        evoo_score = min(evoo_score, 8)

    if category == "fake_or_refined":
        display_score = max(0, 100 - authenticity["fakeProbability"])
        adulterant = "Refined or seed-oil UV signature"
    elif category == "invalid_image":
        display_score = 0
        adulterant = "Invalid UV image"
    else:
        display_score = evoo_score if evoo_score is not None else authenticity["authenticityScore"]
        adulterant = None

    confidence = _screening_confidence(category, authenticity, freshness, quality, calibration)
    scientific_explanation = report_builder(
        category,
        fingerprint,
        authenticity,
        freshness,
        quality,
        cache,
    )

    tags = [
        category,
        f"red_{round(fingerprint['redChlorophyll'])}",
        f"green_{round(fingerprint['greenBiologicalBaseline'])}",
        f"blue_{round(fingerprint['blueOxidation'])}",
    ]
    if quality["flags"]:
        tags.extend(quality["flags"][:3])

    reference_comparison = {
        "distanceFromAgingStep0": freshness["distanceFromAgingStep0"] if freshness else None,
        "closestReference": freshness["closestReference"] if freshness else None,
        "step0Reference": _reference_step_summary(reference, 0),
        "step9Reference": _reference_step_summary(reference, 9),
    }
    decision_trace = _decision_trace(category, fingerprint, authenticity, freshness, quality)

    return {
        "sampleName": sample_name,
        "purityScore": int(round(display_score)),
        "purity_score": int(round(display_score)),
        "adulterantDetected": adulterant,
        "adulterant_detected": adulterant,
        "confidence": round(confidence / 100.0, 3),
        "tags": tags,
        "status": _category_to_status(category),
        "label": category,
        "authenticityScore": authenticity["authenticityScore"],
        "fakeProbability": authenticity["fakeProbability"],
        "freshnessScore": freshness_score,
        "evooScore": evoo_score,
        "estimatedAgingStep": estimated_step,
        "agingConfidence": aging_confidence,
        "category": category,
        "verdict": _verdict(category),
        "uvFingerprint": {
            "redChlorophyll": fingerprint["redChlorophyll"],
            "greenBiologicalBaseline": fingerprint["greenBiologicalBaseline"],
            "blueOxidation": fingerprint["blueOxidation"],
            "redBlueRatio": fingerprint["redBlueRatio"],
            "greenBlueRatio": fingerprint["greenBlueRatio"],
        },
        "qualityFlags": quality["flags"],
        "qualityMetrics": quality["metrics"],
        "photoSetup": photo_setup,
        "decisionTrace": decision_trace,
        "scientificExplanation": scientific_explanation,
        "referenceComparison": reference_comparison,
        "calibration": {
            "isCalibrated": bool(calibration.get("isCalibrated", False)),
            "expectedPhoneToLabErrorPct": calibration.get("expectedPhoneToLabErrorPct"),
            "expectedAgingStepError": calibration.get("expectedAgingStepError"),
        },
        "absorptionNote": (
            "K232, K268, and deltaK are stored from lab absorption files for reference. "
            "A normal phone UV fluorescence photo cannot directly measure those absorption metrics."
        ),
        "fluorescence_intensity": safe_round(
            (fingerprint["redChlorophyll"]
             + fingerprint["greenBiologicalBaseline"]
             + fingerprint["blueOxidation"])
            / 3.0
        ),
        "recommendation": scientific_explanation,
    }


def _screening_confidence(
    category: str,
    authenticity: dict[str, Any],
    freshness: dict[str, Any] | None,
    quality: dict[str, Any],
    calibration: dict[str, Any],
) -> float:
    if category == "invalid_image":
        return 100.0

    margin_penalty = safe_float(calibration.get("expectedPhoneToLabErrorPct"), 25.0) * 0.35
    quality_penalty = min(len(quality.get("flags", [])) * 7.0, 21.0)
    if category == "fake_or_refined":
        base = authenticity["fakeProbability"]
    elif freshness:
        base = (authenticity["authenticityScore"] + safe_float(freshness.get("agingConfidence"), 60.0)) / 2.0
    else:
        base = authenticity["authenticityScore"]
    return clamp(base - margin_penalty - quality_penalty, 35.0, 96.0)
