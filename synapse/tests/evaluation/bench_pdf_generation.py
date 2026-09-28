#!/usr/bin/env python3
"""Benchmark PDF generation (30 runs)."""
from __future__ import annotations

import time
from pathlib import Path

from _common import RESULTS_DIR, bootstrap_backend, ensure_results, utc_now_iso, write_csv, run_async, init_db_and_seed

OUT = ensure_results() / "pdf_generation_benchmark.csv"
FIELDS = ["run_id", "timestamp", "duration_seconds", "success", "error_message"]


def sample_payload() -> dict:
    return {
        "assessment_id": "bench-pdf",
        "status": "completed",
        "child_name": "Ahmed Al Mansoori",
        "child_age": 7,
        "diagnosis": "ASD",
        "send_officer_name": "Dr. Khalid Al Mansoori",
        "scheduled_date": utc_now_iso(),
        "completed_at": utc_now_iso(),
        "emotion_distribution": {"happy": 40.0, "neutral": 60.0},
        "top_cards": [{"label": "Help", "count": 3}],
        "phase_notes": {"1": "Observed engagement", "2": "AAC trials"},
        "ai_narrative": "Bench narrative.",
        "recommendations": ["Continue visual supports"],
    }


def main() -> None:
    bootstrap_backend()
    run_async(init_db_and_seed())
    from services.pdf_service import generate_assessment_report

    rows = []
    payload = sample_payload()
    for i in range(1, 31):
        t0 = time.perf_counter()
        ok, err = True, ""
        try:
            data = generate_assessment_report(payload)
            ok = bool(data)
        except Exception as exc:
            ok, err = False, str(exc)
        rows.append(
            {
                "run_id": i,
                "timestamp": utc_now_iso(),
                "duration_seconds": round(time.perf_counter() - t0, 6),
                "success": ok,
                "error_message": err,
            }
        )
    n = write_csv(OUT, FIELDS, rows)
    print(f"Wrote {n} rows -> {OUT}")


if __name__ == "__main__":
    main()
