"""Build fixtures entirely from local HF image cache (no embedded JSON required)."""
from __future__ import annotations

import base64
import csv
import json
import shutil
from pathlib import Path

import cv2

from prepare_fixtures import (
    EMBEDDED,
    EMBEDDED_MAX_FRAMES,
    FRAMES,
    LABELS,
    ROOT,
    TARGET_PER_CLASS,
    TARGET_TOTAL,
    _hf_cache_train_dir,
    _validate_face_array,
)

EMOTIONS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
PER_CLASS = 5


def main() -> None:
    train = _hf_cache_train_dir()
    if train is None:
        raise SystemExit("HF cache not found")

    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("f*.jpg"):
        old.unlink()

    label_rows: list[dict[str, str]] = []
    for emotion in EMOTIONS:
        emo_dir = train / emotion
        if not emo_dir.is_dir():
            print(f"skip missing class: {emotion}")
            continue
        picked = 0
        for src in sorted(emo_dir.glob("*.jpg")):
            if picked >= PER_CLASS or len(label_rows) >= TARGET_TOTAL:
                break
            img = cv2.imread(str(src))
            if not _validate_face_array(img):
                continue
            frame_id = f"f{len(label_rows) + 1:03d}"
            rel = f"fixtures/frames/{frame_id}.jpg"
            shutil.copy2(src, ROOT / rel)
            label_rows.append(
                {
                    "frame_id": frame_id,
                    "child_profile_id": "",
                    "frame_path": rel,
                    "ground_truth_emotion": emotion,
                }
            )
            picked += 1
            print(f"  {frame_id}: {emotion} ({src.name})")

    if len(label_rows) < 6:
        raise SystemExit(f"Only built {len(label_rows)} frames from cache")

    with LABELS.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f, fieldnames=["frame_id", "child_profile_id", "frame_path", "ground_truth_emotion"]
        )
        w.writeheader()
        w.writerows(label_rows)

    # Refresh compact embedded bundle from first unique crops.
    frames = []
    for row in label_rows[:EMBEDDED_MAX_FRAMES]:
        p = ROOT / row["frame_path"]
        img = cv2.imread(str(p))
        ok, buf = cv2.imencode(".jpg", img)
        h, w = img.shape[:2]
        frames.append(
            {
                "frame_id": f"f{len(frames) + 1:03d}",
                "ground_truth_emotion": row["ground_truth_emotion"],
                "width": w,
                "height": h,
                "image_b64": __import__("base64").b64encode(buf.tobytes()).decode("ascii"),
            }
        )
    EMBEDDED.write_text(json.dumps({"version": 1, "frames": frames}, indent=2), encoding="utf-8")

    from collections import Counter

    print(f"Built {len(label_rows)} frames; distribution: {dict(sorted(Counter(r['ground_truth_emotion'] for r in label_rows).items()))}")


if __name__ == "__main__":
    main()
