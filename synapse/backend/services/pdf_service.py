from __future__ import annotations

import io
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from services.pdf_helpers import (
    EMOTION_AR,
    accent_rule,
    branded_header,
    branded_header_ar,
    build_pdf_styles,
    info_grid,
    info_grid_ar,
    khda_footer,
    kpi_row,
    p_ar,
    p_en,
    section_bar,
    styled_data_table,
)


def _fmt_dt(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M UTC")
    return str(value)


def _safe_tmp_dir() -> Path:
    tmp_dir = Path(tempfile.gettempdir()) / "synapse_reports"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    return tmp_dir


def generate_assessment_report(assessment_data: dict) -> bytes:
    assessment_id = str(assessment_data.get("assessment_id") or "unknown")
    tmp_dir = _safe_tmp_dir()
    out_path = tmp_dir / f"report_{assessment_id}.pdf"

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    normal = styles["BodyText"]
    h2 = styles["Heading2"]

    emotion_distribution = assessment_data.get("emotion_distribution") or {}
    top_cards = assessment_data.get("top_cards") or []
    phase_notes = assessment_data.get("phase_notes") or {}
    ai_narrative = assessment_data.get("ai_narrative") or ""
    recommendations = assessment_data.get("recommendations") or []

    child_info = {
        "child_name": assessment_data.get("child_name") or "",
        "child_age": assessment_data.get("child_age") or "",
        "diagnosis": assessment_data.get("diagnosis") or "",
    }

    scheduled_date = _fmt_dt(assessment_data.get("scheduled_date"))
    completed_at = _fmt_dt(assessment_data.get("completed_at"))
    status = assessment_data.get("status") or ""
    send_officer = assessment_data.get("send_officer_name") or ""

    doc = SimpleDocTemplate(str(out_path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=54)
    buffer = []  # type: list[Any]

    # Header
    buffer.append(Paragraph("SyNAPSE", title_style))
    buffer.append(Paragraph("MAHE Dubai", h2))
    buffer.append(Spacer(1, 10))
    buffer.append(
        Paragraph(
            f"<b>Assessment ID:</b> {assessment_id}<br/>"
            f"<b>Status:</b> {status}<br/>"
            f"<b>Scheduled:</b> {scheduled_date}<br/>"
            f"<b>Completed:</b> {completed_at}<br/>"
            f"<b>Send Officer:</b> {send_officer}",
            normal,
        )
    )
    buffer.append(Spacer(1, 12))
    buffer.append(
        Paragraph(
            f"<b>Child:</b> {child_info['child_name']} (Age: {child_info['child_age']})<br/>"
            f"<b>Diagnosis:</b> {child_info['diagnosis']}",
            normal,
        )
    )

    buffer.append(Spacer(1, 18))
    buffer.append(Paragraph("1) Emotion Analysis", h2))

    # Section 1: Emotion Analysis table
    emotion_rows = []
    try:
        items = sorted([(str(k), float(v)) for k, v in emotion_distribution.items()], key=lambda kv: kv[1], reverse=True)
    except Exception:
        items = []

    for k, v in items[:8]:
        # If values are 0-1, convert to percent for readability.
        pct = v * 100 if v <= 1.0 else v
        emotion_rows.append([k.capitalize(), f"{pct:.1f}%"])

    if not emotion_rows:
        emotion_rows = [["Neutral", "100.0%"]]

    tbl = Table([["Emotion", "Confidence"]] + emotion_rows, colWidths=[220, 120])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    buffer.append(tbl)

    buffer.append(PageBreak())
    buffer.append(Paragraph("2) Communication Patterns", h2))

    # Section 2: Communication Patterns (top cards)
    card_rows = []
    try:
        card_items = []
        for c in top_cards:
            if isinstance(c, dict) and "label" in c and "count" in c:
                card_items.append((str(c["label"]), int(c["count"])))
            elif isinstance(c, dict) and "card_label" in c and "count" in c:
                card_items.append((str(c["card_label"]), int(c["count"])))
        card_items = sorted(card_items, key=lambda x: x[1], reverse=True)[:10]
    except Exception:
        card_items = []

    for lbl, count in card_items:
        card_rows.append([lbl, str(count)])

    if not card_rows:
        card_rows = [["No card selections captured", "0"]]

    tbl2 = Table([["Card", "Selections"]] + card_rows, colWidths=[280, 60])
    tbl2.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    buffer.append(tbl2)
    buffer.append(Spacer(1, 12))
    buffer.append(Paragraph("3) Six-Phase Notes", h2))

    # Section 3: Six-phase notes
    for phase in range(1, 7):
        key = str(phase)
        text = phase_notes.get(key) if isinstance(phase_notes, dict) else None
        if not text:
            text = phase_notes.get(int(phase)) if isinstance(phase_notes, dict) else None
        if not text:
            text = "(No notes recorded)"
        buffer.append(Paragraph(f"<b>Phase {phase}:</b> {text}", normal))
        buffer.append(Spacer(1, 6))

    buffer.append(PageBreak())
    buffer.append(Paragraph("4) AI Clinical Narrative", h2))
    buffer.append(Spacer(1, 10))
    if ai_narrative.strip():
        buffer.append(Paragraph(ai_narrative.replace("\n", "<br/>"), normal))
    else:
        buffer.append(Paragraph("AI narrative was not available for this assessment.", normal))

    buffer.append(Spacer(1, 18))
    buffer.append(Paragraph("5) Recommendations", h2))
    buffer.append(Spacer(1, 10))
    if isinstance(recommendations, list) and recommendations:
        for rec in recommendations[:10]:
            buffer.append(Paragraph(f"• {rec}", normal))
            buffer.append(Spacer(1, 6))
    else:
        buffer.append(Paragraph("No recommendations were recorded.", normal))

    buffer.append(PageBreak())
    buffer.append(Paragraph("6) UAE / KHDA Compliance Statement", h2))
    buffer.append(Spacer(1, 10))
    buffer.append(
        Paragraph(
            "This report is generated to support clinical/educational planning in alignment with local requirements in the UAE. "
            "All information should be reviewed by qualified professionals before implementation.",
            normal,
        )
    )
    buffer.append(Spacer(1, 18))
    buffer.append(
        Paragraph(
            "Confidentiality: This document is intended for authorized educational and clinical use only. "
            "Unauthorized sharing may violate privacy and safeguarding policies.",
            normal,
        )
    )

    def _add_footer(canvas, doc_):
        canvas.saveState()
        width, height = A4
        footer_y = 24
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(36, footer_y, "Confidential: For clinical/educational use only.")
        canvas.setFillColor(colors.grey)
        page_num = canvas.getPageNumber()
        canvas.drawRightString(width - 36, footer_y, f"Page {page_num}")
        canvas.restoreState()

    doc.build(buffer, onFirstPage=_add_footer, onLaterPages=_add_footer)

    try:
        with open(out_path, "rb") as f:
            return f.read()
    except Exception:
        # Let callers handle absence/unreadable file.
        raise


def generate_khda_send_child_report(report_data: dict) -> bytes:
    """
    Bilingual KHDA/SEND framework report for one child and timeline.
    English sections first, then Arabic (same structure) with proper Arabic fonts.
    """
    child_name = report_data.get("child_name") or "Student"
    child_age = report_data.get("child_age") or ""
    diagnosis = report_data.get("diagnosis") or ""
    communication_level = report_data.get("communication_level") or ""
    start_date = report_data.get("start_date") or ""
    end_date = report_data.get("end_date") or ""
    officer_name = report_data.get("officer_name") or ""
    emotion_dist = report_data.get("emotion_distribution") or {}
    top_cards = report_data.get("top_cards") or []
    sessions = report_data.get("sessions") or []
    narrative_en = report_data.get("narrative_en") or ""
    narrative_ar = report_data.get("narrative_ar") or ""
    phase_notes = report_data.get("phase_notes") or {}
    phase_notes_ar = report_data.get("phase_notes_ar") or []
    accommodations = report_data.get("accommodations") or []
    interests = report_data.get("interests") or []
    session_count = report_data.get("session_count") or 0
    total_minutes = report_data.get("total_minutes") or 0
    total_selections = report_data.get("total_selections") or 0
    total_emotions = report_data.get("total_emotions") or 0
    report_id = str(report_data.get("report_id") or "khda-send")
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    tmp_dir = _safe_tmp_dir()
    out_path = tmp_dir / f"khda_send_{report_id}.pdf"

    styles = build_pdf_styles()
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=48,
        bottomMargin=56,
    )
    story: list[Any] = []

    send_phases_en = [
        "Phase 1 — Identification & Referral",
        "Phase 2 — Assessment & Planning",
        "Phase 3 — Implementation of Support",
        "Phase 4 — Monitoring & Review",
        "Phase 5 — Transition Planning",
        "Phase 6 — Evaluation & Reporting",
    ]
    send_phases_ar = [
        "المرحلة 1 — التعريف والإحالة",
        "المرحلة 2 — التقييم والتخطيط",
        "المرحلة 3 — تنفيذ الدعم",
        "المرحلة 4 — المتابعة والمراجعة",
        "المرحلة 5 — التخطيط للانتقال",
        "المرحلة 6 — التقييم والتقرير",
    ]

    def _emotion_rows(arabic: bool = False) -> list[list[str]]:
        rows: list[list[str]] = []
        for k, v in sorted(emotion_dist.items(), key=lambda kv: kv[1], reverse=True)[:8]:
            pct = v if v > 1 else v * 100
            label = EMOTION_AR.get(k, k.capitalize()) if arabic else str(k).capitalize()
            rows.append([label, f"{pct:.1f}%"])
        if not rows:
            rows = [["Neutral", "100.0%"]] if not arabic else [["محايد", "100.0%"]]
        return rows

    def _card_rows() -> list[list[str]]:
        rows: list[list[str]] = []
        for c in top_cards[:10]:
            if isinstance(c, dict):
                rows.append([str(c.get("label", "")), str(c.get("count", 0))])
        if not rows:
            rows = [["—", "0"]]
        return rows

    def _session_rows(arabic: bool = False) -> list[list[str]]:
        rows: list[list[str]] = []
        for s in sessions[:15]:
            started = str(s.get("started_at", ""))[:10]
            dom = s.get("dominant_emotion", "neutral")
            dom_label = EMOTION_AR.get(dom, dom) if arabic else str(dom)
            rows.append(
                [
                    started,
                    str(s.get("session_type", "")),
                    str(s.get("topic", "")),
                    dom_label,
                    str(s.get("card_count", 0)),
                    f"{s.get('duration_minutes', 0):.1f}",
                ]
            )
        if not rows:
            empty = "لا توجد جلسات" if arabic else "No sessions"
            rows = [[empty, "—", "—", "—", "0", "0"]]
        return rows

    # ── ENGLISH ──
    story.append(
        branded_header(
            "KHDA School SEND Report",
            f"SyNAPSE · MAHE Dubai · Report ID {report_id[:8]} · Generated {generated_at}",
            styles,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        info_grid(
            [
                ("Child", f"{child_name} (Age {child_age})"),
                ("Diagnosis", str(diagnosis)),
                ("Communication level", str(communication_level)),
                ("Reporting period", f"{start_date} to {end_date}"),
                ("SEND Officer", str(officer_name)),
                ("Interests", ", ".join(interests) if interests else "Not recorded"),
                ("Sessions", str(session_count)),
                ("Total duration", f"{total_minutes:.1f} minutes"),
                ("AAC interactions", str(total_selections)),
                ("Emotion observations", str(total_emotions)),
            ],
            styles,
        )
    )

    if accommodations:
        story.append(Spacer(1, 10))
        story.append(section_bar("Accommodations & strategies in use", styles))
        for item in accommodations:
            story.append(p_en(f"• {item}", styles["body_en"]))

    story.append(Spacer(1, 12))
    story.append(section_bar("SEND Framework — 6 Phases (English)", styles))
    for i, phase_title in enumerate(send_phases_en):
        note = phase_notes.get(str(i + 1)) or phase_notes.get(i + 1) or ""
        if not note and i < len(phase_notes_ar):
            note = "(See Arabic section for phase detail)"
        story.append(p_en(f"{phase_title}\n{note}", styles["body_en"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(section_bar("Emotion analysis (reporting period)", styles))
    story.append(styled_data_table(["Emotion", "Share"], _emotion_rows(False)))

    story.append(Spacer(1, 10))
    story.append(section_bar("Communication patterns — top AAC cards", styles))
    story.append(styled_data_table(["Card label", "Selections"], _card_rows()))

    story.append(Spacer(1, 10))
    story.append(section_bar("Session timeline", styles))
    story.append(
        styled_data_table(
            ["Date", "Type", "Topic", "Dominant emotion", "Cards", "Minutes"],
            _session_rows(False),
        )
    )

    story.append(Spacer(1, 10))
    story.append(section_bar("Clinical narrative & recommendations (English)", styles))
    story.append(p_en(narrative_en or "Narrative generated from session analytics.", styles["body_en"]))

    story.append(Spacer(1, 10))
    story.append(
        p_en(
            "UAE/KHDA compliance: This report supports inclusive education planning under KHDA SEND guidance. "
            "For authorized school and clinical professionals only. Video frames are not stored; only session metadata is retained.",
            styles["small_en"],
        )
    )

    story.append(PageBreak())

    # ── ARABIC ──
    story.append(
        branded_header_ar(
            "تقرير KHDA المدرسي لدعم الطلاب ذوي الاحتياجات الخاصة",
            f"SyNAPSE · MAHE Dubai · {generated_at}",
            styles,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        info_grid_ar(
            [
                ("الطفل", f"{child_name} (العمر {child_age})"),
                ("التشخيص", str(diagnosis)),
                ("مستوى التواصل", str(communication_level)),
                ("فترة التقرير", f"{start_date} إلى {end_date}"),
                ("مسؤول SEND", str(officer_name)),
                ("الاهتمامات", "، ".join(interests) if interests else "غير مسجّلة"),
                ("الجلسات", str(session_count)),
                ("المدة الإجمالية", f"{total_minutes:.1f} دقيقة"),
                ("تفاعلات AAC", str(total_selections)),
                ("ملاحظات المشاعر", str(total_emotions)),
            ],
            styles,
        )
    )

    if accommodations:
        story.append(Spacer(1, 10))
        story.append(section_bar("التسهيلات والاستراتيجات المستخدمة", styles, arabic=True))
        for item in accommodations:
            story.append(p_ar(f"• {item}", styles["body_ar"]))

    story.append(Spacer(1, 12))
    story.append(section_bar("إطار SEND — المراحل الست (عربي)", styles, arabic=True))
    for i, phase_title in enumerate(send_phases_ar):
        note = phase_notes_ar[i] if i < len(phase_notes_ar) else ""
        story.append(p_ar(f"{phase_title}\n{note}", styles["body_ar"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(section_bar("تحليل المشاعر (فترة التقرير)", styles, arabic=True))
    story.append(
        styled_data_table(
            ["المشاعر", "النسبة"],
            _emotion_rows(True),
            arabic=True,
        )
    )

    story.append(Spacer(1, 10))
    story.append(section_bar("أنماط التواصل — أكثر بطاقات AAC استخداماً", styles, arabic=True))
    story.append(
        styled_data_table(
            ["البطاقة", "عدد المرات"],
            _card_rows(),
            arabic=True,
        )
    )

    story.append(Spacer(1, 10))
    story.append(section_bar("الجدول الزمني للجلسات", styles, arabic=True))
    story.append(
        styled_data_table(
            ["التاريخ", "النوع", "الموضوع", "المشاعر السائدة", "البطاقات", "الدقائق"],
            _session_rows(True),
            arabic=True,
        )
    )

    story.append(Spacer(1, 10))
    story.append(section_bar("الملخص السريري والتوصيات (عربي)", styles, arabic=True))
    story.append(p_ar(narrative_ar or "تم إنشاء الملخص من تحليلات الجلسة.", styles["body_ar"]))

    story.append(Spacer(1, 10))
    story.append(
        p_ar(
            "الامتثال لـ KHDA: يدعم هذا التقرير التخطيط التعليمي الشامل بموجب إرشادات KHDA لدعم SEND. "
            "للمختصين المصرح لهم فقط. لا يتم تخزين إطارات الفيديو؛ يُحتفظ فقط ببيانات الجلسة.",
            styles["body_ar"],
        )
    )

    doc.build(story, onFirstPage=khda_footer, onLaterPages=khda_footer)
    with open(out_path, "rb") as f:
        return f.read()


def generate_session_report_pdf(
    *,
    child_name: str,
    child_age: int | str,
    diagnosis: str,
    communication_level: str,
    interests: list[str] | None,
    topic: str,
    assessor_name: str,
    assessor_role: str,
    insights: dict[str, Any],
    narrative_en: str,
    narrative_ar: str,
    language: str = "both",
    session_id: str = "session",
) -> Path:
    """
    Branded bilingual AAC session PDF.
    language: 'en' | 'ar' | 'both' (default both for demo / interview).
    """
    emotion_dist = insights.get("emotion_distribution") or {}
    top_cards = insights.get("top_cards") or []
    duration = float(insights.get("duration_minutes") or 0)
    volatility = float(insights.get("volatility") or 0)
    total_selections = int(insights.get("total_selections") or 0)
    stability = max(0.0, (1.0 - volatility) * 100.0)
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    interests_str = ", ".join(interests) if interests else "Not recorded"
    interests_ar = "، ".join(interests) if interests else "غير مسجّلة"
    role_label = str(assessor_role or "").replace("_", " ").title()

    recommendations_en = [
        "Continue AAC sessions at the current frequency.",
        "Focus on emotional regulation strategies during high-stress topics.",
        "Keep communication partners consistent across school and home.",
        "Monitor emotional volatility trends over successive sessions.",
    ]
    recommendations_ar = [
        "المتابعة المنتظمة لجلسات الاتصال البديل بالمعدل الحالي.",
        "التركيز على استراتيجيات تنظيم المشاعر أثناء المواضيع عالية التوتر.",
        "الحفاظ على اتساق شركاء التواصل بين المدرسة والمنزل.",
        "مراقبة تذبذب الحالة العاطفية عبر الجلسات المتتالية.",
    ]

    def _emotion_rows(arabic: bool = False) -> list[list[str]]:
        rows: list[list[str]] = []
        for k, v in sorted(emotion_dist.items(), key=lambda kv: kv[1], reverse=True)[:8]:
            pct = v if v > 1 else v * 100
            label = EMOTION_AR.get(str(k).lower(), str(k).capitalize()) if arabic else str(k).capitalize()
            rows.append([label, f"{pct:.1f}%"])
        if not rows:
            rows = [["Neutral", "—"]] if not arabic else [["محايد", "—"]]
        return rows

    def _card_rows(arabic: bool = False) -> list[list[str]]:
        rows: list[list[str]] = []
        for c in top_cards[:8]:
            if isinstance(c, dict):
                rows.append([str(c.get("label", "")), str(c.get("count", 0))])
        if not rows:
            rows = [["—", "0"]] if not arabic else [["لا توجد بطاقات", "0"]]
        return rows

    styles = build_pdf_styles()
    tmp_dir = _safe_tmp_dir()
    out_path = tmp_dir / f"session_{session_id}_{language}.pdf"
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=48,
        bottomMargin=56,
    )
    story: list[Any] = []
    lang = (language or "both").lower()
    include_en = lang in ("en", "both", "bilingual")
    include_ar = lang in ("ar", "both", "bilingual")
    if not include_en and not include_ar:
        include_en = include_ar = True

    if include_en:
        story.append(
            branded_header(
                "SyNAPSE AAC Session Report",
                f"MAHE Dubai · Session {session_id[:8]} · Generated {generated_at}",
                styles,
            )
        )
        story.append(accent_rule())
        story.append(Spacer(1, 12))
        story.append(
            kpi_row(
                [
                    ("Duration", f"{duration:.1f} min"),
                    ("AAC taps", str(total_selections)),
                    ("Stability", f"{stability:.0f}%"),
                    ("Emotions logged", str(insights.get("total_emotions") or 0)),
                ],
                styles,
            )
        )
        story.append(Spacer(1, 12))
        story.append(section_bar("Child & session details", styles))
        story.append(
            info_grid(
                [
                    ("Child", f"{child_name} (Age {child_age})"),
                    ("Diagnosis", str(diagnosis or "—")),
                    ("Communication level", str(communication_level or "—")),
                    ("Interests", interests_str),
                    ("Session topic", str(topic or "—")),
                    ("Assessed by", f"{assessor_name} ({role_label})"),
                ],
                styles,
            )
        )
        story.append(Spacer(1, 10))
        story.append(section_bar("Emotion analysis", styles))
        story.append(styled_data_table(["Emotion", "Share of session"], _emotion_rows(False)))
        story.append(Spacer(1, 10))
        story.append(section_bar("Top AAC cards", styles))
        story.append(styled_data_table(["Card", "Selections"], _card_rows(False)))
        story.append(Spacer(1, 10))
        story.append(section_bar("Clinical summary", styles))
        story.append(p_en(narrative_en or "Session analytics summarised successfully.", styles["body_en"]))
        story.append(Spacer(1, 6))
        story.append(section_bar("Recommendations", styles))
        for i, rec in enumerate(recommendations_en, 1):
            story.append(p_en(f"{i}. {rec}", styles["body_en"]))
        story.append(Spacer(1, 10))
        story.append(
            p_en(
                "Confidential — UAE Federal Decree-Law No. 45 of 2021 (PDPL). "
                "No video is stored; only session metadata and derived analytics are retained. "
                "Authorized educational/clinical recipients only.",
                styles["small_en"],
            )
        )

    if include_en and include_ar:
        story.append(PageBreak())

    if include_ar:
        story.append(
            branded_header_ar(
                "تقرير جلسة الاتصال البديل — نظام SyNAPSE",
                f"MAHE Dubai · {generated_at}",
                styles,
            )
        )
        story.append(accent_rule())
        story.append(Spacer(1, 12))
        story.append(
            kpi_row(
                [
                    ("المدة", f"{duration:.1f} د"),
                    ("نقرات AAC", str(total_selections)),
                    ("الاستقرار", f"{stability:.0f}%"),
                    ("ملاحظات المشاعر", str(insights.get("total_emotions") or 0)),
                ],
                styles,
                arabic=True,
            )
        )
        story.append(Spacer(1, 12))
        story.append(section_bar("تفاصيل الطفل والجلسة", styles, arabic=True))
        story.append(
            info_grid_ar(
                [
                    ("الطفل", f"{child_name} (العمر {child_age})"),
                    ("التشخيص", str(diagnosis or "—")),
                    ("مستوى التواصل", str(communication_level or "—")),
                    ("الاهتمامات", interests_ar),
                    ("موضوع الجلسة", str(topic or "—")),
                    ("تم التقييم بواسطة", f"{assessor_name} ({role_label})"),
                ],
                styles,
            )
        )
        story.append(Spacer(1, 10))
        story.append(section_bar("تحليل المشاعر", styles, arabic=True))
        story.append(
            styled_data_table(["المشاعر", "النسبة من الجلسة"], _emotion_rows(True), arabic=True)
        )
        story.append(Spacer(1, 10))
        story.append(section_bar("أكثر بطاقات AAC استخداماً", styles, arabic=True))
        story.append(styled_data_table(["البطاقة", "عدد المرات"], _card_rows(True), arabic=True))
        story.append(Spacer(1, 10))
        story.append(section_bar("الملخص السريري", styles, arabic=True))
        story.append(p_ar(narrative_ar or "تم إنشاء ملخص الجلسة من التحليلات.", styles["body_ar"]))
        story.append(Spacer(1, 6))
        story.append(section_bar("التوصيات", styles, arabic=True))
        for i, rec in enumerate(recommendations_ar, 1):
            story.append(p_ar(f"{i}. {rec}", styles["body_ar"]))
        story.append(Spacer(1, 10))
        story.append(
            p_ar(
                "سري — المرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية. "
                "لا يتم تخزين الفيديو؛ يُحتفظ فقط ببيانات الجلسة والتحليلات المشتقة. "
                "للمستلمين المصرح لهم فقط.",
                styles["body_ar"],
            )
        )

    doc.build(story, onFirstPage=khda_footer, onLaterPages=khda_footer)
    return out_path


