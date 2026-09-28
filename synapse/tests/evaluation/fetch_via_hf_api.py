"""Fetch FER2013 crops via HuggingFace datasets-server API (no streaming hang)."""
from __future__ import annotations

import base64
import csv
import json
import urllib.request
from pathlib import Path

import cv2
import numpy as np

from prepare_fixtures import (
    EMBEDDED,
    EMBEDDED_MAX_FRAMES,
    FRAMES,
    LABELS,
    ROOT,
    TARGET_PER_CLASS,
    TARGET_TOTAL,
    _validate_face_array,
)

API = "https://datasets-server.huggingface.co/rows"
DATASET = "gulsunnciftci/fer2013"
LABELS_MAP = {0: "angry", 1: "disgust", 2: "fear", 3: "happy", 4: "neutral", 5: "sad", 6: "surprise"}
PAGE = 100
MAX_OFFSET = 12000


def _fetch_page(offset: int) -> list[dict]:
    url = f"{API}?dataset={DATASET}&config=default&split=train&offset={offset}&length={PAGE}"
    with urllib.request.urlopen(url, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("rows", [])


def _download_image(url: str) -> np.ndarray | None:
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = np.frombuffer(resp.read(), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    return img


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("f*.jpg"):
        old.unlink()

    counts = {name: 0 for name in LABELS_MAP.values()}
    label_rows: list[dict[str, str]] = []
    seen: set[str] = set()

    for offset in range(0, MAX_OFFSET, PAGE):
        if len(label_rows) >= TARGET_TOTAL:
            break
        if all(counts[e] >= TARGET_PER_CLASS for e in LABELS_MAP.values()):
            break
        try:
            rows = _fetch_page(offset)
        except Exception as exc:
            print(f"page {offset} failed: {exc}")
            continue
        if not rows:
            break
        for entry in rows:
            if len(label_rows) >= TARGET_TOTAL:
                break
            label_idx = int(entry["row"]["label"])
            emotion = LABELS_MAP.get(label_idx, "neutral")
            if counts[emotion] >= TARGET_PER_CLASS:
                continue
            url = entry["row"]["image"]["src"]
            img = _download_image(url)
            if img is None or not _validate_face_array(img):
                continue
            digest = cv2.imencode(".jpg", img)[1].tobytes().hex()[:32]
            if digest in seen:
                continue
            seen.add(digest)
            frame_id = f"f{len(label_rows) + 1:03d}"
            rel = f"fixtures/frames/{frame_id}.jpg"
            cv2.imwrite(str(ROOT / rel), img)
            label_rows.append(
                {
                    "frame_id": frame_id,
                    "child_profile_id": "",
                    "frame_path": rel,
                    "ground_truth_emotion": emotion,
                }
            )
            counts[emotion] += 1
            print(f"  {frame_id}: {emotion} (offset {entry['row_idx']})")

    if len(label_rows) < 12:
        raise SystemExit(f"Only collected {len(label_rows)} frames: {counts}")

    with LABELS.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f, fieldnames=["frame_id", "child_profile_id", "frame_path", "ground_truth_emotion"]
        )
        w.writeheader()
        w.writerows(label_rows)

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
                "image_b64": base64.b64encode(buf.tobytes()).decode("ascii"),
            }
        )
    EMBEDDED.write_text(json.dumps({"version": 1, "frames": frames}, indent=2), encoding="utf-8")

    print(f"Built {len(label_rows)} frames; distribution: {dict(sorted(counts.items()))}")


if __name__ == "__main__":
    main()
