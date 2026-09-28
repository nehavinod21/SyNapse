from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from services.cards_service import get_ai_suggestions
from database import get_db
from models import CardSelection, Child, EmotionLog, Session, User
from schemas import SessionCreate, SessionRead, SessionInsight

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _ensure_utc_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _pct(count: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return (count / total) * 100.0


async def _compute_session_insights(db: AsyncSession, session_id: str) -> dict[str, Any]:
    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    emo_res = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id == session_id).order_by(EmotionLog.timestamp.asc())
    )
    logs = list(emo_res.scalars().all())

    total_emotions = len(logs)
    counts: dict[str, int] = {}
    for log in logs:
        counts[log.emotion_label] = counts.get(log.emotion_label, 0) + 1

    emotion_distribution = {k: _pct(v, total_emotions) for k, v in counts.items()}

    dominant_emotion = max(emotion_distribution.items(), key=lambda kv: kv[1])[0] if emotion_distribution else "neutral"

    # Volatility heuristic: fraction of emotion-label changes over time.
    if len(logs) < 2:
        volatility = 0.0
    else:
        changes = 0
        prev = logs[0].emotion_label
        for log in logs[1:]:
            if log.emotion_label != prev:
                changes += 1
            prev = log.emotion_label
        volatility = changes / max(1, len(logs) - 1)

    card_res = await db.execute(select(CardSelection).where(CardSelection.session_id == session_id))
    selections = list(card_res.scalars().all())
    total_card_selections = len(selections)

    top_counts: dict[str, int] = {}
    help_count = 0
    for s in selections:
        label_key = s.card_label
        top_counts[label_key] = top_counts.get(label_key, 0) + 1
        if (s.card_category or "").lower() == "core" and (s.card_label or "").lower() == "help":
            help_count += 1

    top_cards_items = sorted(top_counts.items(), key=lambda kv: kv[1], reverse=True)[:6]
    top_cards = [{"label": lbl, "count": cnt} for lbl, cnt in top_cards_items]

    session_duration_minutes = 0.0
    if session.started_at:
        start_ts = _ensure_utc_aware(session.started_at)
        end_ts = _ensure_utc_aware(session.ended_at) or datetime.now(timezone.utc)
        session_duration_minutes = (end_ts - start_ts).total_seconds() / 60.0

    ai_suggestions = get_ai_suggestions(emotion_distribution, help_count=help_count, volatility=volatility)

    return {
        "emotion_distribution": emotion_distribution,
        "dominant_emotion": dominant_emotion,
        "emotion_volatility": float(volatility),
        "top_cards": top_cards,
        "help_count": int(help_count),
        "ai_suggestions": ai_suggestions,
        "session_duration_minutes": float(session_duration_minutes),
        "total_card_selections": int(total_card_selections),
    }


@router.post("/start", response_model=SessionRead)
async def start_session(
    session_in: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionRead:
    child_res = await db.execute(select(Child).where(Child.id == session_in.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    session = Session(
        id=str(uuid.uuid4()),
        child_id=session_in.child_id,
        started_by=current_user.id,
        session_type=session_in.session_type,
        topic=session_in.topic,
        is_active=True,
    )
    # End other active sessions for this child so teacher/caregiver can join one clear live session.
    existing = await db.execute(
        select(Session).where(Session.child_id == session_in.child_id, Session.is_active.is_(True))
    )
    for old in existing.scalars().all():
        old.is_active = False
        old.ended_at = datetime.now(timezone.utc)

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionRead.model_validate(session)


@router.post("/{id}/end")
async def end_session(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    res = await db.execute(select(Session).where(Session.id == id))
    session = res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Simple access control: allow if user started it, or is teacher/caregiver for the child.
    if current_user.role not in {"teacher", "caregiver", "send_officer"} and session.started_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    session.is_active = False
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    insights = await _compute_session_insights(db, id)
    return {"status": "ended", "insights": insights}


@router.get("/{id}", response_model=SessionRead)
async def get_session(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionRead:
    res = await db.execute(select(Session).where(Session.id == id))
    session = res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Minimal access control: send_officer can view all, teacher/caregiver must match child relation, student only self.
    if current_user.role == "send_officer":
        pass
    else:
        child = (await db.execute(select(Child).where(Child.id == session.child_id))).scalar_one_or_none()
        if child is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        if current_user.role == "teacher" and child.teacher_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if current_user.role == "student" and child.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Load logs/selections
    emo_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id == id).order_by(EmotionLog.timestamp.asc()))
    sel_res = await db.execute(select(CardSelection).where(CardSelection.session_id == id).order_by(CardSelection.timestamp.asc()))

    session.emotion_logs = list(emo_res.scalars().all())  # type: ignore[attr-defined]
    session.card_selections = list(sel_res.scalars().all())  # type: ignore[attr-defined]
    return SessionRead.model_validate(session)


@router.get("/child/{cid}")
async def get_child_sessions(
    cid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SessionRead]:
    child = (await db.execute(select(Child).where(Child.id == cid))).scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "teacher" and child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessions not found")
    if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessions not found")
    if current_user.role == "student" and child.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessions not found")

    res = await db.execute(select(Session).where(Session.child_id == cid).order_by(Session.started_at.desc()))
    sessions = list(res.scalars().all())
    return [SessionRead.model_validate(s) for s in sessions]


@router.get("/{id}/insights", response_model=SessionInsight)
async def session_insights(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionInsight:
    # Access control: reuse session fetch logic.
    session_res = await db.execute(select(Session).where(Session.id == id))
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role == "send_officer":
        pass
    else:
        child = (await db.execute(select(Child).where(Child.id == session.child_id))).scalar_one_or_none()
        if child is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        if current_user.role == "teacher" and child.teacher_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if current_user.role == "student" and child.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    insights = await _compute_session_insights(db, id)
    return SessionInsight.model_validate(insights)

