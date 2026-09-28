from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password, verify_password
from database import async_session
from models import Assessment, CardSelection, Child, EmotionLog, Session, User
from services.pdf_service import generate_assessment_report, generate_khda_send_child_report
from services.report_service import get_child_timeline_insights


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _d(minutes_ago: int) -> datetime:
    return _utc_now() - timedelta(minutes=minutes_ago)


def _card_seed() -> list[dict[str, Any]]:
    return [
        # core
        {"label": "Help", "label_ar": "مساعدة", "category": "core", "emoji": "🆘"},
        {"label": "All done", "label_ar": "انتهى", "category": "core", "emoji": "✅"},
        {"label": "I want", "label_ar": "أريد", "category": "core", "emoji": "🙏"},
        {"label": "Stop", "label_ar": "توقف", "category": "core", "emoji": "🛑"},
        # emotion
        {"label": "I feel happy", "label_ar": "أنا سعيد", "category": "emotion", "emoji": "😊"},
        {"label": "I feel sad", "label_ar": "أنا حزين", "category": "emotion", "emoji": "😢"},
        {"label": "I feel angry", "label_ar": "أنا غاضب", "category": "emotion", "emoji": "😠"},
        {"label": "I feel scared", "label_ar": "أنا خائف", "category": "emotion", "emoji": "😨"},
        {"label": "I feel yucky", "label_ar": "أنا اشمئز", "category": "emotion", "emoji": "🤢"},
        {"label": "I feel surprised", "label_ar": "أنا مندهش", "category": "emotion", "emoji": "😲"},
        {"label": "I feel okay", "label_ar": "أنا بخير", "category": "emotion", "emoji": "🙂"},
        # topic
        {"label": "School", "label_ar": "المدرسة", "category": "topic", "emoji": "🏫"},
        {"label": "At school", "label_ar": "في المدرسة", "category": "topic", "emoji": "📚"},
        {"label": "Home", "label_ar": "المنزل", "category": "topic", "emoji": "🏠"},
        {"label": "At home", "label_ar": "في المنزل", "category": "topic", "emoji": "🛋️"},
        {"label": "Feelings", "label_ar": "المشاعر", "category": "topic", "emoji": "💛"},
        {"label": "Play", "label_ar": "اللعب", "category": "topic", "emoji": "🧸"},
        {"label": "Food", "label_ar": "الطعام", "category": "topic", "emoji": "🍎"},
        {"label": "Body parts", "label_ar": "أجزاء الجسم", "category": "topic", "emoji": "🫀"},
    ]


def _pick(cards: list[dict[str, Any]], labels: list[str]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for lbl in labels:
        for c in cards:
            if c["label"] == lbl:
                out.append(c)
                break
    return out


async def _repair_demo_passwords(db: AsyncSession) -> None:
    demo_password = "demo1234"
    for uname in ("teacher", "teacher2", "sendofficer", "caregiver", "student"):
        res = await db.execute(select(User).where(User.username == uname))
        user = res.scalar_one_or_none()
        if user is None:
            continue
        if not verify_password(demo_password, user.hashed_password):
            user.hashed_password = hash_password(demo_password)
    await db.commit()


async def seed_database() -> None:
    async with async_session() as db:
        existing = await db.execute(select(User).limit(1))
        if existing.scalar_one_or_none() is not None:
            await _repair_demo_passwords(db)
            return

        # Users (student shares id with Ahmed child for AAC login mapping)
        demo_password = "demo1234"
        student_id = str(uuid.uuid4())
        users = [
            User(
                id=str(uuid.uuid4()),
                username="teacher",
                email=None,
                hashed_password=hash_password(demo_password),
                full_name="Ms. Sarah Ahmed",
                role="teacher",
                is_active=True,
            ),
            User(
                id=str(uuid.uuid4()),
                username="sendofficer",
                email=None,
                hashed_password=hash_password(demo_password),
                full_name="Dr. Khalid Al Mansoori",
                role="send_officer",
                is_active=True,
            ),
            User(
                id=str(uuid.uuid4()),
                username="caregiver",
                email=None,
                hashed_password=hash_password(demo_password),
                full_name="Fatima Al Rashidi",
                role="caregiver",
                is_active=True,
            ),
            User(
                id=str(uuid.uuid4()),
                username="teacher2",
                email=None,
                hashed_password=hash_password(demo_password),
                full_name="Mr. James Wilson",
                role="teacher",
                is_active=True,
            ),
            User(
                id=student_id,
                username="student",
                email=None,
                hashed_password=hash_password(demo_password),
                full_name="Ahmed Al Mansoori",
                role="student",
                is_active=True,
            ),
        ]
        for u in users:
            db.add(u)

        await db.commit()

        # Re-load users by username for FK mapping.
        teachers = {}
        send_officer = None
        caregiver = None
        for uname in ["teacher", "teacher2", "sendofficer", "caregiver"]:
            res = await db.execute(select(User).where(User.username == uname))
            user = res.scalar_one_or_none()
            if user is None:
                continue
            if user.role == "teacher":
                teachers[user.username] = user
            elif user.role == "send_officer":
                send_officer = user
            elif user.role == "caregiver":
                caregiver = user

        t1 = teachers.get("teacher")
        t2 = teachers.get("teacher2")
        if t1 is None or t2 is None or caregiver is None or send_officer is None:
            return

        # Children
        children_in = [
            {
                "name": "Ahmed Al Mansoori",
                "age": 7,
                "diagnosis": "ASD",
                "communication_level": "pre_intentional",
                "interests": ["Dinosaurs", "Cars", "Red"],
                "preferred_topics": ["school", "play"],
                "teacher": t1,
                "child_id": student_id,
            },
            {
                "name": "Layla Hassan",
                "age": 9,
                "diagnosis": "Cerebral Palsy",
                "communication_level": "symbolic",
                "interests": ["Music", "Drawing"],
                "preferred_topics": ["home", "feelings"],
                "teacher": t2,
            },
            {
                "name": "Omar Abdullah",
                "age": 6,
                "diagnosis": "ASD",
                "communication_level": "pre_intentional",
                "interests": ["Animals", "Colors"],
                "preferred_topics": ["play", "food"],
                "teacher": t1,
            },
            {
                "name": "Sara Khalid",
                "age": 11,
                "diagnosis": "Down Syndrome",
                "communication_level": "early_language",
                "interests": ["Football", "Swimming"],
                "preferred_topics": ["school", "body"],
                "teacher": t2,
            },
        ]

        cards = _card_seed()
        emotion_template = {
            "happy": (0.78, 6),
            "sad": (0.62, 5),
            "angry": (0.69, 7),
            "fear": (0.58, 6),
            "disgust": (0.54, 4),
            "surprise": (0.63, 6),
            "neutral": (0.40, 3),
        }

        children: list[Child] = []
        for c in children_in:
            child = Child(
                id=c.get("child_id") or str(uuid.uuid4()),
                name=c["name"],
                age=int(c["age"]),
                diagnosis=str(c["diagnosis"]),
                communication_level=str(c["communication_level"]),
                interests=json.dumps(c["interests"], ensure_ascii=False),
                preferred_topics=json.dumps(c["preferred_topics"], ensure_ascii=False),
                teacher_id=c["teacher"].id,
                caregiver_id=caregiver.id,
            )
            children.append(child)
            db.add(child)

        await db.commit()

        # Sessions per child
        for idx, child in enumerate(children):
            # 1) classroom session
            s1_start = _d(1800 - idx * 60)
            s1_end = s1_start + timedelta(minutes=18)
            sess1 = Session(
                id=str(uuid.uuid4()),
                child_id=child.id,
                started_by=child.teacher_id or t1.id,
                session_type="classroom",
                topic=(
                    (json.loads(child.preferred_topics)[0] if isinstance(child.preferred_topics, str) and child.preferred_topics else "school")
                    if child.preferred_topics is not None
                    else "school"
                ),
                is_active=False,
                started_at=s1_start,
                ended_at=s1_end,
                phase=1,
            )

            # 2) home session
            s2_start = _d(1200 - idx * 50)
            s2_end = s2_start + timedelta(minutes=22)
            sess2 = Session(
                id=str(uuid.uuid4()),
                child_id=child.id,
                started_by=child.caregiver_id or caregiver.id,
                session_type="home",
                topic="home",
                is_active=False,
                started_at=s2_start,
                ended_at=s2_end,
                phase=1,
            )

            # 3) assessment session
            s3_start = _d(600 - idx * 40)
            s3_end = s3_start + timedelta(minutes=26)
            sess3 = Session(
                id=str(uuid.uuid4()),
                child_id=child.id,
                started_by=send_officer.id,
                session_type="assessment",
                topic="SEND phases",
                is_active=False,
                started_at=s3_start,
                ended_at=s3_end,
                phase=1,
            )

            db.add_all([sess1, sess2, sess3])
            await db.flush()

            # Emotion / card patterns
            patterns = [
                (sess1.id, ["happy", "neutral", "happy", "surprise", "neutral"], ["School", "At school", "I want", "I feel happy", "Help"]),
                (sess2.id, ["neutral", "sad", "neutral", "happy", "neutral"], ["Home", "At home", "I feel sad", "I want", "Help"]),
                (sess3.id, ["neutral", "fear", "neutral", "angry", "neutral", "happy"], ["Feelings", "Play", "I feel scared", "I feel angry", "All done"]),
            ]

            for session_id, emotion_labels, card_labels in patterns:
                for i, el in enumerate(emotion_labels):
                    conf, intensity = emotion_template.get(el, (0.4, 3))
                    log = EmotionLog(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        emotion_label=el,
                        confidence=float(conf),
                        intensity=int(intensity),
                        timestamp=_d(
                            (1800 - idx * 60) + i * 3
                        ),
                    )
                    db.add(log)

                # Card selections: make sure timestamps align loosely with emotion sequence.
                card_pool = _pick(cards, card_labels)
                for j in range(len(card_labels) + 3):
                    cdef = card_pool[j % max(1, len(card_pool))] if card_pool else cards[j % len(cards)]
                    chosen_emotion = emotion_labels[j % max(1, len(emotion_labels))]
                    selection = CardSelection(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        card_id=f"seed_{j}_{_pick.__name__}",
                        card_label=cdef["label"],
                        card_label_ar=cdef["label_ar"],
                        card_category=cdef["category"],
                        emotion_at_selection=chosen_emotion,
                        timestamp=_d((1800 - idx * 60) + j * 4),
                    )
                    db.add(selection)

        await db.commit()

        # Completed SEND assessments + PDF reports for demo SEND officer workflow
        tmp_dir = Path(__file__).resolve().parent / "data" / "reports"
        tmp_dir.mkdir(parents=True, exist_ok=True)

        end_dt = _utc_now()
        start_dt = end_dt - timedelta(days=30)
        start_str = start_dt.strftime("%Y-%m-%d")
        end_str = end_dt.strftime("%Y-%m-%d")

        for child in children:
            phase_notes = {
                "1": f"Referral for {child.name} — {child.diagnosis}, communication level {child.communication_level}.",
                "2": "SyNAPSE AAC assessment with emotion monitoring and card analytics.",
                "3": "Visual AAC boards deployed in classroom and home contexts.",
                "4": "Weekly monitoring of emotion volatility and help-seeking card use.",
                "5": "Transition review planned with class teacher and caregiver.",
                "6": "KHDA-aligned SEND report generated for school records.",
            }
            assessment = Assessment(
                id=str(uuid.uuid4()),
                child_id=child.id,
                send_officer_id=send_officer.id,
                scheduled_date=_d(14),
                status="completed",
                phase_notes=json.dumps(phase_notes, ensure_ascii=False),
                accommodations_tried=json.dumps(
                    ["Visual schedule", "AAC board", "Calm corner", "Movement break"],
                    ensure_ascii=False,
                ),
                created_at=_d(20),
                completed_at=_d(2),
            )
            db.add(assessment)
            await db.flush()

            assess_sess_res = await db.execute(
                select(Session)
                .where(Session.child_id == child.id, Session.session_type == "assessment")
                .order_by(Session.started_at.desc())
                .limit(1)
            )
            assess_sess = assess_sess_res.scalar_one_or_none()
            emotion_distribution: dict[str, float] = {}
            top_cards: list[dict[str, int]] = []
            if assess_sess:
                emo_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id == assess_sess.id))
                logs = list(emo_res.scalars().all())
                counts: dict[str, int] = {}
                for log in logs:
                    counts[log.emotion_label] = counts.get(log.emotion_label, 0) + 1
                total = len(logs) or 1
                emotion_distribution = {k: (v / total) * 100.0 for k, v in counts.items()}

                card_res = await db.execute(
                    select(CardSelection).where(CardSelection.session_id == assess_sess.id)
                )
                selections = list(card_res.scalars().all())
                tc: dict[str, int] = {}
                for s in selections:
                    tc[s.card_label] = tc.get(s.card_label, 0) + 1
                top_cards = [{"label": lbl, "count": cnt} for lbl, cnt in sorted(tc.items(), key=lambda x: x[1], reverse=True)[:6]]

            assess_pdf_path = tmp_dir / f"report_{assessment.id}.pdf"
            assess_bytes = generate_assessment_report(
                {
                    "assessment_id": assessment.id,
                    "status": assessment.status,
                    "child_name": child.name,
                    "child_age": child.age,
                    "diagnosis": child.diagnosis,
                    "send_officer_name": send_officer.full_name,
                    "scheduled_date": assessment.scheduled_date,
                    "completed_at": assessment.completed_at,
                    "emotion_distribution": emotion_distribution,
                    "top_cards": top_cards,
                    "phase_notes": phase_notes,
                    "ai_narrative": (
                        f"{child.name} demonstrated engagement across AAC sessions with emotion-aware card selection. "
                        "Continued SEND support is recommended."
                    ),
                    "recommendations": [
                        "Maintain AAC session frequency",
                        "Monitor cautious emotions during transitions",
                        "Share bilingual reports with caregivers",
                    ],
                }
            )
            assess_pdf_path.write_bytes(assess_bytes)
            assessment.report_path = str(assess_pdf_path)

            insights = await get_child_timeline_insights(db, child.id, start_dt, end_dt)
            khda_bytes = generate_khda_send_child_report(
                {
                    "report_id": assessment.id,
                    "child_name": child.name,
                    "child_age": child.age,
                    "diagnosis": child.diagnosis,
                    "communication_level": child.communication_level,
                    "start_date": start_str,
                    "end_date": end_str,
                    "officer_name": send_officer.full_name,
                    "phase_notes": phase_notes,
                    "narrative_en": (
                        f"{child.name} engaged in {insights.get('session_count', 0)} sessions during the reporting period."
                    ),
                    "narrative_ar": f"شارك {child.name} في {insights.get('session_count', 0)} جلسة خلال فترة التقرير.",
                    **insights,
                }
            )
            khda_path = tmp_dir / f"khda_send_{child.id}_{start_str.replace('-', '')}_{end_str.replace('-', '')}.pdf"
            khda_path.write_bytes(khda_bytes)

        await db.commit()

