from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import CardSelection, Child, Session, User
from schemas import CardGenerateRequest, CardSelectRequest
from services.cards_service import generate_cards
from services.llm_service import generate_aac_cards

router = APIRouter(prefix="/api/cards", tags=["cards"])


def _load_json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except Exception:
        return []
    return []


async def _get_session_with_child(db: AsyncSession, session_id: str) -> tuple[Session, Child]:
    session_res = await db.execute(select(Session).where(Session.id == session_id))
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    child_res = await db.execute(select(Child).where(Child.id == session.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return session, child


def _user_can_access_child(current_user: User, child: Child) -> bool:
    if current_user.role == "send_officer":
        return True
    if current_user.role == "teacher" and child.teacher_id == current_user.id:
        return True
    if current_user.role == "caregiver" and child.caregiver_id == current_user.id:
        return True
    if current_user.role == "student" and child.id == current_user.id:
        return True
    return False


@router.post("/generate")
async def generate_cards_endpoint(
    req: CardGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    session, child = await _get_session_with_child(db, req.session_id)

    if not _user_can_access_child(current_user, child):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    # Default: rule-based cards only (instant). Set SYNAPSE_USE_LLM=1 to call Ollama.
    use_llm = os.environ.get("SYNAPSE_USE_LLM", "0").strip().lower() in {"1", "true", "yes"}
    llm_cards: list[str] = []
    if use_llm:
        interests = _load_json_list(child.interests)
        llm_cards = await generate_aac_cards(
            emotion=req.emotion,
            age=child.age,
            diagnosis=child.diagnosis,
            interests=interests,
            topic=req.topic,
        )

    source = "llm" if llm_cards and len(llm_cards) >= 6 else "rule_based"
    cards = generate_cards(emotion=req.emotion, topic=req.topic, llm_cards=llm_cards if llm_cards else None)
    return {"source": source, "cards": cards}


@router.post("/select")
async def select_card_endpoint(
    request: Request,
    req: CardSelectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    session, child = await _get_session_with_child(db, req.session_id)

    if not _user_can_access_child(current_user, child):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    selection = CardSelection(
        id=str(uuid.uuid4()),
        session_id=req.session_id,
        card_id=req.card_id,
        card_label=req.card_label,
        card_label_ar=req.card_label_ar,
        card_category=req.card_category,
        emotion_at_selection=req.emotion_at_selection,
    )
    db.add(selection)
    await db.commit()

    manager = getattr(request.app.state, "manager", None)
    if manager:
        await manager.broadcast_to_session(
            req.session_id,
            {
                "event": "transcript_append",
                "payload": {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker": "student",
                    "message": f"Selected card: {req.card_label}",
                },
            },
        )
        await manager.broadcast_to_session(
            req.session_id,
            {
                "event": "card_selected",
                "card_label": req.card_label,
                "emotion": req.emotion_at_selection,
            },
        )

    return {"status": "ok"}

