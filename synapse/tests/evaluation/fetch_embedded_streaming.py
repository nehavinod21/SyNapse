"""Fetch missing FER2013 classes via streaming (bounded iterations)."""
from __future__ import annotations

import base64
import json

import cv2
import numpy as np
from datasets import load_dataset

from prepare_fixtures import EMBEDDED, _to_bgr, _validate_face_array

NEED = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
PER_CLASS = 2
MAX_SCAN = 8000
LABELS = {0: "angry", 1: "disgust", 2: "fear", 3: "happy", 4: "neutral", 5: "sad", 6: "surprise"}


def main() -> None:
    counts = {e: 0 for e in NEED}
    frames: list[dict] = []
    ds = load_dataset("gulsunnciftci/fer2013", split="train", streaming=True)

    for i, item in enumerate(ds):
        if i >= MAX_SCAN:
            break
        if all(counts[e] >= PER_CLASS for e in NEED):
            break
        emotion = LABELS.get(int(item["label"]), "neutral")
        if counts[emotion] >= PER_CLASS:
            continue
        img = _to_bgr(np.array(item["image"]))
        if not _validate_face_array(img):
            continue
        ok, buf = cv2.imencode(".jpg", img)
        if not ok:
            continue
        h, w = img.shape[:2]
        frame_id = f"f{len(frames) + 1:03d}"
        frames.append(
            {
                "frame_id": frame_id,
                "ground_truth_emotion": emotion,
                "width": w,
                "height": h,
                "image_b64": base64.b64encode(buf.tobytes()).decode("ascii"),
            }
        )
        counts[emotion] += 1
        print(f"  {frame_id}: {emotion} (scan #{i})")

    if len(frames) < 12:
        raise SystemExit(f"Only collected {len(frames)} frames: {counts}")

    EMBEDDED.write_text(json.dumps({"version": 1, "frames": frames}, indent=2), encoding="utf-8")
    print(f"Wrote {len(frames)} frames -> {EMBEDDED}")
    print("counts:", counts)


if __name__ == "__main__":
    main()
