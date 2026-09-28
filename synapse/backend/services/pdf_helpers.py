from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, Paragraph, Spacer, Table, TableStyle

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
FONT_DIR = ASSETS_DIR / "fonts"
LOGO_PATH = ASSETS_DIR / "synapse-logo.png"
AR_FONT_FILE = FONT_DIR / "NotoSansArabic-Regular.ttf"

# Windows system fonts that include Arabic glyphs (fallback if Noto missing)
_WINDOWS_AR_CANDIDATES = [
    Path(r"C:\Windows\Fonts\arial.ttf"),
    Path(r"C:\Windows\Fonts\tahoma.ttf"),
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
]

BRAND_GREEN = colors.HexColor("#4a7a5a")
BRAND_DARK = colors.HexColor("#2c3e35")
BRAND_LIGHT = colors.HexColor("#e8f4ec")
BRAND_ACCENT = colors.HexColor("#3d6b4f")
MUTED = colors.HexColor("#7a8a80")
SOFT_GRID = colors.HexColor("#d5e4da")

EMOTION_AR = {
    "happy": "\u0633\u0639\u064a\u062f",
    "sad": "\u062d\u0632\u064a\u0646",
    "angry": "\u063a\u0627\u0636\u0628",
    "fear": "\u062e\u0627\u0626\u0641",
    "fearful": "\u062e\u0627\u0626\u0641",
    "disgust": "\u0627\u0634\u0645\u0626\u0632\u0627\u0632",
    "surprise": "\u0645\u0646\u062f\u0647\u0634",
    "surprised": "\u0645\u0646\u062f\u0647\u0634",
    "neutral": "\u0645\u062d\u0627\u064a\u062f",
}

AR_FONT_NAME = "NotoArabic"


@lru_cache(maxsize=1)
def register_pdf_fonts() -> str:
    """Register an Arabic-capable TTF; return the ReportLab font name."""
    candidates = [AR_FONT_FILE, *_WINDOWS_AR_CANDIDATES]
    for path in candidates:
        if path.exists():
            try:
                pdfmetrics.registerFont(TTFont(AR_FONT_NAME, str(path)))
                return AR_FONT_NAME
            except Exception:
                continue
    # Last resort: Helvetica (Latin only — Arabic will be missing)
    return "Helvetica"


def arabic_font() -> str:
    return register_pdf_fonts()


def reshape_arabic(text: str) -> str:
    if not text or not str(text).strip():
        return ""
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)


def escape_xml(text: str) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def p_en(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape_xml(text).replace("\n", "<br/>"), style)


def p_ar(text: str, style: ParagraphStyle) -> Paragraph:
    register_pdf_fonts()
    shaped = reshape_arabic(text)
    return Paragraph(escape_xml(shaped).replace("\n", "<br/>"), style)


def build_pdf_styles() -> dict[str, ParagraphStyle]:
    ar = arabic_font()
    return {
        "title_en": ParagraphStyle(
            "title_en",
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=BRAND_DARK,
            spaceAfter=4,
        ),
        "subtitle_en": ParagraphStyle(
            "subtitle_en",
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=MUTED,
            spaceAfter=8,
        ),
        "h2_en": ParagraphStyle(
            "h2_en",
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=BRAND_GREEN,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body_en": ParagraphStyle(
            "body_en",
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=BRAND_DARK,
            spaceAfter=5,
        ),
        "small_en": ParagraphStyle(
            "small_en",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=MUTED,
        ),
        "title_ar": ParagraphStyle(
            "title_ar",
            fontName=ar,
            fontSize=17,
            leading=23,
            alignment=TA_RIGHT,
            textColor=BRAND_DARK,
            spaceAfter=4,
        ),
        "h2_ar": ParagraphStyle(
            "h2_ar",
            fontName=ar,
            fontSize=11,
            leading=15,
            alignment=TA_RIGHT,
            textColor=BRAND_GREEN,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body_ar": ParagraphStyle(
            "body_ar",
            fontName=ar,
            fontSize=10,
            leading=15,
            alignment=TA_RIGHT,
            textColor=BRAND_DARK,
            spaceAfter=5,
        ),
        "center_en": ParagraphStyle(
            "center_en",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=MUTED,
        ),
        "kpi_en": ParagraphStyle(
            "kpi_en",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            alignment=TA_CENTER,
            textColor=BRAND_GREEN,
        ),
        "kpi_label_en": ParagraphStyle(
            "kpi_label_en",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=MUTED,
        ),
        "kpi_ar": ParagraphStyle(
            "kpi_ar",
            fontName=ar,
            fontSize=15,
            leading=18,
            alignment=TA_CENTER,
            textColor=BRAND_GREEN,
        ),
        "kpi_label_ar": ParagraphStyle(
            "kpi_label_ar",
            fontName=ar,
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=MUTED,
        ),
    }


def logo_image(width: float = 0.75 * inch) -> Image | Spacer:
    if LOGO_PATH.exists():
        return Image(str(LOGO_PATH), width=width, height=width)
    return Spacer(width, width)


def branded_header(title_en: str, subtitle_en: str, styles: dict[str, ParagraphStyle]) -> Table:
    logo = logo_image()
    text_block = [
        Paragraph(f"<b>{escape_xml(title_en)}</b>", styles["title_en"]),
        Paragraph(escape_xml(subtitle_en), styles["subtitle_en"]),
    ]
    tbl = Table([[logo, text_block]], colWidths=[0.95 * inch, 5.55 * inch])
    tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ]
        )
    )
    return tbl


def branded_header_ar(title_ar: str, subtitle: str, styles: dict[str, ParagraphStyle]) -> Table:
    logo = logo_image()
    text_block = [
        p_ar(title_ar, styles["title_ar"]),
        Paragraph(escape_xml(subtitle), styles["subtitle_en"]),
    ]
    tbl = Table([[text_block, logo]], colWidths=[5.55 * inch, 0.95 * inch])
    tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def accent_rule() -> Table:
    tbl = Table([[""]], colWidths=[6.5 * inch], rowHeights=[4])
    tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), BRAND_GREEN)]))
    return tbl


def section_bar(label: str, styles: dict[str, ParagraphStyle], arabic: bool = False) -> Table:
    style = styles["h2_ar"] if arabic else styles["h2_en"]
    display = reshape_arabic(label) if arabic else label
    tbl = Table([[Paragraph(f"<b>{escape_xml(display)}</b>", style)]], colWidths=[6.5 * inch])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT),
                ("BOX", (0, 0), (-1, -1), 1, BRAND_GREEN),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return tbl


def kpi_row(
    items: list[tuple[str, str]],
    styles: dict[str, ParagraphStyle],
    arabic: bool = False,
) -> Table:
    value_style = styles["kpi_ar"] if arabic else styles["kpi_en"]
    label_style = styles["kpi_label_ar"] if arabic else styles["kpi_label_en"]
    cells = []
    for label, value in items:
        if arabic:
            cells.append([p_ar(value, value_style), p_ar(label, label_style)])
        else:
            cells.append(
                [
                    Paragraph(escape_xml(value), value_style),
                    Paragraph(escape_xml(label), label_style),
                ]
            )
    n = max(len(cells), 1)
    width = 6.5 / n
    tbl = Table([cells], colWidths=[width * inch] * n)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT),
                ("BOX", (0, 0), (-1, -1), 1, SOFT_GRID),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, SOFT_GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def info_grid(rows: list[tuple[str, str]], styles: dict[str, ParagraphStyle]) -> Table:
    data = [
        [Paragraph(f"<b>{escape_xml(k)}</b>", styles["body_en"]), Paragraph(escape_xml(v), styles["body_en"])]
        for k, v in rows
    ]
    tbl = Table(data, colWidths=[1.9 * inch, 4.6 * inch])
    tbl.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, SOFT_GRID),
                ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return tbl


def info_grid_ar(rows: list[tuple[str, str]], styles: dict[str, ParagraphStyle]) -> Table:
    data = [[p_ar(v, styles["body_ar"]), p_ar(k, styles["body_ar"])] for k, v in rows]
    tbl = Table(data, colWidths=[4.6 * inch, 1.9 * inch])
    tbl.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, SOFT_GRID),
                ("BACKGROUND", (1, 0), (1, -1), BRAND_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return tbl


def styled_data_table(headers: list[str], rows: list[list[str]], arabic: bool = False) -> Table:
    ar = arabic_font()
    if arabic:
        headers = [reshape_arabic(h) for h in headers]
        rows = [[reshape_arabic(c) if _looks_arabic(c) else c for c in row] for row in rows]
        header_font = ar
        body_font = ar
        alignment = "RIGHT"
    else:
        header_font = "Helvetica-Bold"
        body_font = "Helvetica"
        alignment = "LEFT"

    col_count = max(len(headers), 1)
    width = 6.5 / col_count
    data = [headers] + rows
    tbl = Table(data, colWidths=[width * inch] * col_count, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), header_font),
                ("FONTNAME", (0, 1), (-1, -1), body_font),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, SOFT_GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), alignment),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fbf8")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return tbl


def _looks_arabic(text: str) -> bool:
    return any("\u0600" <= ch <= "\u06FF" for ch in str(text))


def khda_footer(canvas, doc) -> None:
    canvas.saveState()
    width, _ = doc.pagesize
    canvas.setStrokeColor(SOFT_GRID)
    canvas.setLineWidth(1)
    canvas.line(36, 42, width - 36, 42)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(
        36,
        28,
        "SyNAPSE | MAHE Dubai | UAE PDPL (Federal Decree-Law No. 45/2021) | Authorized use only",
    )
    canvas.drawRightString(width - 36, 28, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()
