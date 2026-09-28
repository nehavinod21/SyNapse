"""One-off: discover 12 FER2013 train crops and write embedded cache JSON."""
from __future__ import annotations

import base64
import json
import urllib.request

import cv2
import numpy as np

from _common import FER_LABELS

HF_BASE = "https://huggingface.co/datasets/gulsunnciftci/fer2013/resolve/main/"
HF_API = "https://huggingface.co/api/datasets/gulsunnciftci/fer2013"
OUT = "_embedded_fer2013_data.json"
TARGET_PER_CLASS = 2
TARGET_TOTAL = 12


def discover_paths() -> list[tuple[str, str]]:
    req = urllib.request.Request(HF_API, headers={"User-Agent": "synapse-eval/1.0"})
    payload = json.loads(urllib.request.urlopen(req, timeout=60).read())
    by_emotion: dict[str, list[str]] = {name: [] for name in FER_LABELS.values()}
    for entry in payload.get("siblings", []):
        rel = entry.get("rfilename", "")
        if not rel.startswith("train/") or not rel.endswith(".jpg"):
            continue
        emotion = rel.split("/")[1]
        if emotion in by_emotion and len(by_emotion[emotion]) < TARGET_PER_CLASS:
            by_emotion[emotion].append(rel)

    out: list[tuple[str, str]] = []
    for emotion in FER_LABELS.values():
        for rel in by_emotion[emotion]:
            out.append((rel, emotion))
            if len(out) >= TARGET_TOTAL:
                return out
    return out


def download_b64(rel: str) -> str:
    url = HF_BASE + rel
    req = urllib.request.Request(url, headers={"User-Agent": "synapse-eval/1.0"})
    data = urllib.request.urlopen(req, timeout=60).read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"decode failed: {rel}")
    ok, buf = cv2.imencode(".jpg", img)
    if not ok:
        raise RuntimeError(f"encode failed: {rel}")
    return base64.b64encode(buf.tobytes()).decode()


def main() -> None:
    paths = discover_paths()
    print(f"discovered {len(paths)} paths")
    built = []
    for rel, emotion in paths[:TARGET_TOTAL]:
        b64 = download_b64(rel)
        built.append({"rel": rel, "emotion": emotion, "b64": b64})
        print(f"  {rel}: {emotion}")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(built, f)
    print(f"wrote {OUT} ({len(built)} samples)")


if __name__ == "__main__":
    main()
