#!/usr/bin/env python3
"""Alert precision/recall raw rows at three confidence thresholds."""
from __future__ import annotations

import asyncio
import csv

from _common import EVAL_DIR, bootstrap_backend, ensure_results, run_async, init_db_and_seed, write_csv

OUT = ensure_results() / "alert_precision_recall.csv"
LABELS = EVAL_DIR / "fixtures" / "emotion_labels.csv"
FIELDS = ["frame_id", "threshold_tested", "ground_truth_distress", "alert_fired", "correct"]
DISTRESS = {"sad", "angry", "fear", "disgust"}


async def bench_rows():
    from services.alert_service import MIN_ALERT_CONFIDENCE, is_cautious_emotion
    from services.deepface_service import detect_emotion

    base = MIN_ALERT_CONFIDENCE
    thresholds = [round(base - 0.1, 2), base, round(base + 0.1, 2)]
    rows = []
    for row in csv.DictReader(LABELS.open(encoding="utf-8")):
        frame = EVAL_DIR / row["frame_path"]
        truth = row["ground_truth_emotion"].lower()
        gt_distress = truth in DISTRESS
        pred = await detect_emotion(frame.read_bytes())
        label = str(pred.get("emotion") or "neutral")
        conf = float(pred.get("confidence") or 0.0)
        for th in thresholds:
            fired = is_cautious_emotion(label, conf, threshold=th)
            rows.append(
                {
                    "frame_id": row["frame_id"],
                    "threshold_tested": th,
                    "ground_truth_distress": gt_distress,
                    "alert_fired": fired,
                    "correct": fired == gt_distress,
                }
            )
    return rows


def main() -> None:
    bootstrap_backend()
    from prepare_fixtures import FRAMES, main as prep

    run_async(init_db_and_seed())
    if not list(FRAMES.glob("f*.jpg")):
        prep()
    rows = run_async(bench_rows())
    n = write_csv(OUT, FIELDS, rows)
    print(f"Wrote {n} rows -> {OUT}")


if __name__ == "__main__":
    main()
