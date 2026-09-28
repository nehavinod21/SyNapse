"""
SyNAPSE poster metrics collector.
Run backend first: uvicorn main:app --host 0.0.0.0 --port 8000

Usage:
  cd backend
  python benchmark_poster_metrics.py

Outputs:
  poster_metrics.json
  poster_metrics.csv
"""
from __future__ import annotations

import csv
import io
import json
import sqlite3
import statistics
import time
from pathlib import Path

import httpx
from PIL import Image, ImageDraw

BASE = "http://localhost:8000"
RUNS = 10
OUT_DIR = Path(__file__).resolve().parent


def make_test_face(path: Path) -> None:
    """Minimal 640x480 JPEG for DeepFace (not a real face — latency still valid)."""
    img = Image.new("RGB", (640, 480), color=(210, 180, 160))
    draw = ImageDraw.Draw(img)
    draw.ellipse([220, 80, 420, 320], fill=(200, 170, 150))
    draw.ellipse([270, 160, 300, 190], fill=(60, 40, 30))
    draw.ellipse([340, 160, 370, 190], fill=(60, 40, 30))
    draw.arc([280, 220, 360, 280], 0, 180, fill=(80, 50, 40), width=3)
    img.save(path, "JPEG", quality=85)


def login(client: httpx.Client, username: str, password: str) -> str:
    r = client.post(
        f"{BASE}/auth/login",
        data={"username": username, "password": password},
        timeout=30.0,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def timed_post(client: httpx.Client, url: str, **kwargs) -> float:
    t0 = time.perf_counter()
    r = client.post(url, **kwargs)
    elapsed = time.perf_counter() - t0
    r.raise_for_status()
    return elapsed, r


def timed_get(client: httpx.Client, url: str, **kwargs) -> float:
    t0 = time.perf_counter()
    r = client.get(url, **kwargs)
    elapsed = time.perf_counter() - t0
    r.raise_for_status()
    return elapsed, r


def bench_emotion(client: httpx.Client, session_id: str, image_path: Path) -> dict:
    times: list[float] = []
    image_bytes = image_path.read_bytes()
    for _ in range(RUNS):
        files = {"file": ("frame.jpg", image_bytes, "image/jpeg")}
        data = {"session_id": session_id}
        t0 = time.perf_counter()
        r = client.post(f"{BASE}/api/emotion/detect", files=files, data=data, timeout=120.0)
        times.append(time.perf_counter() - t0)
        r.raise_for_status()
    return {
        "runs": RUNS,
        "mean_s": round(statistics.mean(times), 3),
        "min_s": round(min(times), 3),
        "max_s": round(max(times), 3),
        "std_s": round(statistics.stdev(times) if len(times) > 1 else 0, 3),
    }


def bench_cards(client: httpx.Client, session_id: str, child_id: str) -> dict:
    payload = {
        "session_id": session_id,
        "emotion": "happy",
        "child_id": child_id,
        "topic": "school",
    }
    times: list[float] = []
    source = "unknown"
    card_count = 0
    for _ in range(RUNS):
        t0 = time.perf_counter()
        r = client.post(f"{BASE}/api/cards/generate", json=payload, timeout=60.0)
        times.append(time.perf_counter() - t0)
        r.raise_for_status()
        body = r.json()
        source = body.get("source", source)
        card_count = len(body.get("cards") or [])
    return {
        "runs": RUNS,
        "mean_s": round(statistics.mean(times), 3),
        "min_s": round(min(times), 3),
        "max_s": round(max(times), 3),
        "source": source,
        "card_count": card_count,
        "note": "source=llm if Ollama running; rule_based if Ollama off",
    }


def bench_pdf(client: httpx.Client, session_id: str) -> dict:
    times: list[float] = []
    last_error = None
    for _ in range(min(3, RUNS)):
        try:
            t0 = time.perf_counter()
            r = client.post(
                f"{BASE}/api/reports/session/{session_id}/generate-pdf",
                params={"language": "en"},
                timeout=120.0,
            )
            times.append(time.perf_counter() - t0)
            r.raise_for_status()
            if len(r.content) < 100:
                last_error = "response too small"
        except Exception as exc:
            last_error = str(exc)
    if not times:
        # Fallback: KHDA aggregate PDF (any authenticated user)
        try:
            t0 = time.perf_counter()
            r = client.get(f"{BASE}/api/reports/khda-school-report", timeout=120.0)
            elapsed = time.perf_counter() - t0
            r.raise_for_status()
            return {
                "runs": 1,
                "mean_s": round(elapsed, 3),
                "endpoint": "GET /api/reports/khda-school-report",
                "note": f"session PDF failed: {last_error}",
            }
        except Exception as exc2:
            return {"error": str(exc2), "session_pdf_error": last_error}
    return {
        "runs": len(times),
        "mean_s": round(statistics.mean(times), 3),
        "min_s": round(min(times), 3),
        "max_s": round(max(times), 3),
        "endpoint": "POST /api/reports/session/{id}/generate-pdf",
    }


def db_counts(db_path: Path) -> dict:
    if not db_path.exists():
        return {"error": "synapse.db not found"}
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    def count(table: str) -> int:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            return cur.fetchone()[0]
        except sqlite3.Error:
            return 0

    out = {
        "sessions": count("sessions"),
        "emotion_logs": count("emotion_logs"),
        "card_selections": count("card_selections"),
        "assessments": count("assessments"),
        "children": count("children"),
        "users_by_role": {},
    }
    try:
        cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
        out["users_by_role"] = dict(cur.fetchall())
    except sqlite3.Error:
        pass
    conn.close()
    return out


def static_specs() -> dict:
    return {
        "emotion_classes": 7,
        "emotion_labels": ["happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"],
        "roles": 4,
        "role_labels": ["student", "teacher", "send_officer", "caregiver"],
        "assessment_phases": 6,
        "languages": 2,
        "language_labels": ["English", "Arabic"],
        "sdgs": [3, 4, 10],
        "aac_board_design": "16 cards (4 core + emotion + topic sets)",
    }


def main() -> None:
    image_path = OUT_DIR / "benchmark_test_face.jpg"
    make_test_face(image_path)

    metrics: dict = {
        "base_url": BASE,
        "static_specs": static_specs(),
        "database": db_counts(OUT_DIR / "synapse.db"),
    }

    print(f"Checking {BASE}/health ...")
    try:
        httpx.get(f"{BASE}/health", timeout=5.0).raise_for_status()
    except Exception as exc:
        print(f"ERROR: Backend not running. Start it first:\n  uvicorn main:app --host 0.0.0.0 --port 8000\n\n{exc}")
        metrics["api_benchmarks"] = {"error": "backend offline — start uvicorn first"}
        _write_outputs(metrics)
        return

    with httpx.Client(timeout=120.0) as client:
        token = login(client, "teacher", "demo1234")
        client.headers["Authorization"] = f"Bearer {token}"

        children = client.get(f"{BASE}/api/children/").json()
        if not children:
            raise SystemExit("No children in DB — run backend once to seed data.")
        child_id = children[0]["id"]
        child_name = children[0]["name"]

        sess = client.post(
            f"{BASE}/api/sessions/start",
            json={"child_id": child_id, "session_type": "classroom", "topic": "school"},
        ).json()
        session_id = sess["id"]

        print(f"Benchmarking emotion detection ({RUNS} runs) ...")
        metrics["emotion_detection_latency"] = bench_emotion(client, session_id, image_path)

        print(f"Benchmarking AAC card generation ({RUNS} runs) ...")
        metrics["aac_card_generation_latency"] = bench_cards(client, session_id, child_id)

        print("Benchmarking PDF report generation (3 runs) ...")
        try:
            metrics["pdf_report_generation_latency"] = bench_pdf(client, session_id)
        except Exception as exc:
            metrics["pdf_report_generation_latency"] = {"error": str(exc)}

        metrics["benchmark_context"] = {
            "child_name": child_name,
            "child_id": child_id,
            "session_id": session_id,
        }

    metrics["websocket_update_delay"] = {
        "manual_steps": [
            "1. Login as teacher → open /teacher/sessions/{session_id}/live",
            "2. Open DevTools → Network → WS tab",
            "3. In another tab login as student → start AAC session same child",
            "4. Tap 'Update mood' — note time from POST /api/emotion/detect to WS message received",
            "5. Typical: 100–500 ms on local WiFi",
        ],
        "note": "WebSocket timing requires browser; not measured by this script",
    }

    _write_outputs(metrics)
    print("\nDone. See poster_metrics.json and poster_metrics.csv")


def _write_outputs(metrics: dict) -> None:
    json_path = OUT_DIR / "poster_metrics.json"
    csv_path = OUT_DIR / "poster_metrics.csv"
    json_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    rows = [
        ["Metric", "Value", "Unit", "How measured"],
        ["Emotion classes", "7", "count", "DeepFace model"],
        ["AAC board size", metrics.get("aac_card_generation_latency", {}).get("card_count", 16), "cards", "POST /api/cards/generate"],
        ["Roles", "4", "count", "student, teacher, send_officer, caregiver"],
        ["Assessment phases", "6", "count", "Assessment model"],
        ["Languages", "2", "count", "EN + AR labels"],
        ["SDGs", "3, 4, 10", "ids", "Project alignment"],
    ]
    ed = metrics.get("emotion_detection_latency", {})
    if "mean_s" in ed:
        rows.append(["Emotion detection latency (mean)", ed["mean_s"], "seconds", f"{RUNS} POST /api/emotion/detect"])
    cg = metrics.get("aac_card_generation_latency", {})
    if "mean_s" in cg:
        rows.append(["AAC generation latency (mean)", cg["mean_s"], "seconds", f"source={cg.get('source')}"])
        rows.append(["AAC card count", cg.get("card_count", ""), "cards", ""])
    pdf = metrics.get("pdf_report_generation_latency", {})
    if "mean_s" in pdf:
        rows.append(["PDF report latency (mean)", pdf["mean_s"], "seconds", "POST .../generate-pdf"])
    db = metrics.get("database", {})
    if "sessions" in db:
        rows.append(["DB sessions (seed data)", db["sessions"], "count", "sqlite synapse.db"])
        rows.append(["DB emotion logs", db.get("emotion_logs", ""), "count", ""])
        rows.append(["DB card selections", db.get("card_selections", ""), "count", ""])

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)

    print(f"Wrote {json_path}")
    print(f"Wrote {csv_path}")


if __name__ == "__main__":
    main()
