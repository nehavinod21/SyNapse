from __future__ import annotations

import asyncio
import logging
import threading
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger("synapse.deepface")

_inference_lock = threading.Lock()
_warmed_up = False

_MAX_IMAGE_DIM = 320
_MIN_FACE_DIM = 224
_SMALL_CROP_THRESHOLD = 96
_DETECTOR_BACKEND = "opencv"
_HAAR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

ALLOWED_EMOTIONS = frozenset(
    {"happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"}
)


def _neutral_result() -> dict[str, Any]:
    return {
        "emotion": "neutral",
        "confidence": 0.0,
        "intensity": 1,
        "all_scores": {
            "happy": 0.0,
            "sad": 0.0,
            "angry": 0.0,
            "fear": 0.0,
            "disgust": 0.0,
            "surprise": 0.0,
            "neutral": 1.0,
        },
    }


def _decode_image(image_bytes: bytes) -> np.ndarray | None:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _is_placeholder_or_blank(img: np.ndarray) -> bool:
    """Reject flat-color blocks and low-texture non-face inputs."""
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


def _upscale_fer_crop(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
    return cv2.resize(rgb, (_MIN_FACE_DIM, _MIN_FACE_DIM), interpolation=cv2.INTER_CUBIC)


def _crop_largest_face(img: np.ndarray) -> np.ndarray | None:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _HAAR.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(48, 48))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad = int(0.15 * max(w, h))
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(img.shape[1], x + w + pad)
    y1 = min(img.shape[0], y + h + pad)
    crop = img[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    return cv2.resize(crop, (_MIN_FACE_DIM, _MIN_FACE_DIM), interpolation=cv2.INTER_CUBIC)


def _prepare_image(img: np.ndarray) -> tuple[np.ndarray | None, bool]:
    """
    Return (image_for_deepface, skip_detector).
    Returns (None, False) when no usable face region is found for large frames.
    """
    if _is_placeholder_or_blank(img):
        return None, False

    height, width = img.shape[:2]
    max_dim = max(height, width)

    if max_dim <= _SMALL_CROP_THRESHOLD:
        return _upscale_fer_crop(img), True

    working = img
    if max_dim > _MAX_IMAGE_DIM:
        scale = _MAX_IMAGE_DIM / max_dim
        working = cv2.resize(
            img,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA,
        )

    face = _crop_largest_face(working)
    if face is not None:
        return face, True

    return None, False


def _parse_deepface_result(result: Any) -> dict[str, Any]:
    if isinstance(result, list) and result:
        result = result[0]

    dominant = str(result.get("dominant_emotion") or "neutral")
    if dominant not in ALLOWED_EMOTIONS:
        dominant = "neutral"
    scores = result.get("emotion") or {}

    normalized_scores: dict[str, float] = {}
    for key, value in scores.items():
        try:
            score = float(value)
        except Exception:
            continue
        normalized_scores[str(key)] = (score / 100.0) if score > 1.0 else score

    confidence = normalized_scores.get(dominant, 0.0)
    intensity = max(1, min(10, int(round(confidence * 10)) or 1))

    return {
        "emotion": dominant,
        "confidence": float(confidence),
        "intensity": int(intensity),
        "all_scores": normalized_scores,
    }


def _run_deepface(img: np.ndarray, *, enforce_detection: bool) -> dict[str, Any]:
    from deepface import DeepFace

    backend = "skip" if not enforce_detection else _DETECTOR_BACKEND
    result = DeepFace.analyze(
        img_path=img,
        actions=["emotion"],
        enforce_detection=enforce_detection,
        detector_backend=backend,
        silent=True,
    )
    return _parse_deepface_result(result)


def _locked_run_deepface(img: np.ndarray, *, enforce_detection: bool) -> dict[str, Any]:
    with _inference_lock:
        return _run_deepface(img, enforce_detection=enforce_detection)


async def warmup_deepface() -> None:
    global _warmed_up
    if _warmed_up:
        return

    logger.info("Warming up DeepFace emotion model...")
    try:
        await asyncio.to_thread(
            _locked_run_deepface,
            np.full((_MIN_FACE_DIM, _MIN_FACE_DIM, 3), 128, dtype=np.uint8),
            enforce_detection=False,
        )
        _warmed_up = True
        logger.info("DeepFace warmup complete")
    except Exception as exc:
        logger.warning("DeepFace warmup failed (will retry on first request): %s", exc)


async def detect_emotion(image_bytes: bytes) -> dict[str, Any]:
    """
    Detect emotion from raw image bytes using DeepFace.
    Returns neutral with zero confidence when no face or placeholder input.
    """
    img = _decode_image(image_bytes)
    if img is None:
        return _neutral_result()

    prepared, is_tight_crop = _prepare_image(img)
    if prepared is None:
        return _neutral_result()

    enforce_detection = not is_tight_crop

    try:
        return await asyncio.to_thread(
            _locked_run_deepface, prepared, enforce_detection=enforce_detection
        )
    except Exception:
        if enforce_detection:
            try:
                return await asyncio.to_thread(
                    _locked_run_deepface, prepared, enforce_detection=False
                )
            except Exception:
                return _neutral_result()
        return _neutral_result()
