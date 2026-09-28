from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Child, EmotionAlert, EmotionLog, Session

# Cautious emotions that trigger caregiver/teacher alerts
CAUTIOUS_EMOTIONS = frozenset({"sad", "angry", "fear", "disgust"})

# Higher bar reduces DeepFace false positives (e.g. neutral→sad)
MIN_ALERT_CONFIDENCE = 0.55

# Must beat the runner-up emotion by this margin (percentage points in all_scores)
MIN_DOMINANCE_MARGIN = 8.0

# No second alert for same child+session inside this window (acked or not)
ALERT_COOLDOWN_SECONDS = 180

# Need this many consecutive cautious logs before alerting
SUSTAINED_HITS = 2

SUPPORT_MESSAGES = {
    "sad": {
        "en": "I'm here with you. You're safe — take your time. Use a card if you want to tell me something.",
        "ar": "أنا معك. أنت بأمان — خذ وقتك. استخدم بطاقة إذا أردت أن تخبرني شيئاً.",
    },
    "angry": {
        "en": "It's okay to feel upset. Let's take a slow breath together. I'm listening.",
        "ar": "من الطبيعي أن تشعر بالغضب. لنأخذ نفساً بطيئاً معاً. أنا أستمع إليك.",
    },
    "fear": {
        "en": "You're safe. I'm right here to help. You can tap a card whenever you're ready.",
        "ar": "أنت بأمان. أنا هنا لمساعدتك. يمكنك الضغط على بطاقة متى ما كنت مستعداً.",
    },
    "disgust": {
        "en": "Thank you for showing how you feel. We can change the activity if you want.",
        "ar": "شكراً لأنك أظهرت شعورك. يمكننا تغيير النشاط إذا أردت.",
    },
    "default": {
        "en": "I see you may need support. I'm here with you — use your AAC cards to tell me what you need.",
        "ar": "أرى أنك قد تحتاج إلى دعم. أنا معك — استخدم بطاقاتك لتخبرني بما تحتاجه.",
    },
}


def support_message_for_emotion(emotion_label: str) -> dict[str, str]:
    key = normalize_emotion_label(emotion_label)
    return SUPPORT_MESSAGES.get(key, SUPPORT_MESSAGES["default"])


def normalize_emotion_label(label: str) -> str:
    key = str(label or "neutral").lower().strip()
    aliases = {
        "distress": "sad",
        "scared": "fear",
        "afraid": "fear",
        "frustrated": "angry",
        "frustration": "angry",
        "upset": "sad",
        "yucky": "disgust",
    }
    return aliases.get(key, key)


def is_cautious_emotion(label: str, confidence: float, *, threshold: float | None = None) -> bool:
    normalized = normalize_emotion_label(label)
    min_conf = MIN_ALERT_CONFIDENCE if threshold is None else float(threshold)
    return normalized in CAUTIOUS_EMOTIONS and confidence >= min_conf


def emotion_is_dominant(all_scores: dict[str, Any] | None, label: str, confidence: float) -> bool:
    """Reject weak/ambiguous DeepFace winners (common false 'sad')."""
    if confidence < MIN_ALERT_CONFIDENCE:
        return False
    if not all_scores:
        return confidence >= MIN_ALERT_CONFIDENCE
    scores = {normalize_emotion_label(k): float(v) for k, v in all_scores.items()}
    # DeepFace often returns 0–100; normalize to same scale as confidence if needed
    top = scores.get(normalize_emotion_label(label))
    if top is None:
        return confidence >= MIN_ALERT_CONFIDENCE
    others = [v for k, v in scores.items() if k != normalize_emotion_label(label)]
    second = max(others) if others else 0.0
    # If scores look like probabilities 0–1, scale margin
    margin = MIN_DOMINANCE_MARGIN if top > 1.5 else (MIN_DOMINANCE_MARGIN / 100.0)
    return (top - second) >= margin


def environment_for_session(session_type: str) -> str:
    if session_type == "home":
        return "home"
    return "school"


def resolve_recipient(child: Child, session_type: str) -> tuple[Optional[str], str]:
    """Return (user_id, role) for alert recipient."""
    if session_type == "home":
        if child.caregiver_id:
            return child.caregiver_id, "caregiver"
        return child.teacher_id, "teacher"
    if child.teacher_id:
        return child.teacher_id, "teacher"
    if child.caregiver_id:
        return child.caregiver_id, "caregiver"
    return None, "teacher"


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def maybe_create_emotion_alert(
    db: AsyncSession,
    *,
    session: Session,
    child: Child,
    emotion_label: str,
    confidence: float,
    intensity: int,
    alert_manager: Any | None = None,
    all_scores: dict[str, Any] | None = None,
) -> Optional[EmotionAlert]:
    if not is_cautious_emotion(emotion_label, confidence):
        return None
    if not emotion_is_dominant(all_scores, emotion_label, confidence):
        return None

    emotion_label = normalize_emotion_label(emotion_label)
    recipient_id, recipient_role = resolve_recipient(child, session.session_type)
    if not recipient_id:
        return None

    # Cooldown: any recent alert for this session (even if already acknowledged)
    since = datetime.now(timezone.utc) - timedelta(seconds=ALERT_COOLDOWN_SECONDS)
    recent = await db.execute(
        select(EmotionAlert)
        .where(
            EmotionAlert.child_id == child.id,
            EmotionAlert.session_id == session.id,
            EmotionAlert.recipient_user_id == recipient_id,
        )
        .order_by(EmotionAlert.created_at.desc())
        .limit(1)
    )
    last = recent.scalar_one_or_none()
    if last is not None:
        last_at = _aware(last.created_at)
        if last_at and last_at >= since:
            return None

    # Require sustained signal: last N emotion logs for this session are cautious
    logs_res = await db.execute(
        select(EmotionLog)
        .where(EmotionLog.session_id == session.id)
        .order_by(EmotionLog.timestamp.desc())
        .limit(SUSTAINED_HITS)
    )
    recent_logs = list(logs_res.scalars().all())
    if len(recent_logs) < SUSTAINED_HITS:
        return None
    if not all(
        is_cautious_emotion(log.emotion_label, float(log.confidence or 0))
        for log in recent_logs
    ):
        return None

    # Auto-clear older unacked alerts for this recipient so the UI doesn't drip-feed a backlog
    stale = await db.execute(
        select(EmotionAlert).where(
            EmotionAlert.recipient_user_id == recipient_id,
            EmotionAlert.acknowledged.is_(False),
        )
    )
    for old in stale.scalars().all():
        old.acknowledged = True

    env = environment_for_session(session.session_type)
    alert = EmotionAlert(
        id=str(uuid.uuid4()),
        child_id=child.id,
        session_id=session.id,
        emotion_label=emotion_label.lower(),
        confidence=float(confidence),
        intensity=int(intensity),
        recipient_user_id=recipient_id,
        recipient_role=recipient_role,
        environment=env,
        acknowledged=False,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    if alert_manager:
        payload = {
            "event": "emotion_alert",
            "alert_id": alert.id,
            "child_id": child.id,
            "child_name": child.name,
            "session_id": session.id,
            "emotion": alert.emotion_label,
            "confidence": alert.confidence,
            "intensity": alert.intensity,
            "environment": env,
            "recipient_role": recipient_role,
            "message_en": (
                f"{child.name} may need support — detected {alert.emotion_label} "
                f"({'at home' if env == 'home' else 'at school'}, "
                f"{int(alert.confidence * 100) if alert.confidence <= 1 else int(alert.confidence)}% confidence)."
            ),
            "message_ar": (
                f"قد يحتاج {child.name} إلى دعم — تم رصد {alert.emotion_label} "
                f"({'في المنزل' if env == 'home' else 'في المدرسة'})."
            ),
            "aac_session_path": (
                "/caregiver/session" if recipient_role == "caregiver" else "/teacher/sessions-hub"
            ),
        }
        await alert_manager.broadcast_to_user(recipient_id, payload)

    return alert
