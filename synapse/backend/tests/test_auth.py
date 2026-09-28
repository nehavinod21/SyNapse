from __future__ import annotations


def _login(client, username: str, password: str = "demo1234") -> str:
    r = client.post("/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_login_success(app_client):
    r = app_client.post("/auth/login", data={"username": "teacher", "password": "demo1234"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body.get("token_type") == "bearer"


def test_login_wrong_password(app_client):
    r = app_client.post("/auth/login", data={"username": "teacher", "password": "wrong-password"})
    assert r.status_code == 401


def test_protected_route_requires_token(app_client):
    r = app_client.get("/auth/me")
    assert r.status_code == 401


def test_protected_route_with_valid_token(app_client):
    token = _login(app_client, "teacher")
    r = app_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == "teacher"
