"""Offline FER2013 face crops — used when HF Hub is rate-limited."""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

import cv2
import numpy as np

from _common import FER_LABELS

HF_BASE = "https://huggingface.co/datasets/gulsunnciftci/fer2013/resolve/main/"
HF_API = "https://huggingface.co/api/datasets/gulsunnciftci/fer2013"
TARGET_PER_CLASS = 2
TARGET_TOTAL = 12
_CACHE: list[tuple[str, str]] | None = None


def _class_name(label: int) -> str:
    return FER_LABELS.get(label, "neutral")


def _discover_paths() -> list[tuple[str, str]]:
  """Return (relative_path, emotion) for 12 stratified train images."""
  req = urllib.request.Request(HF_API, headers={"User-Agent": "synapse-eval/1.0"})
  payload = json.loads(urllib.request.urlopen(req, timeout=60).read())
  by_emotion: dict[str, list[str]] = {name: [] for name in FER_LABELS.values()}
  for entry in payload.get("siblings", []):
    rel = entry.get("rfilename", "")
    if not rel.startswith("train/") or not rel.endswith(".jpg"):
      continue
    parts = rel.split("/")
    if len(parts) < 3:
      continue
    emotion = parts[1]
    if emotion in by_emotion and len(by_emotion[emotion]) < TARGET_PER_CLASS:
      by_emotion[emotion].append(rel)

  out: list[tuple[str, str]] = []
  for emotion in FER_LABELS.values():
    for rel in by_emotion[emotion]:
      out.append((rel, emotion))
      if len(out) >= TARGET_TOTAL:
        return out
  return out


def _download_b64(rel: str) -> str:
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


def embedded_samples() -> list[tuple[str, str]]:
  """Lazily build/cache base64 JPEGs from direct HF file URLs."""
  global _CACHE
  if _CACHE is not None:
    return _CACHE

  cache_file = Path(__file__).with_name("_embedded_fer2013_cache.json")
  if cache_file.exists():
    raw = json.loads(cache_file.read_text(encoding="utf-8"))
    _CACHE = [(item["b64"], item["emotion"]) for item in raw]
    return _CACHE

  paths = _discover_paths()
  if len(paths) < TARGET_TOTAL:
    raise RuntimeError(f"Only discovered {len(paths)}/{TARGET_TOTAL} FER2013 paths")

  built: list[dict[str, str]] = []
  for rel, emotion in paths[:TARGET_TOTAL]:
    built.append({"emotion": emotion, "b64": _download_b64(rel)})
  cache_file.write_text(json.dumps(built), encoding="utf-8")
  _CACHE = [(item["b64"], item["emotion"]) for item in built]
  return _CACHE
