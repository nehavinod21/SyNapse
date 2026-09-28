#!/usr/bin/env python3
"""DeepFace accuracy rows vs labelled fixtures."""
from __future__ import annotations

import asyncio
import csv

from _common import EVAL_DIR, bootstrap_backend, ensure_results, run_async, init_db_and_seed, write_csv

OUT = ensure_results() / "emotion_detection_accuracy.csv"
LABELS = EVAL_DIR / "fixtures" / "emotion_labels.csv"
FIELDS = [
    "frame_id",
    "child_profile_id",
    "ground_truth_emotion",
    "predicted_emotion",
    "confidence",
    "correct",
    "duration_seconds",
]


async def bench_rows():
    import time
    from sqlalchemy import select
    from database import async_session
    from models import Child
    from services.deepface_service import detect_emotion

    async with async_session() as db:
        ids = [c.id for c in (await db.execute(select(Child))).scalars().all()]
    rows = []
    for i, row in enumerate(csv.DictReader(LABELS.open(encoding="utf-8"))):
        frame = EVAL_DIR / row["frame_path"]
        truth = row["ground_truth_emotion"]
        t0 = time.perf_counter()
        data = await detect_emotion(frame.read_bytes())
        pred = str(data.get("emotion") or "neutral")
        conf = float(data.get("confidence") or 0.0)
        rows.append(
            {
                "frame_id": row["frame_id"],
                "child_profile_id": ids[i % len(ids)] if ids else "",
                "ground_truth_emotion": truth,
                "predicted_emotion": pred,
                "confidence": conf,
                "correct": pred.lower() == truth.lower(),
                "duration_seconds": round(time.perf_counter() - t0, 6),
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
    correct = sum(1 for r in rows if r["correct"])
    acc = correct / n if n else 0.0
    labels = sorted({r["ground_truth_emotion"] for r in rows})
    f1s = []
    for lab in labels:
        tp = sum(1 for r in rows if r["ground_truth_emotion"] == lab and r["predicted_emotion"] == lab)
        fp = sum(1 for r in rows if r["ground_truth_emotion"] != lab and r["predicted_emotion"] == lab)
        fn = sum(1 for r in rows if r["ground_truth_emotion"] == lab and r["predicted_emotion"] != lab)
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        f1s.append(f1)
    macro_f1 = sum(f1s) / len(f1s) if f1s else 0.0
    from collections import Counter

    pred_counts = Counter(r["predicted_emotion"] for r in rows)
    print(f"Wrote {n} rows -> {OUT}")
    print(f"Accuracy: {correct}/{n} = {acc:.1%} | Macro-F1: {macro_f1:.3f}")
    print(f"Predicted label counts: {dict(sorted(pred_counts.items()))}")


if __name__ == "__main__":
    main()
