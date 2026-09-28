#!/usr/bin/env python3

"""Measure session WebSocket latency after emotion detect POST."""

from __future__ import annotations



import io

import time

import uuid

from datetime import datetime, timezone



from _common import bootstrap_backend, ensure_results, get_test_client, init_db_and_seed, login_token, run_async, write_csv



OUT = ensure_results() / "websocket_latency.csv"

FIELDS = ["event_id", "timestamp_written", "timestamp_received", "latency_seconds"]





def ts() -> str:

    return datetime.now(timezone.utc).isoformat()





def main() -> None:

    bootstrap_backend()

    run_async(init_db_and_seed())

    client = get_test_client()

    from sqlalchemy import select

    from database import async_session

    from models import Child



    async def setup():

        async with async_session() as db:

            return (await db.execute(select(Child).limit(1))).scalar_one()



    child = run_async(setup())

    token = login_token(client, "teacher")

    r = client.post(

        "/api/sessions/start",

        json={"child_id": child.id, "session_type": "classroom", "topic": "school"},

        headers={"Authorization": f"Bearer {token}"},

    )

    session_id = r.json()["id"]

    rows = []

    with client.websocket_connect(f"/ws/session/{session_id}") as ws:

        for _ in range(30):

            event_id = str(uuid.uuid4())

            t0 = time.perf_counter()

            written_at = ts()

            resp = client.post(

                "/api/emotion/detect",

                data={"session_id": session_id},

                files={"file": ("f.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")},

                headers={"Authorization": f"Bearer {token}"},

            )

            if resp.status_code != 200:

                continue

            ws.receive_json()

            received_at = ts()

            rows.append(

                {

                    "event_id": event_id,

                    "timestamp_written": written_at,

                    "timestamp_received": received_at,

                    "latency_seconds": round(time.perf_counter() - t0, 6),

                }

            )

    n = write_csv(OUT, FIELDS, rows)

    print(f"Wrote {n} rows -> {OUT}")





if __name__ == "__main__":

    main()

