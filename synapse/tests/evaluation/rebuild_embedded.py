"""One-shot: rebuild embedded_fer2013.json from local HF cache (unique crops)."""
from __future__ import annotations

import base64
import json

import cv2

from prepare_fixtures import EMBEDDED, _hf_cache_train_dir, _validate_face_array

EMOTIONS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
PER_CLASS = 2


def main() -> None:
    train = _hf_cache_train_dir()
    if train is None:
        raise SystemExit("HF cache not found")

    frames: list[dict] = []
    counts: dict[str, int] = {e: 0 for e in EMOTIONS}

    for emotion in EMOTIONS:
        emo_dir = train / emotion
        if not emo_dir.is_dir():
            print(f"missing dir: {emotion}")
            continue
        for src in sorted(emo_dir.glob("*.jpg")):
            if counts[emotion] >= PER_CLASS:
                break
            img = cv2.imread(str(src))
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
            print(f"  {frame_id}: {emotion} ({src.name})")

    if len(frames) < 12:
        raise SystemExit(f"Only found {len(frames)} valid crops (need >= 12)")

    EMBEDDED.write_text(json.dumps({"version": 1, "frames": frames}, indent=2), encoding="utf-8")
    print(f"Wrote {len(frames)} unique embedded frames -> {EMBEDDED}")


if __name__ == "__main__":
    main()
