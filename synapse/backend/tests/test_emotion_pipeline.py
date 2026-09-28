from __future__ import annotations

import asyncio
from pathlib import Path

import cv2
import numpy as np
import pytest

EVAL = Path(__file__).resolve().parents[2] / "tests" / "evaluation"
FIXTURE = EVAL / "fixtures" / "frames" / "f001.jpg"

ALLOWED = {"happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"}


@pytest.fixture(scope="module")
def real_face_bytes():
    assert FIXTURE.exists(), f"Missing benchmark fixture {FIXTURE}"
    return FIXTURE.read_bytes()


def test_real_face_returns_valid_emotion_label(real_face_bytes):
    from services.deepface_service import detect_emotion

    result = asyncio.run(detect_emotion(real_face_bytes))
    assert result["emotion"] in ALLOWED
    assert 0.0 <= float(result["confidence"]) <= 1.0


def test_blank_image_handled_gracefully():
    from services.deepface_service import detect_emotion

    blank = np.full((240, 320, 3), 200, dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", blank)
    assert ok
    result = asyncio.run(detect_emotion(buf.tobytes()))
    assert result["emotion"] in ALLOWED
    assert float(result["confidence"]) < 0.5
