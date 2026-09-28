from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Child, EmotionAlert, User
from schemas import EmotionAlertRead
from services.alert_service import support_message_for_emotion

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=list[EmotionAlertRead])
async def list_alerts(
    unacknowledged_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EmotionAlertRead]:
    if current_user.role not in ("teacher", "caregiver", "send_officer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    q = select(EmotionAlert).order_by(EmotionAlert.created_at.desc()).limit(50)
    if current_user.role != "send_officer":
        q = q.where(EmotionAlert.recipient_user_id == current_user.id)
    if unacknowledged_only:
        q = q.where(EmotionAlert.acknowledged.is_(False))

    res = await db.execute(q)
    alerts = list(res.scalars().all())

    # Collapse backlog: keep only the newest unacked alert, auto-ack the rest
    if unacknowledged_only and len(alerts) > 1:
        for old in alerts[1:]:
            old.acknowledged = True
        await db.commit()
        alerts = alerts[:1]

    out: list[EmotionAlertRead] = []
    for a in alerts:
        child_res = await db.execute(select(Child).where(Child.id == a.child_id))
        child = child_res.scalar_one_or_none()
        row = EmotionAlertRead.model_validate(a)
        row.child_name = child.name if child else None
        out.append(row)
    return out


@router.post("/acknowledge-all")
async def acknowledge_all_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    """Clear alert spam for the current teacher/caregiver (demo reset)."""
    if current_user.role not in ("teacher", "caregiver", "send_officer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    q = select(EmotionAlert).where(EmotionAlert.acknowledged.is_(False))
    if current_user.role != "send_officer":
        q = q.where(EmotionAlert.recipient_user_id == current_user.id)
    res = await db.execute(q)
    rows = list(res.scalars().all())
    for a in rows:
        a.acknowledged = True
    await db.commit()
    return {"acknowledged": len(rows)}


@router.post("/{alert_id}/acknowledge", response_model=EmotionAlertRead)
async def acknowledge_alert(
    alert_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EmotionAlertRead:
    res = await db.execute(select(EmotionAlert).where(EmotionAlert.id == alert_id))
    alert = res.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if current_user.role != "send_officer" and alert.recipient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    alert.acknowledged = True
    await db.commit()
    await db.refresh(alert)

    # Push a short reassurance message to the student's live AAC session
    support = support_message_for_emotion(alert.emotion_label)
    manager = getattr(request.app.state, "manager", None)
    if manager and alert.session_id:
        who = "caregiver" if current_user.role == "caregiver" else "teacher"
        await manager.broadcast_to_session(
            alert.session_id,
            {
                "event": "support_message",
                "session_id": alert.session_id,
                "payload": {
                    "from_role": who,
                    "from_name": current_user.full_name or current_user.username,
                    "emotion": alert.emotion_label,
                    "message_en": support["en"],
                    "message_ar": support["ar"],
                    "alert_id": alert.id,
                },
            },
        )

    child_res = await db.execute(select(Child).where(Child.id == alert.child_id))
    child = child_res.scalar_one_or_none()
    row = EmotionAlertRead.model_validate(alert)
    row.child_name = child.name if child else None
    return row
