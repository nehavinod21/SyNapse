from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def app_client(event_loop):
    from database import init_db
    from main import app
    from seed import seed_database

    async def _setup():
        await init_db()
        await seed_database()

    event_loop.run_until_complete(_setup())
    with TestClient(app) as client:
        yield client


@pytest.fixture
def login_fn():
    def _login(client: TestClient, username: str, password: str = "demo1234") -> str:
        r = client.post("/auth/login", data={"username": username, "password": password})
        assert r.status_code == 200, r.text
        return r.json()["access_token"]

    return _login


def login(client: TestClient, username: str, password: str = "demo1234") -> str:
    r = client.post("/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]
