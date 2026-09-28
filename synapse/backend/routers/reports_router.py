from __future__ import annotations

import json
import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Assessment, Child, EmotionLog, Session, CardSelection, User
from schemas import KhdaSendReportGenerateRequest
from services.report_service import (
    get_session_insights,
    generate_bilingual_report,
    get_child_timeline_insights,
)
from services.pdf_service import generate_khda_send_child_report, generate_session_report_pdf
from services.llm_service import generate_assessment_narrative

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _authorize_session_report_access(current_user: User, child: Child) -> None:
    """Teachers/caregivers scoped to child; students to own profile; SEND officers school-wide."""
    if current_user.role == "send_officer":
        return
    if current_user.role == "student" and child.id == current_user.id:
        return
    if current_user.role == "teacher" and child.teacher_id == current_user.id:
        return
    if current_user.role == "caregiver" and child.caregiver_id == current_user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


def _safe_tmp_dir() -> Path:
    base = Path(tempfile.gettempdir()) / "synapse_reports"
    try:
        base.mkdir(parents=True, exist_ok=True)
        return base
    except Exception:
        fallback = Path(os.environ.get("TMPDIR") or Path.cwd()) / "synapse_reports"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


def _parse_report_date(value: str, end_of_day: bool = False) -> datetime:
    try:
        dt = datetime.strptime(value.strip()[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format (use YYYY-MM-DD)") from exc
    if end_of_day:
        return dt.replace(hour=23, minute=59, second=59)
    return dt


def _khda_report_path(child_id: str, start_date: str, end_date: str) -> Path:
    safe_start = start_date.replace("-", "")
    safe_end = end_date.replace("-", "")
    return _safe_tmp_dir() / f"khda_send_v2_{child_id}_{safe_start}_{safe_end}.pdf"


def _inline_pdf_response(path: Path, filename: str) -> FileResponse:
    return FileResponse(
        str(path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/khda-school-report")
async def get_khda_school_report(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> FileResponse:
    # Basic access control: allow any authenticated user to view for now.
    res = await db.execute(select(Assessment).where(Assessment.status == "completed").order_by(Assessment.completed_at.desc()))
    assessments = list(res.scalars().all())

    styles = getSampleStyleSheet()
    out_path = _safe_tmp_dir() / "khda_school_report.pdf"
    doc = SimpleDocTemplate(str(out_path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=54)

    story: list[Any] = []
    story.append(Paragraph("KHDA-Style School Report (Aggregated)", styles["Title"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["BodyText"]))
    story.append(Spacer(1, 14))

    table_rows = [["Child", "Diagnosis", "Dominant Emotion", "Report ID"]]
    if not assessments:
        table_rows.append(["No completed assessments", "-", "-", "-"])
    else:
        for a in assessments[:50]:
            child = (await db.execute(select(Child).where(Child.id == a.child_id))).scalar_one_or_none()
            if child is None:
                continue
            # Latest assessment session for this child.
            sess_res = await db.execute(
                select(Session)
                .where(Session.child_id == child.id, Session.session_type == "assessment")
                .order_by(Session.started_at.desc())
                .limit(1)
            )
            sess = sess_res.scalar_one_or_none()
            dominant = "neutral"
            if sess:
                emo_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id == sess.id))
                logs = list(emo_res.scalars().all())
                counts: dict[str, int] = {}
                for log in logs:
                    counts[log.emotion_label] = counts.get(log.emotion_label, 0) + 1
                if counts:
                    dominant = max(counts.items(), key=lambda kv: kv[1])[0]

            table_rows.append([child.name, child.diagnosis, dominant, a.id])

    tbl = Table(table_rows, colWidths=[170, 120, 120, 80])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "Confidential: for authorized school administration and clinical professionals only.",
            styles["BodyText"],
        )
    )

    doc.build(story)
    return _inline_pdf_response(out_path, "khda_school_report.pdf")


@router.post("/child/{child_id}/khda-send/generate")
async def generate_child_khda_send_report(
    child_id: str,
    payload: KhdaSendReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Generate per-student KHDA SEND report (English then Arabic) for a date range."""
    if current_user.role not in ("send_officer", "teacher", "caregiver"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    child_res = await db.execute(select(Child).where(Child.id == child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "teacher" and child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    start = _parse_report_date(payload.start_date)
    end = _parse_report_date(payload.end_date, end_of_day=True)
    if end < start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be after start_date")

    insights = await get_child_timeline_insights(db, child_id, start, end)

    latest_assess_res = await db.execute(
        select(Assessment)
        .where(Assessment.child_id == child_id)
        .order_by(Assessment.scheduled_date.desc())
        .limit(1)
    )
    latest_assessment = latest_assess_res.scalar_one_or_none()
    phase_notes: dict[str, Any] = {}
    if latest_assessment and latest_assessment.phase_notes:
        try:
            phase_notes = json.loads(latest_assessment.phase_notes)
        except Exception:
            phase_notes = {}

    try:
        narrative_llm = await generate_assessment_narrative(
            child_name=child.name,
            emotion_dist=insights.get("emotion_distribution") or {},
            phase_notes=phase_notes,
            top_cards=insights.get("top_cards") or [],
        )
    except Exception:
        narrative_llm = ""

    from services.report_service import (
        build_khda_narrative_en,
        build_khda_narrative_ar,
        build_phase_notes_ar,
    )

    narrative_en = build_khda_narrative_en(child.name, insights, phase_notes, narrative_llm)
    narrative_ar = build_khda_narrative_ar(
        child.name, insights, child.diagnosis, child.communication_level
    )
    phase_notes_ar = build_phase_notes_ar(
        child.name, child.diagnosis, child.communication_level, phase_notes
    )

    accommodations: list[str] = []
    if latest_assessment and latest_assessment.accommodations_tried:
        try:
            raw = json.loads(latest_assessment.accommodations_tried)
            if isinstance(raw, list):
                accommodations = [str(x) for x in raw]
        except Exception:
            accommodations = []

    interests: list[str] = []
    if child.interests:
        try:
            raw = json.loads(child.interests)
            if isinstance(raw, list):
                interests = [str(x) for x in raw]
        except Exception:
            interests = []

    report_id = str(uuid.uuid4())
    pdf_bytes = generate_khda_send_child_report(
        {
            "report_id": report_id,
            "child_name": child.name,
            "child_age": child.age,
            "diagnosis": child.diagnosis,
            "communication_level": child.communication_level,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "officer_name": current_user.full_name,
            "phase_notes": phase_notes,
            "narrative_en": narrative_en,
            "narrative_ar": narrative_ar,
            "phase_notes_ar": phase_notes_ar,
            "accommodations": accommodations,
            "interests": interests,
            **insights,
        }
    )

    out_path = _khda_report_path(child_id, payload.start_date, payload.end_date)
    out_path.write_bytes(pdf_bytes)

    return {
        "child_id": child_id,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "view_url": f"/api/reports/child/{child_id}/khda-send/view?start_date={payload.start_date}&end_date={payload.end_date}",
        "report_path": str(out_path),
    }


@router.get("/child/{child_id}/khda-send/view")
async def view_child_khda_send_report(
    child_id: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    refresh: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Inline PDF viewer for per-student KHDA SEND report (generate first if missing)."""
    if current_user.role not in ("send_officer", "teacher", "caregiver"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    child_res = await db.execute(select(Child).where(Child.id == child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "teacher" and child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    out_path = _khda_report_path(child_id, start_date, end_date)
    if refresh and out_path.exists():
        out_path.unlink(missing_ok=True)
    if not out_path.exists():
        # Auto-generate on first view for smoother demo flow.
        await generate_child_khda_send_report(
            child_id,
            KhdaSendReportGenerateRequest(start_date=start_date, end_date=end_date),
            db,
            current_user,
        )

    if not out_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    filename = f"khda_send_{child.name}_{start_date}_{end_date}.pdf".replace(" ", "_")
    return _inline_pdf_response(out_path, filename)


@router.get("/{assessment_id}")
async def get_assessment_report(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> FileResponse:
    res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    a = res.scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    report_path = a.report_path or str(_safe_tmp_dir() / f"report_{assessment_id}.pdf")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    return _inline_pdf_response(Path(report_path), f"report_{assessment_id}.pdf")


@router.get("/child/{child_id}/history")
async def get_child_session_history(
    child_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get session history for a child (accessible to teacher/caregiver only)."""
    # Verify child exists and user has access
    child_res = await db.execute(select(Child).where(Child.id == child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    # Check authorization
    if current_user.role == "teacher" and child.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this child")
    if current_user.role == "caregiver" and child.caregiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this child")

    # Get all sessions for this child, ordered by most recent
    sessions_res = await db.execute(
        select(Session)
        .where(Session.child_id == child_id)
        .order_by(Session.started_at.desc())
    )
    sessions = list(sessions_res.scalars().all())

    session_list = []
    for session in sessions:
        # Get emotion data for this session
        emo_res = await db.execute(
            select(EmotionLog).where(EmotionLog.session_id == session.id)
        )
        emotions = list(emo_res.scalars().all())

        # Count emotions
        emotion_counts = {}
        for e in emotions:
            emotion_counts[e.emotion_label] = emotion_counts.get(e.emotion_label, 0) + 1

        # Get card selections
        card_res = await db.execute(
            select(CardSelection).where(CardSelection.session_id == session.id)
        )
        cards = list(card_res.scalars().all())

        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral"

        session_list.append({
            "id": session.id,
            "topic": session.topic,
            "session_type": session.session_type,
            "started_at": session.started_at.isoformat(),
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "duration_minutes": (session.ended_at - session.started_at).total_seconds() / 60 if session.ended_at else 0,
            "dominant_emotion": dominant_emotion,
            "total_emotions_logged": len(emotions),
            "total_card_selections": len(cards),
            "is_active": session.is_active,
        })

    return {
        "child_id": child_id,
        "child_name": child.name,
        "total_sessions": len(sessions),
        "sessions": session_list,
    }


@router.post("/session/{session_id}/generate-report")
async def generate_session_report(
    session_id: str,
    language: str = "en",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Generate AI-powered bilingual report for a session."""

    # Get session
    session_res = await db.execute(select(Session).where(Session.id == session_id))
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Get child
    child_res = await db.execute(select(Child).where(Child.id == session.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    _authorize_session_report_access(current_user, child)

    # Get session insights
    insights = await get_session_insights(db, session_id)
    
    # Generate bilingual report
    reports = await generate_bilingual_report(child, current_user, insights, db)

    return {
        "session_id": session_id,
        "child_name": child.name,
        "generated_at": datetime.utcnow().isoformat(),
        "english": reports["english"],
        "arabic": reports["arabic"],
    }


@router.post("/session/{session_id}/generate-pdf")
async def generate_session_pdf(
    session_id: str,
    language: str = "both",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Generate branded bilingual PDF report for a session."""

    session_res = await db.execute(select(Session).where(Session.id == session_id))
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    child_res = await db.execute(select(Child).where(Child.id == session.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    _authorize_session_report_access(current_user, child)

    insights = await get_session_insights(db, session_id)
    reports = await generate_bilingual_report(child, current_user, insights, db)

    interests: list[str] = []
    if child.interests:
        try:
            parsed = json.loads(child.interests) if isinstance(child.interests, str) else child.interests
            if isinstance(parsed, list):
                interests = [str(x) for x in parsed]
        except Exception:
            interests = []

    # Always include both languages for interview/demo clarity unless caller forces one side.
    lang = (language or "both").lower()
    if lang in ("en", "ar"):
        # Still emit bilingual so Arabic is never "missing" from the download.
        lang = "both"

    out_path = generate_session_report_pdf(
        child_name=child.name,
        child_age=child.age,
        diagnosis=child.diagnosis or "",
        communication_level=str(child.communication_level or ""),
        interests=interests,
        topic=session.topic or "",
        assessor_name=current_user.full_name or current_user.username,
        assessor_role=current_user.role,
        insights=insights,
        narrative_en=reports.get("narrative_en") or "Session analytics summarised successfully.",
        narrative_ar=reports.get("narrative_ar") or "تم إنشاء ملخص الجلسة من التحليلات.",
        language=lang,
        session_id=session_id,
    )

    filename = f"SyNAPSE_{child.name}_session.pdf".replace(" ", "_")
    return FileResponse(str(out_path), media_type="application/pdf", filename=filename)

