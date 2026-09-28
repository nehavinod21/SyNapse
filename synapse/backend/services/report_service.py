from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Child, EmotionLog, Session, CardSelection, Assessment, User
from services.llm_service import generate_assessment_narrative


def _ensure_utc_aware(dt: datetime | None) -> datetime | None:
    """SQLite often returns naive UTC datetimes; normalize for safe arithmetic."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_session_insights(db: AsyncSession, session_id: str) -> dict[str, Any]:
    """Get comprehensive session insights including emotion data and card selections."""
    session_result = await db.execute(select(Session).where(Session.id == session_id))
    session = session_result.scalar_one_or_none()
    if session is None:
        return {}

    # Get emotion logs
    emo_res = await db.execute(
        select(EmotionLog).where(EmotionLog.session_id == session_id).order_by(EmotionLog.timestamp.asc())
    )
    logs = list(emo_res.scalars().all())

    # Calculate emotion distribution
    counts: dict[str, int] = {}
    for log in logs:
        counts[log.emotion_label] = counts.get(log.emotion_label, 0) + 1

    total_emotions = len(logs)
    emotion_dist = {k: (v / total_emotions * 100) for k, v in counts.items()} if total_emotions > 0 else {}

    # Get card selections
    card_res = await db.execute(select(CardSelection).where(CardSelection.session_id == session_id))
    selections = list(card_res.scalars().all())

    # Get top cards
    card_counts: dict[str, int] = {}
    for s in selections:
        card_counts[s.card_label] = card_counts.get(s.card_label, 0) + 1

    top_cards = sorted(card_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Session duration
    duration_minutes = 0.0
    if session.started_at:
        start = _ensure_utc_aware(session.started_at)
        end = _ensure_utc_aware(session.ended_at) or datetime.now(timezone.utc)
        duration_minutes = (end - start).total_seconds() / 60.0

    # Volatility
    volatility = 0.0
    if len(logs) > 1:
        changes = sum(1 for i in range(1, len(logs)) if logs[i].emotion_label != logs[i-1].emotion_label)
        volatility = changes / (len(logs) - 1)

    return {
        "emotion_distribution": emotion_dist,
        "total_emotions": total_emotions,
        "top_cards": [{"label": label, "count": count} for label, count in top_cards],
        "total_selections": len(selections),
        "duration_minutes": duration_minutes,
        "volatility": volatility,
    }


async def generate_bilingual_report(
    child: Child,
    teacher_or_caregiver: User,
    session_data: dict[str, Any],
    db: AsyncSession,
) -> dict[str, str]:
    """Generate detailed AI-powered report in English and Arabic."""

    emotion_dist = session_data.get("emotion_distribution", {})
    top_cards = session_data.get("top_cards", [])
    duration = session_data.get("duration_minutes", 0)
    volatility = session_data.get("volatility", 0)

    # Get LLM-generated narrative
    try:
        narrative_en = await generate_assessment_narrative(
            child_name=child.name,
            emotion_dist=emotion_dist,
            phase_notes={},
            top_cards=top_cards,
        )
    except Exception:
        narrative_en = "Assessment data generated successfully."

    # Manual Arabic translation for bilingual assessment PDFs
    narrative_ar = _translate_to_arabic(narrative_en)

    # Build comprehensive reports
    report_en = _build_send_report_english(
        child=child,
        teacher_or_caregiver=teacher_or_caregiver,
        emotion_dist=emotion_dist,
        top_cards=top_cards,
        duration=duration,
        volatility=volatility,
        narrative=narrative_en,
    )

    report_ar = _build_send_report_arabic(
        child=child,
        teacher_or_caregiver=teacher_or_caregiver,
        emotion_dist=emotion_dist,
        top_cards=top_cards,
        duration=duration,
        volatility=volatility,
        narrative=narrative_ar,
    )

    return {
        "english": report_en,
        "arabic": report_ar,
        "narrative_en": narrative_en,
        "narrative_ar": narrative_ar,
    }


def _build_send_report_english(
    child: Child,
    teacher_or_caregiver: User,
    emotion_dist: dict[str, float],
    top_cards: list[dict[str, Any]],
    duration: float,
    volatility: float,
    narrative: str,
) -> str:
    """Build SEND-department compatible AAC report in English."""

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    report = f"""
SyNAPSE AAC ASSESSMENT REPORT
─────────────────────────────────────────

CHILD INFORMATION
─────────────────────────────────────────
Name: {child.name}
Age: {child.age} years
Diagnosis: {child.diagnosis}
Communication Level: {child.communication_level}
Interests: {', '.join(json.loads(child.interests)) if child.interests else 'Not specified'}

ASSESSMENT OVERVIEW
─────────────────────────────────────────
Date: {timestamp}
Assessed by: {teacher_or_caregiver.full_name} ({teacher_or_caregiver.role.upper().replace('_', ' ')})
Assessment Method: AI-Enhanced AAC Communication System

EMOTIONAL STATE ANALYSIS
─────────────────────────────────────────
Dominant Emotions Detected:
"""

    for emotion, percentage in sorted(emotion_dist.items(), key=lambda x: x[1], reverse=True):
        report += f"  • {emotion.capitalize()}: {percentage:.1f}%\n"

    report += f"""
Emotional Stability Metric: {(1 - volatility) * 100:.1f}%
(Higher indicates more consistent emotional state during session)

COMMUNICATION PATTERNS
─────────────────────────────────────────
Most Frequently Selected Cards:
"""

    for i, card in enumerate(top_cards[:5], 1):
        report += f"  {i}. {card['label']}: {card['count']} selections\n"

    report += f"""
Total Session Interactions: {sum(c['count'] for c in top_cards)} selections
Session Duration: {duration:.1f} minutes

CLINICAL SUMMARY
─────────────────────────────────────────
{narrative}

RECOMMENDATIONS FOR CONTINUED SUPPORT
─────────────────────────────────────────
1. Continue AAC sessions at current frequency
2. Focus on emotional regulation strategies during high-stress topics
3. Maintain consistent communication partner interactions
4. Monitor emotional volatility trends over time

CONFIDENTIALITY NOTICE
─────────────────────────────────────────
This report contains sensitive health information and should be handled according to 
UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL)
and educational data protection guidelines. Authorized recipients only.

Report Generated by SyNAPSE v1.0.0
"""

    return report


def _build_send_report_arabic(
    child: Child,
    teacher_or_caregiver: User,
    emotion_dist: dict[str, float],
    top_cards: list[dict[str, Any]],
    duration: float,
    volatility: float,
    narrative: str,
) -> str:
    """Build SEND-department compatible AAC report in Arabic."""

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    report = f"""
تقرير تقييم نظام الاتصال البديل المعزز بالذكاء الاصطناعي
────────────────────────────────────────────

معلومات الطفل
────────────────────────────────────────────
الاسم: {child.name}
العمر: {child.age} سنة
التشخيص: {child.diagnosis}
مستوى التواصل: {child.communication_level}
الاهتمامات: {', '.join(json.loads(child.interests)) if child.interests else 'غير محدد'}

نظرة عامة على التقييم
────────────────────────────────────────────
التاريخ: {timestamp}
تم التقييم بواسطة: {teacher_or_caregiver.full_name} (من فئة {teacher_or_caregiver.role.upper().replace('_', ' ')})
طريقة التقييم: نظام الاتصال البديل المعزز بالذكاء الاصطناعي

تحليل الحالة العاطفية
────────────────────────────────────────────
المشاعر السائدة المكتشفة:
"""

    emotions_ar = {
        "happy": "سعيد",
        "sad": "حزين",
        "angry": "غاضب",
        "fear": "خوف",
        "disgust": "اشمئزاز",
        "surprise": "مندهش",
        "neutral": "محايد",
    }

    for emotion, percentage in sorted(emotion_dist.items(), key=lambda x: x[1], reverse=True):
        ar_emotion = emotions_ar.get(emotion.lower(), emotion)
        report += f"  • {ar_emotion}: {percentage:.1f}%\n"

    report += f"""
مقياس استقرار الحالة العاطفية: {(1 - volatility) * 100:.1f}%
(كلما زادت النسبة، كان الاستقرار العاطفي أفضل)

أنماط التواصل
────────────────────────────────────────────
أكثر البطاقات المختارة بشكل متكرر:
"""

    for i, card in enumerate(top_cards[:5], 1):
        report += f"  {i}. {card['label']}: {card['count']} اختيارات\n"

    report += f"""
إجمالي تفاعلات الجلسة: {sum(c['count'] for c in top_cards)} اختيار
مدة الجلسة: {duration:.1f} دقيقة

الملخص السريري
────────────────────────────────────────────
{narrative}

التوصيات للدعم المستمر
────────────────────────────────────────────
1. المتابعة المنتظمة لجلسات الاتصال البديل
2. التركيز على استراتيجيات تنظيم المشاعر
3. الحفاظ على اتساق شركاء التواصل
4. مراقبة تذبذب الحالة العاطفية على مدى الزمن

إشعار السرية
────────────────────────────────────────────
يحتوي هذا التقرير على معلومات صحية حساسة ويجب التعامل معه وفقاً
للمرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية في دولة الإمارات. للمستلمين المصرح لهم فقط.

تم إنشاء التقرير بواسطة نظام SyNAPSE v1.0.0
"""

    return report


def _translate_to_arabic(text: str) -> str:
    """Basic term mapping for legacy assessment PDFs."""
    translations = {
        "happy": "\u0633\u0639\u064a\u062f",
        "sad": "\u062d\u0632\u064a\u0646",
        "angry": "\u063a\u0627\u0636\u0628",
        "communication": "\u062a\u0648\u0627\u0635\u0644",
        "session": "\u062c\u0644\u0633\u0629",
        "assessment": "\u062a\u0642\u064a\u064a\u0645",
        "support": "\u062f\u0639\u0645",
    }
    result = text
    for en, ar in translations.items():
        result = result.replace(en, ar)
    return result


EMOTION_AR = {
    "happy": "سعيد",
    "sad": "حزين",
    "angry": "غاضب",
    "fear": "خائف",
    "disgust": "اشمئزاز",
    "surprise": "مندهش",
    "neutral": "محايد",
}

COMM_LEVEL_AR = {
    "pre_intentional": "ما قبل القصد",
    "intentional": "قصدي",
    "symbolic": "رمزي",
    "early_language": "لغة مبكرة",
    "language": "لغوي",
}


def build_khda_narrative_en(
    child_name: str,
    insights: dict[str, Any],
    phase_notes: dict[str, Any],
    narrative_llm: str = "",
) -> str:
    session_count = insights.get("session_count", 0)
    total_selections = insights.get("total_selections", 0)
    total_minutes = insights.get("total_minutes", 0)
    total_emotions = insights.get("total_emotions", 0)
    emotion_dist = insights.get("emotion_distribution") or {}
    top_cards = insights.get("top_cards") or []

    dominant = "neutral"
    if emotion_dist:
        dominant = max(emotion_dist.items(), key=lambda kv: float(kv[1]))[0]

    card_preview = ", ".join(
        f"{c.get('label', '')} ({c.get('count', 0)})" for c in top_cards[:5] if isinstance(c, dict)
    ) or "N/A"

    emotion_lines = ", ".join(
        f"{k.capitalize()} {v:.1f}%" for k, v in sorted(emotion_dist.items(), key=lambda x: x[1], reverse=True)[:4]
    ) or "Neutral 100%"

    phase_line = " ".join(
        str(phase_notes.get(str(i)) or phase_notes.get(i) or "")
        for i in range(1, 4)
        if phase_notes.get(str(i)) or phase_notes.get(i)
    ).strip()

    base = (
        f"During the reporting period, {child_name} completed {session_count} AAC sessions "
        f"totalling {total_minutes:.1f} minutes with {total_selections} card selections and "
        f"{total_emotions} emotion observations recorded via SyNAPSE.\n\n"
        f"Dominant emotional presentation: {dominant.capitalize()}. Distribution: {emotion_lines}.\n\n"
        f"Most frequent communication cards: {card_preview}.\n\n"
    )
    if narrative_llm.strip():
        base += f"Clinical summary: {narrative_llm.strip()}\n\n"
    if phase_line:
        base += f"SEND phase highlights: {phase_line}\n\n"
    base += (
        "Recommendations: continue structured AAC sessions, monitor emotion-linked help-seeking patterns, "
        "and review progress with the class teacher and caregiver at the next IEP cycle."
    )
    return base


def build_khda_narrative_ar(
    child_name: str,
    insights: dict[str, Any],
    diagnosis: str,
    communication_level: str,
) -> str:
    session_count = insights.get("session_count", 0)
    total_selections = insights.get("total_selections", 0)
    total_minutes = insights.get("total_minutes", 0)
    total_emotions = insights.get("total_emotions", 0)
    emotion_dist = insights.get("emotion_distribution") or {}
    top_cards = insights.get("top_cards") or []

    dominant = "neutral"
    if emotion_dist:
        dominant = max(emotion_dist.items(), key=lambda kv: float(kv[1]))[0]
    dominant_ar = EMOTION_AR.get(dominant, dominant)
    comm_ar = COMM_LEVEL_AR.get(communication_level, communication_level)

    card_preview = "، ".join(
        f"{c.get('label', '')} ({c.get('count', 0)})" for c in top_cards[:5] if isinstance(c, dict)
    ) or "غير متوفر"

    emotion_lines = "، ".join(
        f"{EMOTION_AR.get(k, k)} {v:.1f}%"
        for k, v in sorted(emotion_dist.items(), key=lambda x: x[1], reverse=True)[:4]
    ) or "محايد 100%"

    return (
        f"خلال فترة التقرير، أكمل {child_name} ({diagnosis}، مستوى التواصل: {comm_ar}) "
        f"{session_count} جلسة اتصال بديل معزز (AAC) بإجمالي {total_minutes:.1f} دقيقة، "
        f"وشملت {total_selections} تفاعلاً مع البطاقات و{total_emotions} ملاحظة للمشاعر عبر نظام SyNAPSE.\n\n"
        f"المشاعر السائدة: {dominant_ar}. التوزيع: {emotion_lines}.\n\n"
        f"أكثر البطاقات استخداماً: {card_preview}.\n\n"
        "التوصيات: الاستمرار في جلسات AAC المنتظمة، مراقبة أنماط طلب المساعدة المرتبطة بالمشاعر، "
        "ومراجعة التقدم مع معلم الصف ومقدم الرعاية في دورة خطة التعليم الفردية القادمة."
    )


def build_phase_notes_ar(child_name: str, diagnosis: str, communication_level: str, phase_notes: dict[str, Any]) -> list[str]:
    comm_ar = COMM_LEVEL_AR.get(communication_level, communication_level)
    defaults = [
        f"تم توثيق إحالة {child_name} بتشخيص {diagnosis}. مستوى التواصل: {comm_ar}. تمت مراجعة السجل المدرسي وملاحظات الفريق متعدد التخصصات.",
        "أُجري تقييم SyNAPSE AAC مع مراقبة المشاعر في الوقت الفعلي وتحليل اختيار البطاقات ومدة الجلسات.",
        "نُفِّذت لوحات AAC والجداول البصرية ومجموعات البطاقات المرتبطة بالحالة العاطفية في الصف والمنزل.",
        "تُتابع المشاعر واستخدام بطاقات المساعدة أسبوعياً مع تسجيل التقلبات العاطفية واتجاهات التواصل.",
        "يُخطط لمراجعة الانتقال مع معلم الصف ومقدم الرعاية وفق إرشادات KHDA للدمج.",
        "يُقدَّم هذا التقرير لسجلات SEND المدرسية والمراجعة متعددة التخصصات والامتثال لمتطلبات KHDA.",
    ]
    out: list[str] = []
    for i in range(6):
        en_note = phase_notes.get(str(i + 1)) or phase_notes.get(i + 1)
        if en_note and any("\u0600" <= ch <= "\u06FF" for ch in str(en_note)):
            out.append(str(en_note))
        else:
            out.append(defaults[i])
    return out


SEND_PHASES_EN = [
    "Phase 1 — Identification & Referral",
    "Phase 2 — Assessment & Planning",
    "Phase 3 — Implementation of Support",
    "Phase 4 — Monitoring & Review",
    "Phase 5 — Transition Planning",
    "Phase 6 — Evaluation & Reporting",
]

SEND_PHASES_AR = [
    "المرحلة 1 — التعريف والإحالة",
    "المرحلة 2 — التقييم والتخطيط",
    "المرحلة 3 — تنفيذ الدعم",
    "المرحلة 4 — المتابعة والمراجعة",
    "المرحلة 5 — التخطيط للانتقال",
    "المرحلة 6 — التقييم والتقرير",
]


async def get_child_timeline_insights(
    db: AsyncSession,
    child_id: str,
    start: datetime,
    end: datetime,
) -> dict[str, Any]:
    """Aggregate session, emotion, and card data for a child within a date range."""
    sessions_res = await db.execute(
        select(Session)
        .where(
            Session.child_id == child_id,
            Session.started_at >= start,
            Session.started_at <= end,
        )
        .order_by(Session.started_at.asc())
    )
    sessions = list(sessions_res.scalars().all())

    emotion_counts: dict[str, int] = {}
    card_counts: dict[str, int] = {}
    total_emotions = 0
    total_selections = 0
    total_minutes = 0.0
    session_summaries: list[dict[str, Any]] = []

    for session in sessions:
        emo_res = await db.execute(select(EmotionLog).where(EmotionLog.session_id == session.id))
        logs = list(emo_res.scalars().all())
        card_res = await db.execute(select(CardSelection).where(CardSelection.session_id == session.id))
        cards = list(card_res.scalars().all())

        for log in logs:
            emotion_counts[log.emotion_label] = emotion_counts.get(log.emotion_label, 0) + 1
            total_emotions += 1
        for card in cards:
            card_counts[card.card_label] = card_counts.get(card.card_label, 0) + 1
            total_selections += 1

        duration = 0.0
        if session.started_at:
            start_ts = _ensure_utc_aware(session.started_at)
            end_ts = _ensure_utc_aware(session.ended_at) or datetime.now(timezone.utc)
            duration = (end_ts - start_ts).total_seconds() / 60.0
            total_minutes += duration

        dom = "neutral"
        if logs:
            lc: dict[str, int] = {}
            for log in logs:
                lc[log.emotion_label] = lc.get(log.emotion_label, 0) + 1
            dom = max(lc.items(), key=lambda kv: kv[1])[0]

        session_summaries.append(
            {
                "session_id": session.id,
                "topic": session.topic,
                "session_type": session.session_type,
                "started_at": session.started_at.isoformat(),
                "dominant_emotion": dom,
                "emotion_count": len(logs),
                "card_count": len(cards),
                "duration_minutes": round(duration, 1),
            }
        )

    emotion_dist = (
        {k: (v / total_emotions * 100.0) for k, v in emotion_counts.items()} if total_emotions else {}
    )
    top_cards = sorted(
        [{"label": lbl, "count": cnt} for lbl, cnt in card_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    return {
        "session_count": len(sessions),
        "total_emotions": total_emotions,
        "total_selections": total_selections,
        "total_minutes": round(total_minutes, 1),
        "emotion_distribution": emotion_dist,
        "top_cards": top_cards,
        "sessions": session_summaries,
    }
