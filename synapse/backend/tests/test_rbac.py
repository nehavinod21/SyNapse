from __future__ import annotations

import pytest

REPORT_PATHS = [
    ("POST", "/api/reports/session/{session_id}/generate-report"),
    ("POST", "/api/reports/session/{session_id}/generate-pdf"),
]

TEACHER_ONLY_PATHS = [
    ("GET", "/teacher/dashboard/summary"),
    ("GET", "/teacher/students/{child_id}/profile"),
]


def _login(client, username: str, password: str = "demo1234") -> str:
    r = client.post("/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def session_id(app_client):
    token = _login(app_client, "teacher")
    from sqlalchemy import select
    from database import async_session
    from models import Child
    import asyncio

    async def _child_id():
        async with async_session() as db:
            child = (await db.execute(select(Child).limit(1))).scalar_one()
            return child.id

    child_id = asyncio.run(_child_id())
    started = app_client.post(
        "/api/sessions/start",
        json={"child_id": child_id, "session_type": "classroom", "topic": "school"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert started.status_code == 200
    return started.json()["id"], child_id


@pytest.mark.parametrize("role,username,expected", [
    ("student", "student", 200),
    ("send_officer", "sendofficer", 200),
    ("teacher", "teacher", 200),
    ("caregiver", "caregiver", 200),
])
def test_session_report_access_allowed_roles(app_client, session_id, role, username, expected):
    sid, _ = session_id
    token = _login(app_client, username)
    for method, path_tpl in REPORT_PATHS:
        path = path_tpl.format(session_id=sid)
        r = app_client.post(path, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == expected, f"{role} {path} -> {r.status_code}"


@pytest.mark.parametrize("role,username", [
    ("student", "student"),
    ("caregiver", "caregiver"),
    ("send_officer", "sendofficer"),
])
def test_teacher_routes_return_403_not_client_error(app_client, session_id, role, username):
    _, child_id = session_id
    token = _login(app_client, username)
    for method, path_tpl in TEACHER_ONLY_PATHS:
        path = path_tpl.format(child_id=child_id, session_id=session_id[0])
        r = app_client.get(path, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403, f"{role} {path} -> {r.status_code} {r.text[:120]}"
