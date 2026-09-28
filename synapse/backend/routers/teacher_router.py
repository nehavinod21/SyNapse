from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import CardSelection, Child, EmotionLog, Session, User
from schemas import (
    AchievementBadge,
    EmotionDistributionPoint,
    EngagementTrendPoint,
    GuidanceSuggestion,
    TeacherActionResponse,
    TeacherDashboardSummary,
    TeacherLiveSessionResponse,
    TeacherMessageRequest,
    TeacherStudentCard,
    TeacherStudentProfileResponse,
    TopCardUsage,
    TranscriptEntry,
)

router = APIRouter(prefix="/teacher", tags=["teacher"])


def _ensure_utc_aware(dt: datetime | None) -> datetime | None:
    """Normalize SQLite datetimes for safe arithmetic with timezone-aware values."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _load_json_list(value: Any) -> list[str]:
    """Load JSON list from database field."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except Exception:
            return []
    return []


async def _get_child_status(db: AsyncSession, child_id: str) -> tuple[str, str]:
    """
    Compute child's readiness status from recent session metrics.
    Returns (status, status_label) tuple.
    """
    # Get last 5 sessions
    result = await db.execute(
        select(Session)
        .where(Session.child_id == child_id)
        .order_by(Session.started_at.desc())
        .limit(5)
    )
    sessions = list(result.scalars().all())

    if not sessions:
        return ("ready", "Ready for Communication")

    # Compute average engagement/signal from emotion logs
    emotion_results = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id.in_([s.id for s in sessions]))
    )
    logs = list(emotion_results.scalars().all())

    if not logs:
        return ("ready", "Ready for Communication")

    avg_intensity = sum(log.intensity for log in logs) / len(logs)

    # Simple heuristic: 0-3 = ready, 4-6 = needs support, 7+ = needs immediate
    if avg_intensity >= 7:
        return ("needs_immediate_support", "Needs Immediate Support")
    elif avg_intensity >= 4:
        return ("needs_support", "Needs Support")
    else:
        return ("ready", "Ready for Communication")


async def _get_baseline_metrics(db: AsyncSession, child_id: str) -> tuple[float, float]:
    """Compute baseline mean and std dev from all sessions."""
    result = await db.execute(
        select(Session)
        .where(Session.child_id == child_id)
        .order_by(Session.started_at.desc())
        .limit(20)  # Use last 20 sessions
    )
    sessions = list(result.scalars().all())

    if not sessions:
        return (75.0, 5.0)  # Default baseline

    emotion_results = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id.in_([s.id for s in sessions]))
    )
    logs = list(emotion_results.scalars().all())

    if not logs:
        return (75.0, 5.0)

    intensities = [log.intensity for log in logs]
    mean = sum(intensities) / len(intensities)

    # Compute std dev
    variance = sum((x - mean) ** 2 for x in intensities) / len(intensities)
    std_dev = variance ** 0.5

    return (mean, std_dev)


async def _get_signal_score(db: AsyncSession, child_id: str) -> float:
    """Get current signal score (0-1 range) from most recent session."""
    result = await db.execute(
        select(Session)
        .where(Session.child_id == child_id)
        .order_by(Session.started_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if not session:
        return 0.5

    emo_result = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id == session.id).limit(1)
    )
    log = emo_result.scalar_one_or_none()

    if not log:
        return 0.5

    # Normalize intensity (0-10) to signal (0-1)
    return min(1.0, max(0.0, log.intensity / 10.0))


async def _weekly_engagement_and_emotion_mix(
    db: AsyncSession, child_ids: list[str]
) -> tuple[list[EngagementTrendPoint], list[EmotionDistributionPoint]]:
    """Aggregate emotion intensity by day and emotion labels for the last 7 days."""
    if not child_ids:
        return [], []

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=7)

    sess_res = await db.execute(
        select(Session).where(
            Session.child_id.in_(child_ids),
            Session.started_at >= window_start,
        )
    )
    sessions = list(sess_res.scalars().all())
    if not sessions:
        return [], []

    sid_list = [s.id for s in sessions]
    logs_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id.in_(sid_list)))
    logs = list(logs_res.scalars().all())
    if not logs:
        return [], []

    day_slots: list[tuple[date, str]] = []
    for i in range(6, -1, -1):
        d = now.date() - timedelta(days=i)
        day_slots.append((d, d.strftime("%a")))

    by_date: dict[date, list[float]] = defaultdict(list)
    for log in logs:
        by_date[log.timestamp.date()].append(float(log.intensity))

    engagement_points: list[EngagementTrendPoint] = []
    for d, short in day_slots:
        vals = by_date.get(d, [])
        engagement_points.append(
            EngagementTrendPoint(day=short, value=round(sum(vals) / len(vals), 1) if vals else 0.0)
        )

    emo_counts: dict[str, int] = defaultdict(int)
    for log in logs:
        emo_counts[str(log.emotion_label)] += 1
    total = sum(emo_counts.values()) or 1
    emotion_mix = [
        EmotionDistributionPoint(emotion=k, percentage=int(round(100 * v / total)))
        for k, v in sorted(emo_counts.items(), key=lambda x: -x[1])
    ]
    return engagement_points, emotion_mix


@router.get("/dashboard/summary", response_model=TeacherDashboardSummary)
async def get_teacher_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherDashboardSummary:
    """Get dashboard summary for teacher."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can access this")

    # Get all children for this teacher
    result = await db.execute(
        select(Child).where(Child.teacher_id == current_user.id)
    )
    children = list(result.scalars().all())

    # Build student cards
    student_cards: list[TeacherStudentCard] = []
    engagement_sum = 0.0
    sessions_this_week_total = 0
    making_progress_count = 0

    for child in children:
        readiness_status, status_label = await _get_child_status(db, child.id)
        baseline_mean, baseline_std = await _get_baseline_metrics(db, child.id)
        signal_score = await _get_signal_score(db, child.id)

        # Get last session info
        session_result = await db.execute(
            select(Session)
            .where(Session.child_id == child.id)
            .order_by(Session.started_at.desc())
            .limit(1)
        )
        last_session = session_result.scalar_one_or_none()
        last_session_at = None
        last_session_turns = None

        active_result = await db.execute(
            select(Session)
            .where(Session.child_id == child.id, Session.is_active.is_(True))
            .order_by(Session.started_at.desc())
            .limit(1)
        )
        active_session = active_result.scalar_one_or_none()
        active_session_id = active_session.id if active_session else None

        if last_session:
            last_session_at = last_session.started_at
            # Count turns (card selections)
            card_result = await db.execute(
                select(CardSelection).where(CardSelection.session_id == last_session.id)
            )
            last_session_turns = len(list(card_result.scalars().all()))

        # Compute engagement average for this child
        emotion_result = await db.execute(
            select(EmotionLog)
            .where(EmotionLog.session_id.in_([s.id for s in [last_session] if s]))
        )
        emotion_logs = list(emotion_result.scalars().all())
        child_engagement = (
            (sum(log.intensity for log in emotion_logs) / len(emotion_logs))
            if emotion_logs
            else 7.0
        )
        engagement_sum += child_engagement

        # Count sessions this week
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        week_sessions = await db.execute(
            select(func.count(Session.id)).where(
                (Session.child_id == child.id) & (Session.started_at >= week_ago)
            )
        )
        week_count = week_sessions.scalar() or 0
        sessions_this_week_total += week_count

        # Check if making progress (simplified: has recent sessions)
        if week_count >= 2:
            making_progress_count += 1

        card = TeacherStudentCard(
            id=child.id,
            name=child.name,
            age=child.age,
            status=readiness_status,
            status_label=status_label,
            last_session_at=last_session_at,
            last_session_turns=last_session_turns,
            baseline_mean=round(baseline_mean, 1),
            baseline_std=round(baseline_std, 1),
            signal_score=round(signal_score, 2),
            recommendation=None,
            active_session_id=active_session_id,
        )
        student_cards.append(card)

    avg_engagement = (
        engagement_sum / len(children) if children else 7.0
    )

    child_ids = [c.id for c in children]
    engagement_this_week, emotion_mix_class = await _weekly_engagement_and_emotion_mix(db, child_ids)

    return TeacherDashboardSummary(
        classroom_name="Year 3 SEND Support Group",
        session_active=False,
        current_time=datetime.now().strftime("%H:%M"),
        average_engagement=round(avg_engagement, 1),
        sessions_this_week=sessions_this_week_total,
        students_making_progress=making_progress_count,
        students_total=len(children),
        students=student_cards,
        engagement_this_week=engagement_this_week,
        emotion_mix_class=emotion_mix_class,
        reports_this_week=0,
    )


@router.get("/students/{child_id}/profile", response_model=TeacherStudentProfileResponse)
async def get_teacher_student_profile(
    child_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherStudentProfileResponse:
    """Get detailed profile for a student."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Get child
    child_result = await db.execute(select(Child).where(Child.id == child_id))
    child = child_result.scalar_one_or_none()

    if not child or child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    # Get status
    readiness_status, _ = await _get_child_status(db, child.id)
    baseline_mean, baseline_std = await _get_baseline_metrics(db, child.id)
    signal_score = await _get_signal_score(db, child.id)

    # Get sessions
    sessions_result = await db.execute(
        select(Session)
        .where(Session.child_id == child_id)
        .order_by(Session.started_at.desc())
    )
    sessions = list(sessions_result.scalars().all())

    # Compute engagement average
    temp_result = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id.in_([s.id for s in sessions]))
    )
    temp_logs = list(temp_result.scalars().all())
    engagement_avg = (
        (sum(log.intensity for log in temp_logs) / len(temp_logs))
        if temp_logs
        else 7.0
    )

    # Build engagement trend (last 5 days)
    engagement_trend: list[EngagementTrendPoint] = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    for i, day in enumerate(days):
        # Simplified: just assign increasing values for demo
        trend_val = 6.0 + (i * 0.5)
        engagement_trend.append(EngagementTrendPoint(day=day, value=round(trend_val, 1)))

    # Build emotion distribution (last 10 sessions)
    if sessions:
        session_ids = [s.id for s in sessions[:10]]
        emotion_result = await db.execute(
            select(EmotionLog).where(EmotionLog.session_id.in_(session_ids))
        )
        emotion_logs = list(emotion_result.scalars().all())

        emotion_counts: dict[str, int] = {}
        for log in emotion_logs:
            emotion_counts[log.emotion_label] = emotion_counts.get(log.emotion_label, 0) + 1

        total_emotions = sum(emotion_counts.values())
        emotion_distribution = [
            EmotionDistributionPoint(
                emotion=emotion, percentage=int((count / total_emotions) * 100)
            )
            for emotion, count in emotion_counts.items()
        ]
    else:
        emotion_distribution = []

    # Build most used cards
    if sessions:
        card_result = await db.execute(
            select(CardSelection).where(
                CardSelection.session_id.in_([s.id for s in sessions[:10]])
            )
        )
        card_selections = list(card_result.scalars().all())

        card_counts: dict[str, int] = {}
        for card in card_selections:
            card_counts[card.card_label] = card_counts.get(card.card_label, 0) + 1

        most_used = sorted(card_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        most_used_cards = [
            TopCardUsage(label=label, count=count) for label, count in most_used
        ]
    else:
        most_used_cards = []

    # Simple achievements
    achievements = [
        AchievementBadge(title="First Conversation", description="Week 1"),
        AchievementBadge(title="5 Successful Sessions", description="Week 2"),
    ]

    # Determine last session label
    if sessions:
        last_session = sessions[0]
        now = datetime.now(timezone.utc)
        last_started = _ensure_utc_aware(last_session.started_at) or now
        diff = now - last_started
        if diff.total_seconds() < 3600:
            last_session_label = "Today"
        elif diff.days < 1:
            last_session_label = "Yesterday"
        else:
            last_session_label = f"{diff.days} days ago"
    else:
        last_session_label = "Never"

    turns = 0
    if sessions:
        card_result = await db.execute(
            select(CardSelection).where(CardSelection.session_id == sessions[0].id)
        )
        turns = len(list(card_result.scalars().all()))

    return TeacherStudentProfileResponse(
        id=child.id,
        name=child.name,
        student_identifier=f"student-{child.id[:8]}",
        age=child.age,
        grade="Year 4",
        communication_level=child.communication_level,
        status=readiness_status,
        signal_score=round(signal_score, 2),
        last_session_label=last_session_label,
        turns=turns,
        baseline_mean=round(baseline_mean, 1),
        baseline_std=round(baseline_std, 1),
        engagement_avg=round(engagement_avg, 1),
        total_sessions=len(sessions),
        engagement_trend=engagement_trend,
        emotion_distribution=emotion_distribution,
        most_used_cards=most_used_cards,
        achievements=achievements,
    )


@router.get("/sessions/{session_id}/live", response_model=TeacherLiveSessionResponse)
async def get_teacher_live_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherLiveSessionResponse:
    """Get live session state (teacher or assigned caregiver)."""
    if current_user.role not in {"teacher", "caregiver"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Get session
    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    # Get child
    child_result = await db.execute(select(Child).where(Child.id == session.child_id))
    child = child_result.scalar_one_or_none()

    if not child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    if current_user.role == "teacher" and child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Get metrics
    baseline_mean, baseline_std = await _get_baseline_metrics(db, child.id)
    signal_score = await _get_signal_score(db, child.id)

    # Compute z-score
    if baseline_std > 0:
        z_score = (signal_score * 10 - baseline_mean) / baseline_std
    else:
        z_score = 0.0

    now = datetime.now(timezone.utc)

    # Get emotion logs
    emotion_result = await db.execute(
        select(EmotionLog)
        .where(EmotionLog.session_id == session_id)
        .order_by(EmotionLog.timestamp.asc())
    )
    emotion_logs = list(emotion_result.scalars().all())

    # Get card selections (turns)
    card_result = await db.execute(
        select(CardSelection)
        .where(CardSelection.session_id == session_id)
        .order_by(CardSelection.timestamp.asc())
    )
    card_selections = list(card_result.scalars().all())

    # Compute engagement
    engagement_score = (
        (sum(log.intensity for log in emotion_logs) / len(emotion_logs))
        if emotion_logs
        else 7.0
    )

    # Build transcript from real events (emotions + cards)
    transcript: list[TranscriptEntry] = []
    for log in emotion_logs[-20:]:
        conf = int(round(float(log.confidence or 0) * 100))
        transcript.append(
            TranscriptEntry(
                timestamp=_ensure_utc_aware(log.timestamp) or now,
                speaker="system",
                message=f"Emotion detected: {log.emotion_label} ({conf}%)",
            )
        )
    for sel in card_selections[-20:]:
        transcript.append(
            TranscriptEntry(
                timestamp=_ensure_utc_aware(sel.timestamp) or now,
                speaker="student",
                message=f"Selected card: {sel.card_label}",
            )
        )
    transcript.sort(key=lambda e: e.timestamp)
    if not transcript:
        transcript.append(
            TranscriptEntry(
                timestamp=now,
                speaker="system",
                message="Waiting for student activity (mood update or AAC card tap)…",
            )
        )

    # Add sample guidance suggestions
    guidance_suggestions = [
        GuidanceSuggestion(
            id="g1",
            type="Ask for elaboration",
            text="Tell me more about that. Who was with you?",
            example="Tell me more about that. Who was with you?",
        ),
        GuidanceSuggestion(
            id="g2",
            type="Show empathy",
            text="That sounds important. I'm listening.",
            example="That sounds important. I'm listening.",
        ),
        GuidanceSuggestion(
            id="g3",
            type="Expand topic",
            text="What was your favorite part?",
            example="What was your favorite part?",
        ),
    ]

    # Compute session duration
    start_time = _ensure_utc_aware(session.started_at) or now
    end_time = _ensure_utc_aware(session.ended_at) or now
    duration_seconds = int((end_time - start_time).total_seconds())

    latest = emotion_logs[-1] if emotion_logs else None
    recent_cards = [s.card_label for s in card_selections[-6:]]

    # Live signal from latest emotion intensity when available
    if latest is not None:
        signal_score = min(1.0, max(0.0, float(latest.intensity or 1) / 10.0))

    return TeacherLiveSessionResponse(
        session_id=session.id,
        child_name=child.name,
        phase="INTERACTION" if session.is_active else "ENDED",
        timer_seconds=15,
        signal_intensity=signal_score,
        baseline_mean=round(baseline_mean, 1),
        baseline_std=round(baseline_std, 1),
        z_score=round(z_score, 2),
        turn_index=len(card_selections),
        turn_target=10,
        duration_seconds=duration_seconds,
        engagement_score=round(engagement_score, 1),
        transcript=transcript[-40:],
        guidance_suggestions=guidance_suggestions,
        is_active=bool(session.is_active),
        latest_emotion=str(latest.emotion_label) if latest else None,
        latest_confidence=float(latest.confidence or 0) if latest else 0.0,
        recent_cards=recent_cards,
        topic=str(session.topic or ""),
        session_type=str(session.session_type or "classroom"),
    )


@router.post("/sessions/{session_id}/pause", response_model=TeacherActionResponse)
async def pause_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """Soft pause — keep session active so live monitoring still works."""
    if current_user.role not in {"teacher", "caregiver"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return TeacherActionResponse(
        status="success",
        message="Session paused (still active for monitoring)",
        session_id=session.id,
    )


@router.post("/sessions/{session_id}/next-turn", response_model=TeacherActionResponse)
async def next_turn_session(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """Advance to next turn."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    card_result = await db.execute(select(CardSelection).where(CardSelection.session_id == session_id))
    turn_index = len(list(card_result.scalars().all()))
    manager = getattr(request.app.state, "manager", None)
    if manager:
        await manager.broadcast_to_session(
            session_id,
            {
                "event": "turn_advanced",
                "session_id": session_id,
                "payload": {"turn_index": turn_index, "turn_target": 10},
            },
        )

    return TeacherActionResponse(
        status="success",
        message="Next turn signal sent",
        session_id=session.id,
    )


@router.post("/sessions/{session_id}/end", response_model=TeacherActionResponse)
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """End a session."""
    if current_user.role not in {"teacher", "caregiver"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    session.is_active = False
    session.ended_at = datetime.now(timezone.utc)
    db.add(session)
    await db.commit()

    return TeacherActionResponse(
        status="success",
        message="Session ended",
        session_id=session.id,
    )


@router.post("/sessions/{session_id}/guidance/{guidance_id}/use", response_model=TeacherActionResponse)
async def use_guidance(
    session_id: str,
    guidance_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """Mark guidance as used."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    return TeacherActionResponse(
        status="success",
        message=f"Guidance {guidance_id} marked as used",
        session_id=session_id,
    )


@router.post("/sessions/{session_id}/guidance/{guidance_id}/dismiss", response_model=TeacherActionResponse)
async def dismiss_guidance(
    session_id: str,
    guidance_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """Dismiss a guidance suggestion."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    return TeacherActionResponse(
        status="success",
        message=f"Guidance {guidance_id} dismissed",
        session_id=session_id,
    )


@router.post("/sessions/{session_id}/message", response_model=TeacherActionResponse)
async def send_message(
    session_id: str,
    message: TeacherMessageRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherActionResponse:
    """Send a message from teacher."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    manager = getattr(request.app.state, "manager", None)
    if manager:
        await manager.broadcast_to_session(
            session_id,
            {
                "event": "transcript_append",
                "session_id": session_id,
                "payload": {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker": "teacher",
                    "message": message.message,
                },
            },
        )

    return TeacherActionResponse(
        status="success",
        message=f"Message sent: {message.message}",
        session_id=session.id,
    )
