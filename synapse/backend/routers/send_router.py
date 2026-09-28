from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Assessment, CardSelection, Child, EmotionLog, Session, User
from schemas import SendCaseloadChildRow, SendDashboardSummary, SendRecentInteraction

router = APIRouter(prefix="/api/send", tags=["send"])

RECENT_INTERACTION_LIMIT = 30


def _require_send_officer(user: User) -> None:
    if user.role != "send_officer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SEND officers only")


async def _fetch_recent_interactions(db: AsyncSession, limit: int = RECENT_INTERACTION_LIMIT) -> list[SendRecentInteraction]:
    """Merge card selections, emotion logs, and session starts into a live activity feed."""
    items: list[SendRecentInteraction] = []

    card_res = await db.execute(
        select(CardSelection, Session, Child)
        .join(Session, CardSelection.session_id == Session.id)
        .join(Child, Session.child_id == Child.id)
        .order_by(CardSelection.timestamp.desc())
        .limit(limit)
    )
    for sel, sess, child in card_res.all():
        items.append(
            SendRecentInteraction(
                id=f"card-{sel.id}",
                child_id=child.id,
                child_name=child.name,
                interaction_type="card_selection",
                summary_en=f"Selected “{sel.card_label}”",
                summary_ar=f"اختار «{sel.card_label_ar or sel.card_label}»",
                emotion=sel.emotion_at_selection,
                session_type=sess.session_type,
                timestamp=sel.timestamp,
            )
        )

    emo_res = await db.execute(
        select(EmotionLog, Session, Child)
        .join(Session, EmotionLog.session_id == Session.id)
        .join(Child, Session.child_id == Child.id)
        .order_by(EmotionLog.timestamp.desc())
        .limit(limit)
    )
    for log, sess, child in emo_res.all():
        label = (log.emotion_label or "neutral").capitalize()
        items.append(
            SendRecentInteraction(
                id=f"emo-{log.id}",
                child_id=child.id,
                child_name=child.name,
                interaction_type="emotion_detected",
                summary_en=f"Mood detected: {label} ({int(log.confidence * 100)}%)",
                summary_ar=f"تم رصد المزاج: {label} ({int(log.confidence * 100)}%)",
                emotion=log.emotion_label,
                session_type=sess.session_type,
                timestamp=log.timestamp,
            )
        )

    sess_res = await db.execute(
        select(Session, Child)
        .join(Child, Session.child_id == Child.id)
        .order_by(Session.started_at.desc())
        .limit(limit)
    )
    for sess, child in sess_res.all():
        items.append(
            SendRecentInteraction(
                id=f"sess-{sess.id}",
                child_id=child.id,
                child_name=child.name,
                interaction_type="session_start",
                summary_en=f"Started {sess.session_type} session — {sess.topic}",
                summary_ar=f"بدأ جلسة {sess.session_type} — {sess.topic}",
                emotion=None,
                session_type=sess.session_type,
                timestamp=sess.started_at,
            )
        )

    items.sort(key=lambda x: x.timestamp, reverse=True)
    return items[:limit]


@router.get("/dashboard/summary", response_model=SendDashboardSummary)
async def send_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SendDashboardSummary:
    _require_send_officer(current_user)

    child_res = await db.execute(select(Child).order_by(Child.name.asc()))
    children = list(child_res.scalars().all())

    assess_res = await db.execute(select(Assessment))
    assessments = list(assess_res.scalars().all())

    by_child: dict[str, list[Assessment]] = defaultdict(list)
    for a in assessments:
        by_child[a.child_id].append(a)

    now = datetime.now(timezone.utc)
    week_ahead = now + timedelta(days=7)

    rows: list[SendCaseloadChildRow] = []
    upcoming_reviews_week = 0
    overdue_reviews = 0
    status_counts: dict[str, int] = defaultdict(int)

    for child in children:
        ch_assess = sorted(by_child.get(child.id, []), key=lambda x: x.scheduled_date, reverse=True)
        latest: Optional[Assessment] = ch_assess[0] if ch_assess else None

        last_dt = latest.scheduled_date if latest else None
        next_review: Optional[datetime] = None
        latest_status = (latest.status or "").lower() if latest else ""
        is_completed = "complete" in latest_status if latest else False

        if latest and not is_completed:
            next_review = latest.scheduled_date + timedelta(days=14)

        status_key = "monitor"
        if latest:
            if is_completed:
                status_key = "on_track"
            elif latest.scheduled_date < now - timedelta(days=30):
                status_key = "needs_attention"
            elif latest.scheduled_date < now:
                status_key = "needs_attention"

        if status_key == "needs_attention" and latest and not is_completed:
            if latest.scheduled_date < now - timedelta(days=7):
                overdue_reviews += 1

        if next_review and now <= next_review <= week_ahead:
            upcoming_reviews_week += 1

        status_counts[status_key] += 1

        rows.append(
            SendCaseloadChildRow(
                child_id=child.id,
                name=child.name,
                age=child.age,
                school_class="SEND cohort",
                last_assessment_date=last_dt,
                next_review_date=next_review,
                status=status_key,
                latest_assessment_id=latest.id if latest else None,
                latest_assessment_status=latest.status if latest else None,
                latest_assessment_completed=is_completed,
            )
        )

    recent = await _fetch_recent_interactions(db)

    return SendDashboardSummary(
        officer_name=current_user.full_name,
        children_on_caseload=len(children),
        upcoming_reviews_week=upcoming_reviews_week,
        overdue_reviews=overdue_reviews,
        status_counts=dict(status_counts),
        children=rows,
        recent_interactions=recent,
    )


@router.get("/dashboard/recent-interactions", response_model=list[SendRecentInteraction])
async def send_recent_interactions(
    limit: int = Query(default=RECENT_INTERACTION_LIMIT, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SendRecentInteraction]:
    """Lightweight poll endpoint for live SEND activity feed."""
    _require_send_officer(current_user)
    return await _fetch_recent_interactions(db, limit=limit)
