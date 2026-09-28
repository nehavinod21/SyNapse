from __future__ import annotations

import inspect
import logging
import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError

from auth import decode_token
from database import init_db
from routers.alerts_router import router as alerts_router
from routers.assessment_router import router as assessment_router
from routers.auth_router import router as auth_router
from routers.cards_router import router as cards_router
from routers.children_router import router as children_router
from routers.emotion_router import router as emotion_router
from routers.reports_router import router as reports_router
from routers.send_router import router as send_router
from routers.sessions_router import router as sessions_router
from routers.support_router import router as support_router
from routers.teacher_router import router as teacher_router
from seed import seed_database
from services.deepface_service import warmup_deepface

logger = logging.getLogger("synapse.main")


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        session_connections = self.active_connections.get(session_id, [])
        if websocket in session_connections:
            session_connections.remove(websocket)
        if not session_connections and session_id in self.active_connections:
            del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, data: dict[str, Any]) -> None:
        stale_sockets: list[WebSocket] = []
        for socket in self.active_connections.get(session_id, []):
            try:
                await socket.send_json(data)
            except Exception:
                stale_sockets.append(socket)
        for socket in stale_sockets:
            self.disconnect(session_id, socket)


class UserAlertManager:
    """WebSocket fan-out for teacher/caregiver emotion alerts."""

    def __init__(self) -> None:
        self.user_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.user_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        conns = self.user_connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and user_id in self.user_connections:
            del self.user_connections[user_id]

    async def broadcast_to_user(self, user_id: str, data: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for socket in self.user_connections.get(user_id, []):
            try:
                await socket.send_json(data)
            except Exception:
                stale.append(socket)
        for socket in stale:
            self.disconnect(user_id, socket)


manager = ConnectionManager()
alert_manager = UserAlertManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        maybe_result = seed_database()
        if inspect.isawaitable(maybe_result):
            await maybe_result
    except Exception as exc:
        logger.exception("Seed initialization failed: %s", exc)
    asyncio.create_task(warmup_deepface())
    yield


app = FastAPI(
    title="SyNAPSE API",
    description="Emotion-Aware AAC for Neurodiverse Children | MAHE Dubai",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.manager = manager
app.state.alert_manager = alert_manager

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "http://172.22.234.3:5173",
        "http://172.22.234.3:5180",
        "capacitor://localhost",
        "http://localhost",
    ],
    allow_origin_regex=(
        r"https://.*\.vercel\.app"
        r"|http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?"
        r"|http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?"
        r"|http://172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?"
        r"|https://.*\.ngrok-free\.app"
        r"|https://.*\.trycloudflare\.com"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(children_router)
app.include_router(sessions_router)
app.include_router(emotion_router)
app.include_router(cards_router)
app.include_router(assessment_router)
app.include_router(reports_router)
app.include_router(send_router)
app.include_router(teacher_router)
app.include_router(alerts_router)
app.include_router(support_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "SyNAPSE API is running. Open the web app on port 5180 (iPad) or 5173 (laptop), not this port.",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "1.0.0"}


@app.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)


@app.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    from sqlalchemy import select
    from database import async_session
    from models import User

    user_id: str | None = None
    async with async_session() as db:
        res = await db.execute(select(User).where(User.username == username))
        user = res.scalar_one_or_none()
        if user is None:
            await websocket.close(code=4001)
            return
        user_id = user.id

    await alert_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_manager.disconnect(user_id, websocket)
