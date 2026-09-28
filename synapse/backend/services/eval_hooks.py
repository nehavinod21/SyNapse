"""Lightweight in-memory hooks for IEEE evaluation scripts (not production telemetry)."""

from __future__ import annotations

from typing import Any

CARD_GENERATION_EVENTS: list[dict[str, Any]] = []


def record_card_generation_event(**fields: Any) -> None:
    CARD_GENERATION_EVENTS.append(dict(fields))


def clear_card_generation_events() -> None:
    CARD_GENERATION_EVENTS.clear()
