from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from services.alert_service import maybe_create_emotion_alert, normalize_emotion_label
from services.deepface_service import detect_emotion
from models import Child, EmotionLog, Session, User
from schemas import EmotionDetectResponse

router = APIRouter(prefix="/api/emotion", tags=["emotion"])


def _user_can_access_session(current_user: User, session: Session) -> bool:
    if current_user.role == "send_officer":
        return True
    if current_user.role == "student" and session.child_id == current_user.id:
        return True
    # Teacher/caregiver access validated by child relationship.
    return False


@router.post("/detect", response_model=EmotionDetectResponse)
async def detect_emotion_endpoint(
    request: Request,
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Access control: load child for teacher/caregiver.
    session_res = await db.execute(select(Session).where(Session.id == session_id))
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    child_res = await db.execute(select(Child).where(Child.id == session.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role != "send_officer":
        if current_user.role == "teacher" and child.teacher_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        if current_user.role == "student" and child.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    image_bytes = await file.read()
    emotion = await detect_emotion(image_bytes)

    log = EmotionLog(
        id=str(uuid.uuid4()),
        session_id=session_id,
        emotion_label=str(emotion.get("emotion") or "neutral"),
        confidence=float(emotion.get("confidence") or 0.0),
        intensity=int(emotion.get("intensity") or 1),
    )
    db.add(log)
    await db.commit()

    emotion_label = normalize_emotion_label(str(emotion.get("emotion") or "neutral"))
    confidence = float(emotion.get("confidence") or 0.0)
    intensity = int(emotion.get("intensity") or 1)

    alert_mgr = getattr(request.app.state, "alert_manager", None)
    await maybe_create_emotion_alert(
        db,
        session=session,
        child=child,
        emotion_label=emotion_label,
        confidence=confidence,
        intensity=intensity,
        alert_manager=alert_mgr,
        all_scores=emotion.get("all_scores") or {},
    )

    payload: dict[str, Any] = {
        "event": "emotion_detected",
        "session_id": session_id,
        **emotion,
    }
    manager = getattr(request.app.state, "manager", None)
    if manager:
        await manager.broadcast_to_session(session_id, payload)

    return EmotionDetectResponse(
        emotion=str(emotion.get("emotion") or "neutral"),
        confidence=float(emotion.get("confidence") or 0.0),
        intensity=int(emotion.get("intensity") or 1),
        all_scores={str(k): float(v) for k, v in (emotion.get("all_scores") or {}).items()},
    )

