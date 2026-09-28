#!/usr/bin/env python3

"""Benchmark Ollama AAC card generation (30+ runs)."""

from __future__ import annotations



import asyncio

import itertools

import os

import time



os.environ.setdefault("OLLAMA_MODEL", "llama3.2:3b")



from _common import bootstrap_backend, ensure_results, run_async, init_db_and_seed, utc_now_iso, write_csv



OUT = ensure_results() / "llm_card_generation_benchmark.csv"

FIELDS = [

    "run_id",

    "timestamp",

    "child_profile_id",

    "emotion",

    "topic",

    "duration_seconds",

    "cpu_percent",

    "memory_mb",

    "output_valid_json",

    "fell_back_to_rule_based",

    "error_message",

]





def resource_snapshot() -> tuple[float, float]:

    try:

        import psutil



        proc = psutil.Process()

        return round(psutil.cpu_percent(interval=None), 2), round(proc.memory_info().rss / (1024 * 1024), 2)

    except Exception:

        return -1.0, -1.0





async def load_children():

    from sqlalchemy import select

    from database import async_session

    from models import Child



    async with async_session() as db:

        res = await db.execute(select(Child))

        return list(res.scalars().all())





async def run_bench() -> list[dict]:

    from services.llm_service import generate_aac_cards



    children = await load_children()

    emotions = ["happy", "sad", "angry", "fear", "neutral", "surprise"]

    topics = ["school", "home", "play", "food", "feelings", "body"]

    combos = list(itertools.islice(itertools.product(children, emotions, topics), 36))

    rows = []

    for i, (child, emotion, topic) in enumerate(combos, start=1):

        import json



        try:

            interests = json.loads(child.interests or "[]")

        except Exception:

            interests = []

        cpu, mem = resource_snapshot()

        t0 = time.perf_counter()

        err = ""

        try:

            labels = await generate_aac_cards(emotion, child.age, child.diagnosis, interests, topic)

            valid = isinstance(labels, list) and len(labels) == 8 and all(isinstance(x, str) for x in labels)

            fallback = not (labels and len(labels) >= 6)

        except Exception as exc:

            labels, valid, fallback, err = [], False, True, str(exc)

        cpu2, mem2 = resource_snapshot()

        rows.append(

            {

                "run_id": i,

                "timestamp": utc_now_iso(),

                "child_profile_id": child.id,

                "emotion": emotion,

                "topic": topic,

                "duration_seconds": round(time.perf_counter() - t0, 6),

                "cpu_percent": cpu2 if cpu2 >= 0 else cpu,

                "memory_mb": mem2 if mem2 >= 0 else mem,

                "output_valid_json": valid,

                "fell_back_to_rule_based": fallback,

                "error_message": err,

            }

        )

    return rows





def main() -> None:

    bootstrap_backend()

    run_async(init_db_and_seed())

    rows = run_async(run_bench())

    n = write_csv(OUT, FIELDS, rows)

    print(f"Wrote {n} rows -> {OUT}")





if __name__ == "__main__":

    main()

