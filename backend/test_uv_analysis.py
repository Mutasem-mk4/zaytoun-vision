from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

import cv2
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
RAW_DATA = PROJECT_ROOT / "Raw_data"
sys.path.insert(0, str(BACKEND_DIR))

from reference_builder import build_cache  # noqa: E402
from uv_analysis import analyze_uv_sample, load_reference_cache  # noqa: E402


def centered_sample(bgr: tuple[int, int, int], size: int = 300) -> np.ndarray:
    image = np.zeros((size, size, 3), dtype=np.uint8)
    cv2.rectangle(image, (70, 45), (230, 255), bgr, thickness=-1)
    return image


class ReferenceCacheTests(unittest.TestCase):
    def test_reference_cache_has_step0_and_step9(self) -> None:
        cache = load_reference_cache()
        reference = cache["reference"]
        self.assertIn("0", reference["steps"])
        self.assertIn("9", reference["steps"])
        self.assertGreater(reference["steps"]["0"]["fluorescence_count"], 0)
        self.assertGreater(reference["steps"]["9"]["fluorescence_count"], 0)

    def test_band_feature_csv_contains_required_bands(self) -> None:
        path = BACKEND_DIR / "reference_cache" / "eem_band_features.csv"
        with path.open("r", encoding="utf-8", newline="") as handle:
            first = next(csv.DictReader(handle))
        for field in (
            "blue_430_450",
            "green_510_550",
            "red_660_690",
            "red_670_680",
            "red_blue_ratio",
            "green_blue_ratio",
        ):
            self.assertIn(field, first)
            self.assertGreaterEqual(float(first[field]), 0.0)

    def test_absorption_metrics_are_cached(self) -> None:
        reference = json.loads((BACKEND_DIR / "reference_cache" / "aging_reference.json").read_text())
        step0 = reference["steps"]["0"]["absorption"]
        step9 = reference["steps"]["9"]["absorption"]
        for metric in ("K232", "K268", "deltaK"):
            self.assertIsNotNone(step0[metric]["mean"])
            self.assertIsNotNone(step9[metric]["mean"])

    @unittest.skipUnless(RAW_DATA.exists(), "Raw_data folder is not available")
    def test_raw_data_builder_parses_all_aging_folders_and_excludes_whitewine(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            reference = build_cache(RAW_DATA, Path(tmpdir))
        self.assertIn("0", reference["steps"])
        self.assertIn("9", reference["steps"])
        self.assertTrue(any("WhiteWine" in item for item in reference["excludedFiles"]))
        self.assertEqual(reference["steps"]["0"]["fluorescence_count"], 144)
        self.assertEqual(reference["steps"]["9"]["fluorescence_count"], 144)


class UVAnalysisDecisionTests(unittest.TestCase):
    def test_fresh_evoo_like_synthetic_image(self) -> None:
        result = analyze_uv_sample(centered_sample((20, 90, 230)), "fresh")
        self.assertEqual(result["category"], "fresh_evoo")
        self.assertGreaterEqual(result["authenticityScore"], 75)
        self.assertGreaterEqual(result["freshnessScore"], 75)
        self.assertLessEqual(result["fakeProbability"], 25)

    def test_blue_with_green_baseline_is_expired_not_fake(self) -> None:
        result = analyze_uv_sample(centered_sample((230, 50, 5)), "expired")
        self.assertEqual(result["category"], "expired_olive_oil")
        self.assertGreaterEqual(result["authenticityScore"], 60)
        self.assertLessEqual(result["evooScore"], 8)

    def test_blue_without_green_baseline_is_fake_or_refined(self) -> None:
        result = analyze_uv_sample(centered_sample((230, 2, 5)), "fake")
        self.assertEqual(result["category"], "fake_or_refined")
        self.assertGreaterEqual(result["fakeProbability"], 80)
        self.assertIsNone(result["freshnessScore"])

    def test_edge_only_blue_glare_is_invalid(self) -> None:
        image = np.zeros((300, 300, 3), dtype=np.uint8)
        cv2.rectangle(image, (35, 35), (265, 265), (230, 0, 0), thickness=28)
        result = analyze_uv_sample(image, "glare")
        self.assertEqual(result["category"], "invalid_image")
        self.assertIn("blue_edge_glare", result["qualityFlags"])

    def test_dark_image_is_invalid(self) -> None:
        result = analyze_uv_sample(np.zeros((300, 300, 3), dtype=np.uint8), "dark")
        self.assertEqual(result["category"], "invalid_image")
        self.assertIn("dark_or_no_liquid_roi", result["qualityFlags"])

    def test_bright_background_with_top_red_hotspot_is_invalid(self) -> None:
        image = np.full((300, 300, 3), (135, 135, 135), dtype=np.uint8)
        cv2.rectangle(image, (70, 40), (230, 260), (25, 85, 105), thickness=-1)
        cv2.rectangle(image, (70, 48), (230, 92), (20, 35, 235), thickness=-1)
        result = analyze_uv_sample(image, "visible-light-stock-photo")
        self.assertEqual(result["category"], "invalid_image")
        self.assertIn("non_dark_room_background", result["qualityFlags"])
        self.assertIn("quality_gate_failed", result["decisionTrace"]["rule"])

    def test_bright_background_can_be_recovered_when_center_liquid_signal_is_good(self) -> None:
        image = np.full((300, 300, 3), (130, 130, 130), dtype=np.uint8)
        cv2.rectangle(image, (70, 45), (230, 255), (20, 80, 225), thickness=-1)
        result = analyze_uv_sample(image, "recoverable-bright-background")
        self.assertNotEqual(result["category"], "invalid_image")
        self.assertTrue(result["photoSetup"]["enhancementApplied"])
        self.assertEqual(result["photoSetup"]["category"], "recovered_dark_uv_oil")
        self.assertIn("background_ignored_mask_only", result["qualityFlags"])
        self.assertEqual(result["photoSetup"]["enhancementMethod"], "mask_only_no_color_transform")

    def test_recovery_preserves_center_channel_values(self) -> None:
        clean = centered_sample((20, 80, 225))
        bright_background = np.full((300, 300, 3), (130, 130, 130), dtype=np.uint8)
        cv2.rectangle(bright_background, (70, 45), (230, 255), (20, 80, 225), thickness=-1)

        clean_result = analyze_uv_sample(clean, "clean")
        recovered_result = analyze_uv_sample(bright_background, "recovered")

        for key in ("redChlorophyll", "greenBiologicalBaseline", "blueOxidation"):
            self.assertAlmostEqual(
                clean_result["uvFingerprint"][key],
                recovered_result["uvFingerprint"][key],
                delta=2.0,
            )


if __name__ == "__main__":
    unittest.main()
