#!/usr/bin/env python3
"""Record LLM vs rule-based fallback across 100+ card generations."""
from __future__ import annotations

import itertools
import os
import time
import uuid

os.environ.setdefault("OLLAMA_MODEL", "llama3.2:3b")

from _common import bootstrap_backend, ensure_results, get_test_client, init_db_and_seed, login_token, run_async, write_csv

OUT = ensure_results() / "fallback_trigger_rate.csv"
FIELDS = [
    "event_id",
    "child_profile_id",
    "emotion",
    "topic",
    "used_llm",
    "fallback_reason",
    "duration_seconds",
]


def children_and_session(client):
    from sqlalchemy import select
    from database import async_session
    from models import Child

    async def load():
        async with async_session() as db:
            return list((await db.execute(select(Child))).scalars().all())

    kids = run_async(load())
    child = kids[0]
    tok = login_token(client, "teacher")
    r = client.post(
        "/api/sessions/start",
        json={"child_id": child.id, "session_type": "classroom", "topic": "school"},
        headers={"Authorization": f"Bearer {tok}"},
    )
    return kids, r.json()["id"], tok


def main() -> None:
    bootstrap_backend()
    from services.eval_hooks import CARD_GENERATION_EVENTS, clear_card_generation_events

    run_async(init_db_and_seed())
    clear_card_generation_events()
    client = get_test_client()
    kids, session_id, tok = children_and_session(client)
    emotions = ["happy", "sad", "angry", "fear", "neutral", "surprise", "disgust"]
    topics = ["school", "home", "play", "food", "feelings", "body"]
    combos = list(itertools.islice(itertools.product(kids, emotions, topics), 120))
    rows = []
    for child, emotion, topic in combos:
        t0 = time.perf_counter()
        r = client.post(
            "/api/cards/generate",
            json={"session_id": session_id, "emotion": emotion, "child_id": child.id, "topic": topic},
            headers={"Authorization": f"Bearer {tok}"},
        )
        dur = round(time.perf_counter() - t0, 6)
        source = r.json().get("source", "rule_based") if r.status_code == 200 else "error"
        hook = CARD_GENERATION_EVENTS[-1] if CARD_GENERATION_EVENTS else {}
        rows.append(
            {
                "event_id": str(uuid.uuid4()),
                "child_profile_id": child.id,
                "emotion": emotion,
                "topic": topic,
                "used_llm": source == "llm",
                "fallback_reason": hook.get("fallback_reason") or ("" if source == "llm" else "rule_based"),
                "duration_seconds": hook.get("duration_seconds", dur),
            }
        )
    n = write_csv(OUT, FIELDS, rows)
    print(f"Wrote {n} rows -> {OUT}")


if __name__ == "__main__":
    main()
