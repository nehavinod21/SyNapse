from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Iterable

import httpx

from services.eval_hooks import record_card_generation_event


_OLLAMA_BASE = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_GENERATE_URL = f"{_OLLAMA_BASE}/api/generate"
DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")


def _extract_json_array(text: str) -> list[Any]:
    # Try direct JSON first.
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            for key in ("labels", "cards", "items", "aac_labels"):
                value = parsed.get(key)
                if isinstance(value, list):
                    return value
    except Exception:
        pass

    # Fallback: find the first array-like block.
    m = re.search(r"\[[\s\S]*\]", text)
    if not m:
        return []
    try:
        parsed = json.loads(m.group(0))
        if isinstance(parsed, list):
            return parsed
    except Exception:
        return []
    return []


async def generate_aac_cards(
    emotion: str,
    age: int,
    diagnosis: str,
    interests: list[str],
    topic: str,
) -> list[str]:
    """
    Generate exactly 8 AAC labels as a JSON array. Returns [] on any error.
    """
    started = time.perf_counter()
    fallback_reason: str | None = None
    interests_preview = ", ".join(interests[:8]) if interests else "(none)"
    prompt = (
        "You are an assistive communication specialist.\n"
        "Generate exactly 8 short AAC labels for a minimally verbal neurodiverse child.\n"
        "Constraints:\n"
        "- Output must be ONLY a JSON array of 8 strings.\n"
        "- No other text.\n"
        "- Each string should be 1-3 words, with no emojis and no punctuation.\n"
        f"- Emotion: {emotion}\n"
        f"- Age: {age}\n"
        f"- Diagnosis: {diagnosis}\n"
        f"- Interests: {interests_preview}\n"
        f"- Topic: {topic}\n"
        "Return the JSON array now."
    )

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 128},
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(OLLAMA_GENERATE_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            response_text = str(data.get("response") or "")
        labels = _extract_json_array(response_text)
        if not labels or len(labels) != 8:
            fallback_reason = "malformed_json"
            record_card_generation_event(
                emotion=emotion,
                topic=topic,
                used_llm=False,
                fallback_reason=fallback_reason,
                duration_seconds=time.perf_counter() - started,
            )
            return []
        normalized: list[str] = []
        for item in labels:
            s = str(item).strip()
            if not s:
                fallback_reason = "malformed_json"
                record_card_generation_event(
                    emotion=emotion,
                    topic=topic,
                    used_llm=False,
                    fallback_reason=fallback_reason,
                    duration_seconds=time.perf_counter() - started,
                )
                return []
            normalized.append(s)
        record_card_generation_event(
            emotion=emotion,
            topic=topic,
            used_llm=True,
            fallback_reason=None,
            duration_seconds=time.perf_counter() - started,
        )
        return normalized
    except httpx.TimeoutException:
        fallback_reason = "timeout"
    except Exception:
        fallback_reason = "other_error"
    record_card_generation_event(
        emotion=emotion,
        topic=topic,
        used_llm=False,
        fallback_reason=fallback_reason or "other_error",
        duration_seconds=time.perf_counter() - started,
    )
    return []


async def generate_assessment_narrative(
    child_name: str,
    emotion_dist: dict[str, float],
    phase_notes: dict[str, str],
    top_cards: Iterable[dict[str, Any]],
) -> str:
    """
    Asks LLM to write a 3-sentence clinical summary.
    Returns a rule-based fallback string on any error.
    """
    dominant = "neutral"
    try:
        if emotion_dist:
            dominant = max(emotion_dist.items(), key=lambda kv: float(kv[1]))[0]
    except Exception:
        dominant = "neutral"

    notes_compact = " ".join(
        [f"Phase {k}: {v}" for k, v in list(phase_notes.items())[:6] if str(v).strip()]
    ) or "(no notes)"

    top_labels = []
    try:
        for c in top_cards:
            if isinstance(c, dict) and "label" in c:
                top_labels.append(str(c["label"]))
            elif isinstance(c, str):
                top_labels.append(c)
            if len(top_labels) >= 5:
                break
    except Exception:
        top_labels = []
    top_cards_preview = ", ".join(top_labels) if top_labels else "N/A"

    prompt = (
        "Write a clinical summary in plain language for a SEND assessment.\n"
        "Requirements:\n"
        "- Exactly 3 sentences.\n"
        "- Mention the child's engagement/emotional state (dominant emotion).\n"
        "- Reference the main phase notes (summarize briefly).\n"
        "- Reference the most selected communication cards.\n"
        f"Child: {child_name}\n"
        f"Dominant emotion: {dominant}\n"
        f"Phase notes: {notes_compact}\n"
        f"Top cards: {top_cards_preview}\n"
        "3 sentences only."
    )

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(OLLAMA_GENERATE_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            response_text = str(data.get("response") or "").strip()
            # Basic sanity: ensure it's not empty.
            if response_text:
                # Keep as-is; enforce roughly 3 sentences by trimming extra whitespace.
                return response_text
    except Exception:
        pass

    # Rule-based fallback (deterministic, 3-ish sentences).
    phase_preview = " ".join(
        [f"Phase {k} highlights: {v}" for k, v in list(phase_notes.items())[:2] if str(v).strip()]
    ).strip()
    if not phase_preview:
        phase_preview = "Phase notes were recorded across the assessment."

    return (
        f"During this SEND phase, {child_name} showed a dominant emotional pattern of {dominant}. "
        f"{phase_preview} "
        f"Communication responses were most consistent with cards such as {top_cards_preview}."
    )


async def answer_project_support_question(question: str) -> str:
    """
    Answer visitor questions about the SyNAPSE project.
    Returns an empty string if LLM is unavailable; caller should fallback to FAQ.
    """
    cleaned = " ".join(str(question or "").split())
    if not cleaned:
        return ""

    prompt = (
        "You are the public support assistant for a student project called SyNAPSE.\n"
        "Answer only using these project facts:\n"
        "- SyNAPSE is an emotion-aware AAC platform for minimally verbal neurodiverse children.\n"
        "- It has 4 roles: student, teacher, caregiver, SEND officer.\n"
        "- Emotion detection uses DeepFace with 7 emotions.\n"
        "- AAC board has 16 cards: 8 core, 4 emotion, 4 topic.\n"
        "- Alerts for cautious emotions (sad/angry/fear/disgust) with confidence threshold 0.45.\n"
        "- Alerts route to teacher for school sessions and caregiver for home sessions.\n"
        "- Monitoring runs every 6 minutes.\n"
        "- It supports English and Arabic.\n"
        "- No video is stored; only metadata logs are saved.\n"
        "- Stack: FastAPI, React, SQLite, Ollama, WebSockets, ReportLab.\n"
        "- Reports include session PDF and KHDA-style SEND workflow outputs.\n"
        "Rules:\n"
        "- Keep response concise (3-5 sentences).\n"
        "- Be clear and friendly.\n"
        "- If asked about something outside these facts, say this project does not include it.\n"
        f"Question: {cleaned}\n"
        "Answer:"
    )

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OLLAMA_GENERATE_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            text = str(data.get("response") or "").strip()
            return text
    except Exception:
        return ""

