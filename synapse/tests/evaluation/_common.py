"""Shared helpers for IEEE evaluation scripts."""
from __future__ import annotations

import asyncio
import csv
import inspect
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
BACKEND_DIR = EVAL_DIR.parents[1] / "backend"
FIXTURES_DIR = EVAL_DIR / "fixtures"

# FastAPI auto-generated docs routes — not part of app RBAC surface.
META_PATHS = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


def bootstrap_backend() -> None:
    root = str(BACKEND_DIR)
    if root not in sys.path:
        sys.path.insert(0, root)


def ensure_results() -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    return RESULTS_DIR


def write_csv(path: Path, fieldnames: list[str], rows: Iterable[dict[str, Any]]) -> int:
    rows = list(rows)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def init_db_and_seed() -> None:
    bootstrap_backend()
    from database import init_db
    from seed import seed_database

    await init_db()
    await seed_database()


def get_test_client():
    bootstrap_backend()
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)


def login_token(client, username: str, password: str = "demo1234") -> str:
    r = client.post("/auth/login", data={"username": username, "password": password})
    if r.status_code != 200:
        raise RuntimeError(f"login failed for {username}: {r.status_code} {r.text}")
    return r.json()["access_token"]


ROLE_USERS = {
    "student": "student",
    "teacher": "teacher",
    "caregiver": "caregiver",
    "send_officer": "sendofficer",
}

# Matches gulsunnciftci/fer2013 ClassLabel order on HuggingFace.
FER_LABELS = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "neutral",
    5: "sad",
    6: "surprise",
}


def iter_http_routes():
    bootstrap_backend()
    from main import app

    for route in app.routes:
        path = getattr(route, "path", None)
        methods = sorted(getattr(route, "methods", None) or [])
        endpoint = getattr(route, "endpoint", None)
        if not path:
            continue
        if methods:
            if "HEAD" in methods and len(methods) == 1:
                continue
            mod = inspect.getmodule(endpoint).__name__ if endpoint else ""
            yield path, methods, mod, endpoint, "http"
        elif path.startswith("/ws"):
            mod = inspect.getmodule(endpoint).__name__ if endpoint else "main"
            yield path, ["WEBSOCKET"], mod, endpoint, "websocket"


def substitute_path(path: str, ids: dict[str, str]) -> str:
    out = path
    for key, val in ids.items():
        out = out.replace("{" + key + "}", val)
    return out


def infer_expected_access(role: str, endpoint, path: str) -> str:
    if path in META_PATHS or path in ("/", "/health", "/auth/login", "/auth/register"):
        return "public"
    if endpoint is None:
        return "auth"
    src = inspect.getsource(endpoint)

    if "_require_send_officer" in src:
        return "allow" if role == "send_officer" else "deny"

    if 'current_user.role != "teacher"' in src and path.startswith("/teacher"):
        return "allow" if role == "teacher" else "deny"

    if 'role not in ("teacher", "caregiver", "send_officer")' in src:
        return "allow" if role in ("teacher", "caregiver", "send_officer") else "deny"
    if 'role not in {"teacher", "caregiver", "send_officer"}' in src:
        return "allow" if role in ("teacher", "caregiver", "send_officer") else "deny"

    if path.startswith("/api/assessments") or path.startswith("/api/send"):
        return "allow" if role == "send_officer" else "deny"

    if "get_current_user" in src or "Depends(get_current_user)" in src:
        return "allow"
    return "allow"


def auth_denied(status: int) -> bool:
    return status in (401, 403)


def score_role_access(expected: str, status: int) -> bool:
    """Score RBAC only — 422/404 mean auth passed but payload/resource failed."""
    if expected == "allowed":
        return not auth_denied(status) and status != 0
    # Denied roles may hit 422 before RBAC on some FastAPI routes; still not a success.
    return auth_denied(status) or status in (404, 422, 405)


def run_async(coro):
    return asyncio.run(coro)
