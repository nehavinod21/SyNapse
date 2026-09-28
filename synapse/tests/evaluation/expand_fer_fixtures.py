# -*- coding: utf-8 -*-
"""Build a balanced FER-2013 pilot set from the local HuggingFace cache.

Default: 20 crops x 7 classes = 140 frames (citable FER-2013 subset).
Supports --total N with redistribution when a rare class (e.g. disgust) cannot fill.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import shutil
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

from _common import EVAL_DIR, FER_LABELS
from prepare_fixtures import (
    FRAMES,
    LABELS,
    _hf_cache_split_dir,
    _validate_face_array,
)

CLASSES = list(FER_LABELS.values())


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _per_class_targets(per_class: int | None, total: int | None) -> dict[str, int]:
    if per_class is not None and total is not None:
        raise SystemExit("Pass only one of --per-class or --total")
    if total is not None:
        if total < len(CLASSES):
            raise SystemExit(f"--total must be >= {len(CLASSES)}")
        base, rem = divmod(total, len(CLASSES))
        return {emo: base + (1 if i < rem else 0) for i, emo in enumerate(CLASSES)}
    if per_class is None:
        per_class = 20
    return {emo: per_class for emo in CLASSES}


def _iter_valid(emo_dir: Path, used: set[str]):
    """Yield (src, digest, img) for unique validated crops."""
    if not emo_dir.is_dir():
        return
    for src in sorted(emo_dir.glob("*.jpg")):
        raw = src.read_bytes()
        key = _digest(raw)
        if key in used:
            continue
        img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
        if not _validate_face_array(img):
            continue
        yield src, key, img


def build(
    per_class: int | None = None,
    total: int | None = None,
    split: str = "test",
) -> list[dict[str, str]]:
    targets = _per_class_targets(per_class, total)
    wanted = sum(targets.values())
    split_dir = _hf_cache_split_dir(split)
    if split_dir is None:
        raise SystemExit(
            f"No local FER-2013 HuggingFace cache '{split}' folder found under "
            "~/.cache/huggingface/hub/datasets--gulsunnciftci--fer2013/snapshots/*/."
        )
    print(f"Using FER-2013 split={split!r} from {split_dir}")

    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("f*.jpg"):
        old.unlink()

    # Per-class iterators over remaining valid crops.
    used: set[str] = set()
    iterators = {emo: _iter_valid(split_dir / emo, used) for emo in CLASSES}
    picked: dict[str, list[Path]] = {emo: [] for emo in CLASSES}

    # Pass 1: honor per-class targets.
    for emo in CLASSES:
        need = targets[emo]
        for src, key, _img in iterators[emo]:
            if len(picked[emo]) >= need:
                break
            used.add(key)
            picked[emo].append(src)
        print(f"  pass1 {emo}: {len(picked[emo])}/{need}")

    # Pass 2: redistribute shortfall onto classes that still have crops.
    have = sum(len(v) for v in picked.values())
    shortfall = wanted - have
    if shortfall > 0:
        print(f"Redistributing shortfall={shortfall} onto remaining classes...")
        progressed = True
        while shortfall > 0 and progressed:
            progressed = False
            for emo in CLASSES:
                if shortfall <= 0:
                    break
                try:
                    src, key, _img = next(iterators[emo])
                except StopIteration:
                    continue
                used.add(key)
                picked[emo].append(src)
                shortfall -= 1
                progressed = True
        if shortfall > 0:
            print(f"WARNING: still short by {shortfall} (cache exhausted / filters).")

    # Write frames in class order for stable labels.csv.
    rows: list[dict[str, str]] = []
    counts: Counter[str] = Counter()
    for emo in CLASSES:
        for src in picked[emo]:
            frame_id = f"f{len(rows) + 1:04d}"
            rel = f"fixtures/frames/{frame_id}.jpg"
            shutil.copy2(src, EVAL_DIR / rel)
            counts[emo] += 1
            rows.append(
                {
                    "frame_id": frame_id,
                    "child_profile_id": "",
                    "frame_path": rel,
                    "ground_truth_emotion": emo,
                }
            )

    with LABELS.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["frame_id", "child_profile_id", "frame_path", "ground_truth_emotion"],
        )
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} frames (wanted {wanted}) -> {FRAMES}")
    print(f"Class distribution: {dict(sorted(counts.items()))}")
    return rows


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--per-class", type=int, default=None, help="crops per emotion class")
    p.add_argument("--total", type=int, default=None, help="total crops, split across 7 classes")
    p.add_argument(
        "--split",
        choices=("train", "test"),
        default="test",
        help="FER-2013 partition (default: test = held-out eval)",
    )
    args = p.parse_args()
    if args.per_class is None and args.total is None:
        args.per_class = 20
    if args.per_class is not None and args.per_class < 1:
        raise SystemExit("--per-class must be >= 1")
    if args.total is not None and args.total < 1:
        raise SystemExit("--total must be >= 1")
    build(per_class=args.per_class, total=args.total, split=args.split)


if __name__ == "__main__":
    main()
