#!/usr/bin/env python3

"""Role vs endpoint access matrix using JWT + TestClient."""

from __future__ import annotations



import io



from _common import (

    META_PATHS,

    ROLE_USERS,

    ensure_results,

    get_test_client,

    infer_expected_access,

    init_db_and_seed,

    iter_http_routes,

    login_token,

    run_async,

    score_role_access,

    substitute_path,

    write_csv,

)



OUT = ensure_results() / "role_access_matrix.csv"

FIELDS = [

    "role",

    "endpoint_path",

    "http_method",

    "expected_access",

    "actual_status_code",

    "auth_outcome",

    "correct",

]

SKIP = {("POST", "/auth/login"), ("POST", "/auth/register")}





async def sample_ids(client):

    from sqlalchemy import select

    from database import async_session

    from models import Assessment, Child, Session



    async with async_session() as db:

        child = (await db.execute(select(Child).limit(1))).scalar_one()

        tok = login_token(client, "teacher")

        started = client.post(

            "/api/sessions/start",

            json={"child_id": child.id, "session_type": "classroom", "topic": "school"},

            headers={"Authorization": f"Bearer {tok}"},

        )

        session_id = started.json()["id"]

        asm = (await db.execute(select(Assessment).limit(1))).scalar_one_or_none()

        return {

            "id": child.id,

            "child_id": child.id,

            "cid": child.id,

            "session_id": session_id,

            "assessment_id": asm.id if asm else "missing",

            "alert_id": "missing",

        }





def payload_for(method: str, path: str, ids: dict[str, str]) -> dict | None:

    if method == "GET":

        return None

    if path.endswith("/api/children/") and method == "POST":

        return {"name": "Bench", "age": 8, "diagnosis": "ASD", "interests": ["trains"]}

    if path.endswith("/api/sessions/start"):

        return {"child_id": ids["child_id"], "session_type": "classroom", "topic": "school"}

    if path.endswith("/api/cards/generate"):

        return {

            "session_id": ids["session_id"],

            "emotion": "happy",

            "child_id": ids["child_id"],

            "topic": "school",

        }

    if path.endswith("/api/cards/select"):

        return {"session_id": ids["session_id"], "card_label": "Help", "emotion": "happy"}

    if path.endswith("/api/support/chat"):

        return {"message": "What is SyNAPSE?"}

    if "/api/reports/child/" in path and "generate" in path:

        return {"assessment_id": ids["assessment_id"]}

    if path.endswith("/message"):

        return {"message": "Bench ping"}

    return {}





def call(client, method: str, path: str, headers: dict, body: dict | None) -> int:

    m = method.upper()

    try:

        if m == "GET":

            return client.get(path, headers=headers).status_code

        if m == "POST":

            if path.endswith("/api/emotion/detect"):

                return client.post(

                    path,

                    data={"session_id": body.get("session_id", "") if body else ""},

                    files={"file": ("f.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")},

                    headers=headers,

                ).status_code

            return client.post(path, headers=headers, json=body or {}).status_code

        if m == "PUT":

            return client.put(path, headers=headers, json=body or {}).status_code

        if m == "DELETE":

            return client.delete(path, headers=headers).status_code

        if m == "PATCH":

            return client.patch(path, headers=headers, json=body or {}).status_code

    except Exception:

        return 0

    return 0





def auth_outcome(expected: str, status: int) -> str:

    if status == 0:

        return "client_error"

    if auth_denied(status):

        return "auth_denied"

    if expected == "denied":

        return "auth_allowed_unexpected"

    if status in (404, 422):

        return "auth_allowed_validation_or_missing"

    if 200 <= status < 300:

        return "auth_allowed_ok"

    return f"other_{status}"





def auth_denied(status: int) -> bool:

    return status in (401, 403)





def main() -> None:

    run_async(init_db_and_seed())

    client = get_test_client()

    ids = run_async(sample_ids(client))

    rows = []

    for path, methods, _mod, endpoint, kind in iter_http_routes():

        if kind == "websocket" or path in META_PATHS:

            continue

        p = substitute_path(path, ids)

        for method in methods:

            if method == "HEAD" or (method, path) in SKIP:

                continue

            body = payload_for(method, path, ids)

            if path.endswith("/api/emotion/detect"):

                body = {"session_id": ids["session_id"]}

            for role, user in ROLE_USERS.items():

                expected = infer_expected_access(role, endpoint, path)

                if expected == "public":

                    status = call(client, method, p, {}, body)

                else:

                    token = login_token(client, user)

                    status = call(

                        client, method, p, {"Authorization": f"Bearer {token}"}, body

                    )

                exp = "allowed" if expected in ("allow", "public", "auth") else "denied"

                outcome = auth_outcome(exp, status)

                rows.append(

                    {

                        "role": role,

                        "endpoint_path": path,

                        "http_method": method,

                        "expected_access": exp,

                        "actual_status_code": status,

                        "auth_outcome": outcome,

                        "correct": score_role_access(exp, status),

                    }

                )

    n = write_csv(OUT, FIELDS, rows)

    ok = sum(1 for r in rows if r["correct"])

    print(f"Wrote {n} rows ({ok}/{n} RBAC-correct) -> {OUT}")





if __name__ == "__main__":

    main()

