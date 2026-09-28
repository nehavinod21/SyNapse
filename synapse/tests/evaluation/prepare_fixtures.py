"""Build real FER2013 face-crop fixtures — streaming first, embedded fallback."""
from __future__ import annotations

import base64
import csv
import hashlib
import json
import os
import shutil
from pathlib import Path

import cv2
import numpy as np

from _common import EVAL_DIR, FER_LABELS

ROOT = EVAL_DIR
FRAMES = ROOT / "fixtures" / "frames"
LABELS = ROOT / "fixtures" / "emotion_labels.csv"
EMBEDDED = ROOT / "fixtures" / "embedded_fer2013.json"
TARGET_PER_CLASS = 2
TARGET_TOTAL = 12
EMBEDDED_MAX_FRAMES = 12  # offline bundle: 2 per class × 6 classes


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _is_placeholder_image(img: np.ndarray) -> bool:
    """Reject flat color blocks and legacy ellipse placeholders."""
    if img is None or img.size == 0:
        return True
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    if float(np.std(gray)) < 12.0:
        return True
    edges = cv2.Canny(gray, 50, 150)
    edge_ratio = float(np.count_nonzero(edges)) / float(edges.size)
    if edge_ratio < 0.02:
        return True
    return False


def _validate_face_array(img: np.ndarray) -> bool:
    if img is None or img.size == 0:
        return False
    h, w = img.shape[:2]
    if not (32 <= min(h, w) and max(h, w) <= 128):
        return False
    return not _is_placeholder_image(img)


def _to_bgr(img: np.ndarray) -> np.ndarray:
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
    return img


def _label_rows_to_csv(label_rows: list[dict[str, str]]) -> None:
    with LABELS.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f, fieldnames=["frame_id", "child_profile_id", "frame_path", "ground_truth_emotion"]
        )
        w.writeheader()
        w.writerows(label_rows)


def _save_embedded(label_rows: list[dict[str, str]]) -> None:
    """Persist a compact offline bundle (unique crops only, capped at EMBEDDED_MAX_FRAMES)."""
    from collections import Counter

    counts = Counter(r["ground_truth_emotion"] for r in label_rows)
    required = {"angry", "disgust", "fear", "happy", "neutral", "sad"}
    if not required.issubset(counts) or any(counts[e] < TARGET_PER_CLASS for e in required):
        print(f"Skip embedded save: incomplete distribution {dict(counts)}")
        return
    frames = []
    seen_digest: set[str] = set()
    for row in label_rows:
        if len(frames) >= EMBEDDED_MAX_FRAMES:
            break
        img_path = ROOT / row["frame_path"]
        if not img_path.exists():
            continue
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        digest = _digest(img_path.read_bytes())
        if digest in seen_digest:
            continue
        seen_digest.add(digest)
        ok, buf = cv2.imencode(".jpg", img)
        if not ok:
            continue
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
    if frames:
        EMBEDDED.write_text(json.dumps({"version": 1, "frames": frames}, indent=2), encoding="utf-8")


def _load_from_embedded() -> list[dict[str, str]]:
    if not EMBEDDED.exists():
        return []

    payload = json.loads(EMBEDDED.read_text(encoding="utf-8"))
    label_rows: list[dict[str, str]] = []
    seen_digest: set[str] = set()
    for entry in payload.get("frames", []):
        if len(label_rows) >= EMBEDDED_MAX_FRAMES:
            break
        raw = base64.b64decode(entry["image_b64"])
        if _digest(raw) in seen_digest:
            continue
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if not _validate_face_array(img):
            continue
        seen_digest.add(_digest(raw))
        frame_id = entry.get("frame_id") or f"f{len(label_rows) + 1:03d}"
        rel = f"fixtures/frames/{frame_id}.jpg"
        cv2.imwrite(str(ROOT / rel), img)
        label_rows.append(
            {
                "frame_id": frame_id,
                "child_profile_id": "",
                "frame_path": rel,
                "ground_truth_emotion": entry["ground_truth_emotion"],
            }
        )
        print(f"  {frame_id}: {entry['ground_truth_emotion']} from embedded")

    return label_rows


def _hf_cache_split_dir(split: str = "train") -> Path | None:
    """Return local HuggingFace FER-2013 snapshot dir for split ('train' or 'test')."""
    split = split.strip().lower()
    if split not in {"train", "test"}:
        raise ValueError(f"split must be 'train' or 'test', got {split!r}")
    hub = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface" / "hub"))
    if not hub.exists():
        hub = Path.home() / ".cache" / "huggingface" / "hub"
    matches = sorted(hub.glob(f"datasets--gulsunnciftci--fer2013/snapshots/*/{split}"))
    for split_dir in matches:
        if split_dir.is_dir():
            return split_dir
    return None


def _hf_cache_train_dir() -> Path | None:
    return _hf_cache_split_dir("train")


def _hf_cache_test_dir() -> Path | None:
    return _hf_cache_split_dir("test")


def _load_from_hf_cache() -> list[dict[str, str]]:
    """Collect cache candidates without writing (avoids overwriting embedded frames)."""
    train_dir = _hf_cache_train_dir()
    if train_dir is None:
        return []

    candidates: list[dict[str, str]] = []
    counts: dict[str, int] = {name: 0 for name in FER_LABELS.values()}

    for _label_idx, emotion in FER_LABELS.items():
        if len(candidates) >= TARGET_TOTAL:
            break
        if counts[emotion] >= TARGET_PER_CLASS:
            continue
        emo_dir = train_dir / emotion
        if not emo_dir.is_dir():
            continue
        picked = 0
        for src in sorted(emo_dir.glob("*.jpg")):
            if picked >= TARGET_PER_CLASS or len(candidates) >= TARGET_TOTAL:
                break
            if counts[emotion] >= TARGET_PER_CLASS:
                break
            img = cv2.imread(str(src))
            if not _validate_face_array(img):
                continue
            candidates.append(
                {
                    "frame_id": "",
                    "child_profile_id": "",
                    "frame_path": "",
                    "ground_truth_emotion": emotion,
                    "_source_path": str(src),
                }
            )
            counts[emotion] += 1
            picked += 1
            print(f"  cache candidate: {emotion} ({src.name})")

    return candidates


def _load_via_datasets_streaming() -> list[dict[str, str]]:
    from datasets import load_dataset

    label_rows: list[dict[str, str]] = []
    counts: dict[str, int] = {name: 0 for name in FER_LABELS.values()}

    ds = load_dataset("gulsunnciftci/fer2013", split="train", streaming=True)
    for item in ds:
        if len(label_rows) >= TARGET_TOTAL:
            break
        emotion = FER_LABELS.get(int(item["label"]), "neutral")
        if counts[emotion] >= TARGET_PER_CLASS:
            continue
        img = _to_bgr(np.array(item["image"]))
        if not _validate_face_array(img):
            continue
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
        print(f"  {frame_id}: {emotion} via streaming ({img.shape[1]}x{img.shape[0]})")

    return label_rows


def _merge_rows(base: list[dict[str, str]], extra: list[dict[str, str]]) -> list[dict[str, str]]:
    """Append extra frames, renumbering frame_id/path and respecting per-class caps."""
    if not extra:
        return base
    counts: dict[str, int] = {}
    used_digest: set[str] = set()
    for r in base:
        counts[r["ground_truth_emotion"]] = counts.get(r["ground_truth_emotion"], 0) + 1
        dest = ROOT / r["frame_path"]
        if dest.exists():
            used_digest.add(_digest(dest.read_bytes()))
    merged = list(base)
    for row in extra:
        if len(merged) >= TARGET_TOTAL:
            break
        emo = row["ground_truth_emotion"]
        if counts.get(emo, 0) >= TARGET_PER_CLASS:
            continue
        src_path = row.get("_source_path")
        if src_path:
            src = Path(src_path)
        else:
            src = ROOT / row["frame_path"]
        if not src.exists():
            continue
        digest = _digest(src.read_bytes())
        if digest in used_digest:
            continue
        frame_id = f"f{len(merged) + 1:03d}"
        rel = f"fixtures/frames/{frame_id}.jpg"
        shutil.copy2(src, ROOT / rel)
        used_digest.add(digest)
        merged.append(
            {
                "frame_id": frame_id,
                "child_profile_id": "",
                "frame_path": rel,
                "ground_truth_emotion": emo,
            }
        )
        counts[emo] = counts.get(emo, 0) + 1
    return merged


def main() -> None:
    import sys

    use_streaming = "--streaming" in sys.argv or os.environ.get("SYNAPSE_FER_STREAMING") == "1"

    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("f*.jpg"):
        old.unlink()

    label_rows: list[dict[str, str]] = []

    # 1) Offline embedded bundle (instant; no HuggingFace calls).
    print("Loading embedded FER2013 crops (offline)...")
    label_rows = _load_from_embedded()

    # 2) Local HF image cache (unique crops only; merge never overwrites embedded files).
    if len(label_rows) < TARGET_TOTAL:
        print(f"Have {len(label_rows)} embedded; trying local HuggingFace cache...")
        try:
            label_rows = _merge_rows(label_rows, _load_from_hf_cache())
        except Exception as exc:
            print(f"Cache copy failed: {exc}")

    # 2b) Top-up disabled — use _merge_rows above (dedupes by image digest).
    if False and len(label_rows) < TARGET_TOTAL:
        train_dir = _hf_cache_train_dir()
        if train_dir:
            class_counts: dict[str, int] = {}
            for r in label_rows:
                class_counts[r["ground_truth_emotion"]] = class_counts.get(r["ground_truth_emotion"], 0) + 1
            used_src: set[str] = set()
            for r in label_rows:
                dest = ROOT / r["frame_path"]
                if not dest.exists():
                    continue
                used_src.add(_digest(dest.read_bytes()))
            for emotion in FER_LABELS.values():
                emo_dir = train_dir / emotion
                if not emo_dir.is_dir():
                    continue
                for src in sorted(emo_dir.glob("*.jpg")):
                    if len(label_rows) >= TARGET_TOTAL:
                        break
                    if class_counts.get(emotion, 0) >= TARGET_PER_CLASS:
                        break
                    digest = src.read_bytes()
                    key = _digest(digest)
                    if key in used_src:
                        continue
                    img = cv2.imdecode(np.frombuffer(digest, np.uint8), cv2.IMREAD_COLOR)
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
                    used_src.add(key)
                    class_counts[emotion] = class_counts.get(emotion, 0) + 1
                    print(f"  {frame_id}: {emotion} cache top-up ({src.name})")

    # 3) Streaming only when explicitly requested (can hang on rate limits).
    if use_streaming and len(label_rows) < TARGET_TOTAL:
        print("Trying datasets streaming (opt-in; may be slow)...")
        try:
            streamed = _load_via_datasets_streaming()
            label_rows = _merge_rows(label_rows, streamed)
        except Exception as exc:
            print(f"Streaming failed: {exc}")

    min_frames = 12
    if len(label_rows) < min_frames:
        raise RuntimeError(
            f"Only built {len(label_rows)}/{min_frames} FER2013 frames. "
            "fixtures/embedded_fer2013.json is missing or corrupt."
        )
    if len(label_rows) < TARGET_TOTAL:
        print(
            f"Note: built {len(label_rows)}/{TARGET_TOTAL} frames (offline). "
            "Run with --streaming when online to reach 35."
        )

    _label_rows_to_csv(label_rows)
    _save_embedded(label_rows)

    emotions = sorted({r["ground_truth_emotion"] for r in label_rows})
    from collections import Counter

    counts = Counter(r["ground_truth_emotion"] for r in label_rows)
    print(f"Class distribution: {dict(sorted(counts.items()))}")
    print(f"Built {len(label_rows)} real FER2013 frames ({', '.join(emotions)}) -> {FRAMES}")


if __name__ == "__main__":
    main()
