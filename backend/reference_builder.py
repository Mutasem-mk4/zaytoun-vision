"""
Build compact UV fluorescence and absorption references from Raw_data.

Raw_data stays as the source of truth. This script extracts only the bands
used by the runtime phone-image screening engine and writes derived cache
files into backend/reference_cache.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, pstdev
from typing import Any, Iterable


EXCITATION_TARGETS = (360.0, 370.0)
EXCITATION_TOLERANCE = 0.25

BANDS = {
    "blue_430_450": (430.0, 450.0),
    "green_510_550": (510.0, 550.0),
    "red_660_690": (660.0, 690.0),
    "red_670_680": (670.0, 680.0),
}

CSV_FIELDS = [
    "aging_step",
    "sample_id",
    "filename",
    "excitation_nm",
    "blue_430_450",
    "green_510_550",
    "red_660_690",
    "red_670_680",
    "red_blue_ratio",
    "green_blue_ratio",
    "red_fraction",
    "green_fraction",
    "blue_fraction",
]

ABSORPTION_FIELDS = ("K232", "K264", "K268", "K272", "deltaK")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Zaytoun UV reference cache.")
    parser.add_argument(
        "--raw-data",
        default=str(Path(__file__).resolve().parents[1] / "Raw_data"),
        help="Path to Raw_data directory.",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parent / "reference_cache"),
        help="Output cache directory.",
    )
    return parser.parse_args()


def aging_step_from_path(path: Path) -> int | None:
    match = re.search(r"Aging Step\s+(\d+)", str(path), flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def should_exclude(path: Path) -> bool:
    name = path.name.lower()
    return "whitewine" in name or "white_wine" in name or "white-wine" in name


def to_float(value: str | None) -> float | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        parsed = float(value)
    except ValueError:
        return None
    if not math.isfinite(parsed):
        return None
    return parsed


def is_target_excitation(excitation_nm: float) -> bool:
    return any(abs(excitation_nm - target) <= EXCITATION_TOLERANCE for target in EXCITATION_TARGETS)


def parse_fluorescence_header(header: list[str]) -> list[tuple[int, str, float]]:
    pairs: list[tuple[int, str, float]] = []
    for idx in range(0, len(header) - 1, 2):
        label = header[idx].strip()
        if not label:
            continue
        match = re.match(r"(.+)_EX_([0-9.]+)", label)
        if not match:
            continue
        excitation_nm = float(match.group(2))
        if is_target_excitation(excitation_nm):
            pairs.append((idx, match.group(1), excitation_nm))
    return pairs


def parse_fluorescence_file(path: Path, aging_step: int) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.reader(handle)
        try:
            header = next(reader)
            next(reader)
        except StopIteration:
            return []

        pairs = parse_fluorescence_header(header)
        buckets: dict[tuple[str, float], dict[str, list[float]]] = {
            (sample_id, excitation_nm): {band: [] for band in BANDS}
            for col_idx, sample_id, excitation_nm in pairs
        }

        for row in reader:
            for col_idx, sample_id, excitation_nm in pairs:
                if col_idx + 1 >= len(row):
                    continue
                wavelength = to_float(row[col_idx])
                intensity = to_float(row[col_idx + 1])
                if wavelength is None or intensity is None:
                    continue
                intensity = max(0.0, intensity)
                for band_name, (low, high) in BANDS.items():
                    if low <= wavelength <= high:
                        buckets[(sample_id, excitation_nm)][band_name].append(intensity)

    records: list[dict[str, Any]] = []
    for (sample_id, excitation_nm), band_values in buckets.items():
        values = {
            band_name: safe_mean(intensities)
            for band_name, intensities in band_values.items()
        }
        blue = values["blue_430_450"]
        green = values["green_510_550"]
        red = values["red_660_690"]
        total = blue + green + red + 1e-9
        records.append(
            {
                "aging_step": aging_step,
                "sample_id": sample_id,
                "filename": path.name,
                "excitation_nm": round(excitation_nm, 2),
                **values,
                "red_blue_ratio": red / (blue + 1e-9),
                "green_blue_ratio": green / (blue + 1e-9),
                "red_fraction": red / total,
                "green_fraction": green / total,
                "blue_fraction": blue / total,
            }
        )
    return records


def parse_absorption_file(path: Path, aging_step: int) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if len(row) < 6:
                continue
            sample_id = row[0].strip()
            if not re.fullmatch(r"[A-Za-z0-9]+", sample_id):
                continue
            values = [to_float(cell) for cell in row[2:6]]
            if any(value is None for value in values):
                continue
            k232, k264, k268, k272 = [float(value) for value in values]
            records.append(
                {
                    "aging_step": aging_step,
                    "sample_id": sample_id,
                    "filename": path.name,
                    "K232": k232,
                    "K264": k264,
                    "K268": k268,
                    "K272": k272,
                    "deltaK": k268 - ((k264 + k272) / 2.0),
                }
            )
    return records


def safe_mean(values: Iterable[float]) -> float:
    values = list(values)
    return float(mean(values)) if values else 0.0


def stats(values: Iterable[float]) -> dict[str, float | int | None]:
    values = [float(value) for value in values if math.isfinite(float(value))]
    if not values:
        return {"count": 0, "mean": None, "std": None, "min": None, "max": None}
    return {
        "count": len(values),
        "mean": float(mean(values)),
        "std": float(pstdev(values)) if len(values) > 1 else 0.0,
        "min": min(values),
        "max": max(values),
    }


def summarize_by_step(
    fluorescence_records: list[dict[str, Any]],
    absorption_records: list[dict[str, Any]],
) -> dict[str, Any]:
    fluorescence_by_step: dict[int, list[dict[str, Any]]] = defaultdict(list)
    absorption_by_step: dict[int, list[dict[str, Any]]] = defaultdict(list)

    for record in fluorescence_records:
        fluorescence_by_step[int(record["aging_step"])].append(record)
    for record in absorption_records:
        absorption_by_step[int(record["aging_step"])].append(record)

    steps: dict[str, Any] = {}
    all_steps = sorted(set(fluorescence_by_step) | set(absorption_by_step))
    feature_names = [
        "blue_430_450",
        "green_510_550",
        "red_660_690",
        "red_670_680",
        "red_blue_ratio",
        "green_blue_ratio",
        "red_fraction",
        "green_fraction",
        "blue_fraction",
    ]

    for step in all_steps:
        fluorescence_step_records = fluorescence_by_step.get(step, [])
        absorption_step_records = absorption_by_step.get(step, [])
        steps[str(step)] = {
            "fluorescence_count": len(fluorescence_step_records),
            "absorption_count": len(absorption_step_records),
            "fluorescence": {
                field: stats(record[field] for record in fluorescence_step_records)
                for field in feature_names
            },
            "absorption": {
                field: stats(record[field] for record in absorption_step_records)
                for field in ABSORPTION_FIELDS
            },
        }
    return steps


def build_cache(raw_data_dir: Path, output_dir: Path) -> dict[str, Any]:
    if not raw_data_dir.exists():
        raise FileNotFoundError(f"Raw_data directory not found: {raw_data_dir}")

    fluorescence_records: list[dict[str, Any]] = []
    absorption_records: list[dict[str, Any]] = []
    excluded_files: list[str] = []

    for file_path in sorted(raw_data_dir.rglob("*.csv")):
        step = aging_step_from_path(file_path)
        if step is None:
            continue
        if should_exclude(file_path):
            excluded_files.append(str(file_path.relative_to(raw_data_dir)))
            continue
        normalized_path = str(file_path).lower()
        if "fluorescence" in normalized_path:
            fluorescence_records.extend(parse_fluorescence_file(file_path, step))
        elif "absorption" in normalized_path:
            absorption_records.extend(parse_absorption_file(file_path, step))

    output_dir.mkdir(parents=True, exist_ok=True)
    write_band_csv(output_dir / "eem_band_features.csv", fluorescence_records)

    reference = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "rawDataRoot": str(raw_data_dir.resolve()),
        "excitationTargetsNm": list(EXCITATION_TARGETS),
        "emissionBandsNm": {
            name: {"low": low, "high": high}
            for name, (low, high) in BANDS.items()
        },
        "excludedFiles": excluded_files,
        "recordCounts": {
            "fluorescence": len(fluorescence_records),
            "absorption": len(absorption_records),
        },
        "steps": summarize_by_step(fluorescence_records, absorption_records),
        "notes": [
            "WhiteWine and other obvious non-EVOO controls are excluded from EVOO aging baselines.",
            "Absorption metrics support lab reference interpretation; they are not directly measured by one phone fluorescence image.",
        ],
    }

    (output_dir / "aging_reference.json").write_text(
        json.dumps(reference, indent=2),
        encoding="utf-8",
    )

    calibration_path = output_dir / "phone_calibration.json"
    if not calibration_path.exists():
        calibration = {
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
            "notes": [
                "Default thresholds are conservative placeholders until real phone images are calibrated.",
                "Do not present this as lab certification unless calibrated with validated samples.",
            ],
        }
        calibration_path.write_text(json.dumps(calibration, indent=2), encoding="utf-8")

    return reference


def write_band_csv(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for record in records:
            writer.writerow({field: record.get(field, "") for field in CSV_FIELDS})


def main() -> None:
    args = parse_args()
    reference = build_cache(Path(args.raw_data), Path(args.output))
    counts = reference["recordCounts"]
    print(
        "Built reference cache: "
        f"{counts['fluorescence']} fluorescence records, "
        f"{counts['absorption']} absorption records"
    )


if __name__ == "__main__":
    main()
