from __future__ import annotations

from fastapi import APIRouter

from schemas import SupportChatRequest, SupportChatResponse
from services.llm_service import answer_project_support_question

router = APIRouter(prefix="/api/support", tags=["support"])


def _faq_answer(message: str) -> str:
    q = (message or "").lower()

    if any(k in q for k in ["what is synapse", "about", "project", "what does this do"]):
        return (
            "SyNAPSE is an emotion-aware AAC platform for minimally verbal neurodiverse children. "
            "It helps children communicate using adaptive bilingual cards while supporting teachers, caregivers, and SEND officers."
        )
    if any(k in q for k in ["role", "users", "who can use", "stakeholder"]):
        return (
            "The platform has 4 roles: Student, Teacher, Caregiver, and SEND Officer. "
            "Each role has its own dashboard and workflow."
        )
    if any(k in q for k in ["emotion", "detect", "deepface", "how emotion works"]):
        return (
            "SyNAPSE uses DeepFace to detect 7 emotions from webcam frames: happy, sad, angry, fear, disgust, surprise, and neutral. "
            "Only emotion metadata is stored; video is not saved."
        )
    if any(k in q for k in ["card", "aac", "board"]):
        return (
            "Each session shows 16 AAC cards: 8 core words, 4 emotion-based cards, and 4 topic cards. "
            "Cards are bilingual (English and Arabic) and can be generated via local LLM with rule-based fallback."
        )
    if any(k in q for k in ["alert", "notification", "teacher", "caregiver"]):
        return (
            "If a cautious emotion (sad, angry, fear, disgust) is detected with confidence >= 0.45, "
            "SyNAPSE sends alerts to the teacher during school sessions or to the caregiver during home sessions."
        )
    if any(k in q for k in ["privacy", "store video", "data safety", "safe"]):
        return (
            "SyNAPSE is privacy-focused: camera frames are processed temporarily and deleted. "
            "The system stores only session metadata such as emotion labels, confidence, and selected cards."
        )
    if any(k in q for k in ["tech", "stack", "built with"]):
        return (
            "SyNAPSE is built with FastAPI, React, SQLite, DeepFace, Ollama (Llama 3), WebSockets, and ReportLab. "
            "It also supports PWA and Android packaging with Capacitor."
        )
    if any(k in q for k in ["report", "pdf", "khda", "send"]):
        return (
            "The project supports SEND workflows with phase-based assessment notes and downloadable PDF reports, "
            "including session summaries and KHDA-style outputs."
        )
    if any(k in q for k in ["monitor", "6 minute", "six minute", "interval"]):
        return (
            "Emotion monitoring runs every 6 minutes during active sessions, with optional browser-extension tick support."
        )

    return (
        "I can help with project questions about features, roles, emotion detection, alerts, privacy, reports, and tech stack. "
        "Try asking: 'How do alerts work?' or 'What makes SyNAPSE different from static AAC apps?'"
    )


@router.post("/chat", response_model=SupportChatResponse)
async def support_chat(payload: SupportChatRequest) -> SupportChatResponse:
    question = payload.message.strip()
    faq = _faq_answer(question)
    llm_text = await answer_project_support_question(question)
    if llm_text:
        return SupportChatResponse(answer=llm_text[:1200], source="llm")
    return SupportChatResponse(answer=faq, source="faq")

