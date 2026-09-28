from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Assessment, CardSelection, Child, EmotionLog, Session, User
from services.cards_service import get_ai_suggestions
from services.llm_service import generate_assessment_narrative
from services.pdf_service import generate_assessment_report
from schemas import (
    AssessmentCompleteResponse,
    AssessmentCreate,
    AssessmentPhaseUpdate,
    AssessmentRead,
)

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


def _require_send_officer(user: User) -> None:
    if user.role != "send_officer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")


def _safe_tmp_dir() -> Path:
    tmp_dir = Path("/tmp")
    try:
        tmp_dir.mkdir(parents=True, exist_ok=True)
        return tmp_dir
    except Exception:
        # fallback: keep the endpoint usable on dev machines
        return Path(os.environ.get("TMPDIR") or Path.cwd())


def _loads_phase_notes(phase_notes: str) -> dict[str, str]:
    if not phase_notes:
        return {}
    try:
        parsed = json.loads(phase_notes)
        if isinstance(parsed, dict):
            # Normalize keys to strings 1..6
            return {str(k): str(v) for k, v in parsed.items()}
    except Exception:
        pass
    return {}


def _loads_accommodations(accommodations_tried: str) -> list[str]:
    if not accommodations_tried:
        return []
    try:
        parsed = json.loads(accommodations_tried)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except Exception:
        pass
    return []


@router.post("/", response_model=AssessmentRead)
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentRead:
    _require_send_officer(current_user)

    scheduled = payload.scheduled_date or datetime.now(timezone.utc)
    assessment = Assessment(
        id=str(uuid.uuid4()),
        child_id=payload.child_id,
        send_officer_id=current_user.id,
        scheduled_date=scheduled,
        status="scheduled",
        phase_notes=json.dumps({str(i): "" for i in range(1, 7)}, ensure_ascii=False),
        accommodations_tried=json.dumps([], ensure_ascii=False),
        report_path=None,
        completed_at=None,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return AssessmentRead(
        id=assessment.id,
        child_id=assessment.child_id,
        send_officer_id=assessment.send_officer_id,
        scheduled_date=assessment.scheduled_date,
        status=assessment.status,
        phase_notes=_loads_phase_notes(assessment.phase_notes),
        accommodations_tried=_loads_accommodations(assessment.accommodations_tried),
        report_path=assessment.report_path,
        created_at=assessment.created_at,
        completed_at=assessment.completed_at,
    )


@router.get("/", response_model=list[AssessmentRead])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AssessmentRead]:
    _require_send_officer(current_user)

    res = await db.execute(select(Assessment).order_by(Assessment.created_at.desc()))
    assessments = list(res.scalars().all())

    out: list[AssessmentRead] = []
    for a in assessments:
        out.append(
            AssessmentRead(
                id=a.id,
                child_id=a.child_id,
                send_officer_id=a.send_officer_id,
                scheduled_date=a.scheduled_date,
                status=a.status,
                phase_notes=_loads_phase_notes(a.phase_notes),
                accommodations_tried=_loads_accommodations(a.accommodations_tried),
                report_path=a.report_path,
                created_at=a.created_at,
                completed_at=a.completed_at,
            )
        )
    return out


@router.get("/{id}", response_model=AssessmentRead)
async def get_assessment(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentRead:
    _require_send_officer(current_user)

    res = await db.execute(select(Assessment).where(Assessment.id == id))
    a = res.scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    return AssessmentRead(
        id=a.id,
        child_id=a.child_id,
        send_officer_id=a.send_officer_id,
        scheduled_date=a.scheduled_date,
        status=a.status,
        phase_notes=_loads_phase_notes(a.phase_notes),
        accommodations_tried=_loads_accommodations(a.accommodations_tried),
        report_path=a.report_path,
        created_at=a.created_at,
        completed_at=a.completed_at,
    )


@router.put("/{id}/phase", response_model=AssessmentRead)
async def update_assessment_phase(
    id: str,
    payload: AssessmentPhaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentRead:
    _require_send_officer(current_user)

    res = await db.execute(select(Assessment).where(Assessment.id == id))
    a = res.scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    phase_notes = _loads_phase_notes(a.phase_notes)
    phase_notes[str(payload.phase)] = payload.notes

    accommodations = set(_loads_accommodations(a.accommodations_tried))
    for item in payload.accommodations:
        item_s = str(item).strip()
        if item_s:
            accommodations.add(item_s)

    a.phase_notes = json.dumps(phase_notes, ensure_ascii=False)
    a.accommodations_tried = json.dumps(sorted(accommodations), ensure_ascii=False)

    await db.commit()
    await db.refresh(a)

    return AssessmentRead(
        id=a.id,
        child_id=a.child_id,
        send_officer_id=a.send_officer_id,
        scheduled_date=a.scheduled_date,
        status=a.status,
        phase_notes=_loads_phase_notes(a.phase_notes),
        accommodations_tried=_loads_accommodations(a.accommodations_tried),
        report_path=a.report_path,
        created_at=a.created_at,
        completed_at=a.completed_at,
    )


@router.post("/{id}/complete", response_model=AssessmentCompleteResponse)
async def complete_assessment(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentCompleteResponse:
    _require_send_officer(current_user)

    res = await db.execute(select(Assessment).where(Assessment.id == id))
    a = res.scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    child_res = await db.execute(select(Child).where(Child.id == a.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    # Pick the latest ended assessment session if available.
    session_res = await db.execute(
        select(Session)
        .where(Session.child_id == a.child_id, Session.session_type == "assessment")
        .order_by(Session.started_at.desc())
        .limit(1)
    )
    session = session_res.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No assessment session found")

    # Emotion distribution
    emo_res = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id == session.id).order_by(EmotionLog.timestamp.asc())
    )
    logs = list(emo_res.scalars().all())
    total_emotions = len(logs)
    emotion_counts: dict[str, int] = {}
    for log in logs:
        emotion_counts[log.emotion_label] = emotion_counts.get(log.emotion_label, 0) + 1
    emotion_distribution = {k: (v / total_emotions) * 100.0 for k, v in emotion_counts.items()} if total_emotions else {}
    dominant_emotion = max(emotion_distribution.items(), key=lambda kv: kv[1])[0] if emotion_distribution else "neutral"

    # Volatility heuristic
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

    # Card patterns
    sel_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id == session.id))
    _ = sel_res  # keep for compatibility with later enhancements
    card_sel_res = await db.execute(select(CardSelection).where(CardSelection.session_id == session.id))
    selections = list(card_sel_res.scalars().all())
    top_counts: dict[str, int] = {}
    help_count = 0
    for s in selections:
        top_counts[s.card_label] = top_counts.get(s.card_label, 0) + 1
        if (s.card_category or "").lower() == "core" and (s.card_label or "").lower() == "help":
            help_count += 1
    top_cards_items = sorted(top_counts.items(), key=lambda kv: kv[1], reverse=True)[:6]
    top_cards = [{"label": lbl, "count": cnt} for lbl, cnt in top_cards_items]

    # AI narrative
    phase_notes = _loads_phase_notes(a.phase_notes)
    ai_narrative = await generate_assessment_narrative(
        child_name=child.name,
        emotion_dist=emotion_distribution,
        phase_notes=phase_notes,
        top_cards=top_cards,
    )

    recommendations = get_ai_suggestions(emotion_distribution, help_count=help_count, volatility=volatility)

    assessment_payload = {
        "assessment_id": a.id,
        "status": a.status,
        "child_name": child.name,
        "child_age": child.age,
        "diagnosis": child.diagnosis,
        "send_officer_name": current_user.full_name,
        "scheduled_date": a.scheduled_date,
        "completed_at": datetime.now(timezone.utc),
        "emotion_distribution": emotion_distribution,
        "top_cards": top_cards,
        "phase_notes": phase_notes,
        "ai_narrative": ai_narrative,
        "recommendations": recommendations,
    }

    report_bytes = generate_assessment_report(assessment_payload)

    tmp_dir = _safe_tmp_dir()
    report_path = str(tmp_dir / f"report_{a.id}.pdf")
    with open(report_path, "wb") as f:
        f.write(report_bytes)
    a.report_path = report_path
    a.status = "completed"
    a.completed_at = datetime.now(timezone.utc)

    await db.commit()

    report_url = f"/api/reports/{a.id}"
    return AssessmentCompleteResponse(status="completed", report_url=report_url, report_path=report_path)


@router.get("/referral/{id}")
async def referral_letter(
    id: str,
    target: str = Query(..., description="Referral target organisation"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    _require_send_officer(current_user)

    res = await db.execute(select(Assessment).where(Assessment.id == id))
    a = res.scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    child_res = await db.execute(select(Child).where(Child.id == a.child_id))
    child = child_res.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    tmp_dir = _safe_tmp_dir()
    out_path = tmp_dir / f"referral_{a.id}.pdf"

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(str(out_path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=54)
    story: list[Any] = []
    h2 = styles["Heading2"]
    normal = styles["BodyText"]

    story.append(Paragraph("SyNAPSE Referral Letter", styles["Title"]))
    story.append(Paragraph("MAHE Dubai", h2))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>To:</b> {target}", normal))
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "This referral is issued to support assessment and care planning for a neurodiverse child participating in the SyNAPSE AAC program.",
            normal,
        )
    )
    story.append(Spacer(1, 14))
    story.append(
        Paragraph(
            f"<b>Child:</b> {child.name}<br/>"
            f"<b>Age:</b> {child.age}<br/>"
            f"<b>Diagnosis:</b> {child.diagnosis}<br/>"
            f"<b>Communication level:</b> {child.communication_level}<br/>"
            f"<b>Assessment status:</b> {a.status}",
            normal,
        )
    )
    story.append(Spacer(1, 18))
    story.append(Paragraph("Confidential: for authorized professionals only.", normal))

    doc.build(story)
    return FileResponse(str(out_path), media_type="application/pdf", filename=f"referral_{a.id}.pdf")

