from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional


def _slugify(s: str) -> str:
    s2 = s.strip().lower()
    s2 = re.sub(r"[^a-z0-9]+", "-", s2)
    return s2.strip("-")[:32] or "card"


def _normalize_llm_card(suggestion: str, idx: int) -> Dict[str, Any]:
    label = str(suggestion).strip()
    return {
        "id": f"llm-{idx + 1}-{_slugify(label)}",
        "label": label,
        "label_ar": label,
        "emoji": "💬",
        "category": "topic",
        "color": "emerald",
        "position": 0,
    }


CORE_CARDS = [
    {
        "id": "core-i-want",
        "label": "I want",
        "label_ar": "أريد",
        "emoji": "🙋",
        "category": "core",
        "color": "amber",
        "position": 1,
    },
    {
        "id": "core-stop",
        "label": "Stop",
        "label_ar": "توقف",
        "emoji": "🛑",
        "category": "core",
        "color": "amber",
        "position": 2,
    },
    {
        "id": "core-more",
        "label": "More",
        "label_ar": "المزيد",
        "emoji": "➕",
        "category": "core",
        "color": "amber",
        "position": 3,
    },
    {
        "id": "core-all-done",
        "label": "All done",
        "label_ar": "انتهى",
        "emoji": "✅",
        "category": "core",
        "color": "amber",
        "position": 4,
    },
    {
        "id": "core-help",
        "label": "I need help",
        "label_ar": "أحتاج مساعدة",
        "emoji": "🆘",
        "category": "core",
        "color": "amber",
        "position": 5,
    },
    {
        "id": "core-yes",
        "label": "Yes",
        "label_ar": "نعم",
        "emoji": "👍",
        "category": "core",
        "color": "amber",
        "position": 6,
    },
    {
        "id": "core-no",
        "label": "No",
        "label_ar": "لا",
        "emoji": "👎",
        "category": "core",
        "color": "amber",
        "position": 7,
    },
    {
        "id": "core-wait",
        "label": "Wait",
        "label_ar": "انتظر",
        "emoji": "⏳",
        "category": "core",
        "color": "amber",
        "position": 8,
    },
]


EMOTION_CARDS: Dict[str, List[Dict[str, Any]]] = {
    "happy": [
        {"id": "emo-happy-1", "label": "I feel happy", "label_ar": "أشعر بالسعادة", "emoji": "😊", "category": "emotion", "color": "amber", "position": 5},
        {"id": "emo-happy-2", "label": "Great!", "label_ar": "رائع!", "emoji": "🎉", "category": "emotion", "color": "amber", "position": 6},
        {"id": "emo-happy-3", "label": "I like this", "label_ar": "أحب هذا", "emoji": "👍", "category": "emotion", "color": "amber", "position": 7},
        {"id": "emo-happy-4", "label": "More please", "label_ar": "المزيد من فضلك", "emoji": "➕", "category": "emotion", "color": "amber", "position": 8},
    ],
    "sad": [
        {"id": "emo-sad-1", "label": "I feel sad", "label_ar": "أشعر بالحزن", "emoji": "😢", "category": "emotion", "color": "blue", "position": 5},
        {"id": "emo-sad-2", "label": "I need a hug", "label_ar": "أحتاج عناقاً", "emoji": "🤗", "category": "emotion", "color": "blue", "position": 6},
        {"id": "emo-sad-3", "label": "It's okay", "label_ar": "كل شيء على ما يرام", "emoji": "❤️", "category": "emotion", "color": "blue", "position": 7},
        {"id": "emo-sad-4", "label": "I want to rest", "label_ar": "أريد الراحة", "emoji": "🛏️", "category": "emotion", "color": "blue", "position": 8},
    ],
    "angry": [
        {"id": "emo-angry-1", "label": "I feel angry", "label_ar": "أشعر بالغضب", "emoji": "😠", "category": "emotion", "color": "red", "position": 5},
        {"id": "emo-angry-2", "label": "I need space", "label_ar": "أحتاج مساحة", "emoji": "🫸", "category": "emotion", "color": "red", "position": 6},
        {"id": "emo-angry-3", "label": "Calm down", "label_ar": "اهدأ", "emoji": "🌬️", "category": "emotion", "color": "red", "position": 7},
        {"id": "emo-angry-4", "label": "Not now", "label_ar": "ليس الآن", "emoji": "🚫", "category": "emotion", "color": "red", "position": 8},
    ],
    "fear": [
        {"id": "emo-fear-1", "label": "I feel scared", "label_ar": "أشعر بالخوف", "emoji": "😨", "category": "emotion", "color": "purple", "position": 5},
        {"id": "emo-fear-2", "label": "It's safe", "label_ar": "آمن", "emoji": "🛡️", "category": "emotion", "color": "purple", "position": 6},
        {"id": "emo-fear-3", "label": "Stay with me", "label_ar": "ابق معي", "emoji": "🫂", "category": "emotion", "color": "purple", "position": 7},
        {"id": "emo-fear-4", "label": "I need help", "label_ar": "أحتاج مساعدة", "emoji": "🆘", "category": "emotion", "color": "purple", "position": 8},
    ],
    "surprise": [
        {"id": "emo-surprise-1", "label": "Wow!", "label_ar": "واو!", "emoji": "😲", "category": "emotion", "color": "indigo", "position": 5},
        {"id": "emo-surprise-2", "label": "What is that?", "label_ar": "ما هذا؟", "emoji": "❓", "category": "emotion", "color": "indigo", "position": 6},
        {"id": "emo-surprise-3", "label": "New thing", "label_ar": "شيء جديد", "emoji": "🆕", "category": "emotion", "color": "indigo", "position": 7},
        {"id": "emo-surprise-4", "label": "Interesting", "label_ar": "مثير للاهتمام", "emoji": "🤔", "category": "emotion", "color": "indigo", "position": 8},
    ],
    "disgust": [
        {"id": "emo-disgust-1", "label": "Yuck", "label_ar": "يخ", "emoji": "🤢", "category": "emotion", "color": "lime", "position": 5},
        {"id": "emo-disgust-2", "label": "No thank you", "label_ar": "لا شكراً", "emoji": "🙅", "category": "emotion", "color": "lime", "position": 6},
        {"id": "emo-disgust-3", "label": "Different one", "label_ar": "واحد آخر", "emoji": "🔄", "category": "emotion", "color": "lime", "position": 7},
        {"id": "emo-disgust-4", "label": "I don't like it", "label_ar": "لا أحبه", "emoji": "👎", "category": "emotion", "color": "lime", "position": 8},
    ],
    "neutral": [
        {"id": "emo-neutral-1", "label": "Okay", "label_ar": "حسناً", "emoji": "😐", "category": "emotion", "color": "slate", "position": 5},
        {"id": "emo-neutral-2", "label": "I don't know", "label_ar": "لا أعرف", "emoji": "🤷", "category": "emotion", "color": "slate", "position": 6},
        {"id": "emo-neutral-3", "label": "Maybe", "label_ar": "ربما", "emoji": "🤔", "category": "emotion", "color": "slate", "position": 7},
        {"id": "emo-neutral-4", "label": "Wait", "label_ar": "انتظر", "emoji": "⏳", "category": "emotion", "color": "slate", "position": 8},
    ],
}


TOPIC_CARDS: Dict[str, List[Dict[str, Any]]] = {
    "school": [
        {"id": "sch-1", "label": "Teacher", "label_ar": "المعلم", "emoji": "👩‍🏫", "category": "topic", "color": "emerald", "position": 9},
        {"id": "sch-2", "label": "Friend", "label_ar": "صديق", "emoji": "👦", "category": "topic", "color": "emerald", "position": 10},
        {"id": "sch-3", "label": "Book", "label_ar": "كتاب", "emoji": "📖", "category": "topic", "color": "emerald", "position": 11},
        {"id": "sch-4", "label": "Math", "label_ar": "رياضيات", "emoji": "➗", "category": "topic", "color": "emerald", "position": 12},
        {"id": "sch-5", "label": "Recess", "label_ar": "استراحة", "emoji": "🏃", "category": "topic", "color": "emerald", "position": 13},
        {"id": "sch-6", "label": "Classroom", "label_ar": "الصف", "emoji": "🏫", "category": "topic", "color": "emerald", "position": 14},
        {"id": "sch-7", "label": "Homework", "label_ar": "واجب منزلي", "emoji": "📝", "category": "topic", "color": "emerald", "position": 15},
        {"id": "sch-8", "label": "Bus", "label_ar": "الحافلة", "emoji": "🚌", "category": "topic", "color": "emerald", "position": 16},
    ],
    "home": [
        {"id": "home-1", "label": "Mom", "label_ar": "أمي", "emoji": "👩", "category": "topic", "color": "emerald", "position": 9},
        {"id": "home-2", "label": "Dad", "label_ar": "أبي", "emoji": "👨", "category": "topic", "color": "emerald", "position": 10},
        {"id": "home-3", "label": "Bed", "label_ar": "السرير", "emoji": "🛏️", "category": "topic", "color": "emerald", "position": 11},
        {"id": "home-4", "label": "Eat", "label_ar": "أكل", "emoji": "🍽️", "category": "topic", "color": "emerald", "position": 12},
        {"id": "home-5", "label": "TV", "label_ar": "تلفزيون", "emoji": "📺", "category": "topic", "color": "emerald", "position": 13},
        {"id": "home-6", "label": "Toilet", "label_ar": "الحمام", "emoji": "🚽", "category": "topic", "color": "emerald", "position": 14},
        {"id": "home-7", "label": "Family", "label_ar": "العائلة", "emoji": "👨‍👩‍👧", "category": "topic", "color": "emerald", "position": 15},
        {"id": "home-8", "label": "Sleep", "label_ar": "نوم", "emoji": "😴", "category": "topic", "color": "emerald", "position": 16},
    ],
    "feelings": [
        {"id": "feel-1", "label": "Happy", "label_ar": "سعيد", "emoji": "😊", "category": "topic", "color": "emerald", "position": 9},
        {"id": "feel-2", "label": "Sad", "label_ar": "حزين", "emoji": "😢", "category": "topic", "color": "emerald", "position": 10},
        {"id": "feel-3", "label": "Angry", "label_ar": "غاضب", "emoji": "😠", "category": "topic", "color": "emerald", "position": 11},
        {"id": "feel-4", "label": "Scared", "label_ar": "خائف", "emoji": "😨", "category": "topic", "color": "emerald", "position": 12},
        {"id": "feel-5", "label": "Tired", "label_ar": "متعب", "emoji": "🥱", "category": "topic", "color": "emerald", "position": 13},
        {"id": "feel-6", "label": "Excited", "label_ar": "متحمس", "emoji": "🤩", "category": "topic", "color": "emerald", "position": 14},
        {"id": "feel-7", "label": "Calm", "label_ar": "هادئ", "emoji": "😌", "category": "topic", "color": "emerald", "position": 15},
        {"id": "feel-8", "label": "Love", "label_ar": "أحب", "emoji": "❤️", "category": "topic", "color": "emerald", "position": 16},
    ],
    "play": [
        {"id": "play-1", "label": "Ball", "label_ar": "كرة", "emoji": "⚽", "category": "topic", "color": "emerald", "position": 9},
        {"id": "play-2", "label": "Toy", "label_ar": "لعبة", "emoji": "🧸", "category": "topic", "color": "emerald", "position": 10},
        {"id": "play-3", "label": "Park", "label_ar": "الحديقة", "emoji": "🌳", "category": "topic", "color": "emerald", "position": 11},
        {"id": "play-4", "label": "Swing", "label_ar": "أرجوحة", "emoji": "🏌️", "category": "topic", "color": "emerald", "position": 12},
        {"id": "play-5", "label": "Run", "label_ar": "ركض", "emoji": "🏃", "category": "topic", "color": "emerald", "position": 13},
        {"id": "play-6", "label": "Game", "label_ar": "لعبة", "emoji": "🎮", "category": "topic", "color": "emerald", "position": 14},
        {"id": "play-7", "label": "Draw", "label_ar": "ارسم", "emoji": "🖍️", "category": "topic", "color": "emerald", "position": 15},
        {"id": "play-8", "label": "Music", "label_ar": "موسيقى", "emoji": "🎵", "category": "topic", "color": "emerald", "position": 16},
    ],
    "food": [
        {"id": "food-1", "label": "Water", "label_ar": "ماء", "emoji": "🥤", "category": "topic", "color": "emerald", "position": 9},
        {"id": "food-2", "label": "Apple", "label_ar": "تفاحة", "emoji": "🍎", "category": "topic", "color": "emerald", "position": 10},
        {"id": "food-3", "label": "Rice", "label_ar": "أرز", "emoji": "🍚", "category": "topic", "color": "emerald", "position": 11},
        {"id": "food-4", "label": "Chicken", "label_ar": "دجاج", "emoji": "🍗", "category": "topic", "color": "emerald", "position": 12},
        {"id": "food-5", "label": "Bread", "label_ar": "خبز", "emoji": "🍞", "category": "topic", "color": "emerald", "position": 13},
        {"id": "food-6", "label": "Milk", "label_ar": "حليب", "emoji": "🥛", "category": "topic", "color": "emerald", "position": 14},
        {"id": "food-7", "label": "Hungry", "label_ar": "جائع", "emoji": "🍽️", "category": "topic", "color": "emerald", "position": 15},
        {"id": "food-8", "label": "Full", "label_ar": "شبعان", "emoji": "😋", "category": "topic", "color": "emerald", "position": 16},
    ],
    "body": [
        {"id": "body-1", "label": "Head", "label_ar": "رأس", "emoji": "🗣️", "category": "topic", "color": "emerald", "position": 9},
        {"id": "body-2", "label": "Hand", "label_ar": "يد", "emoji": "✋", "category": "topic", "color": "emerald", "position": 10},
        {"id": "body-3", "label": "Tummy", "label_ar": "بطن", "emoji": "🩺", "category": "topic", "color": "emerald", "position": 11},
        {"id": "body-4", "label": "Leg", "label_ar": "رجل", "emoji": "🦵", "category": "topic", "color": "emerald", "position": 12},
        {"id": "body-5", "label": "Toilet", "label_ar": "حمام", "emoji": "🚽", "category": "topic", "color": "emerald", "position": 13},
        {"id": "body-6", "label": "Hurt", "label_ar": "يؤلمني", "emoji": "🤕", "category": "topic", "color": "emerald", "position": 14},
        {"id": "body-7", "label": "Medicine", "label_ar": "دواء", "emoji": "💊", "category": "topic", "color": "emerald", "position": 15},
        {"id": "body-8", "label": "Doctor", "label_ar": "طبيب", "emoji": "👨‍⚕️", "category": "topic", "color": "emerald", "position": 16},
    ],
}


def get_cards(
    topic: str = "school",
    emotion: str = "neutral",
    llm_suggestions: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Return exactly 16 bilingual AAC cards for a session.
    Priority: core (8) + emotion (4) + topic/LLM (4).
    """
    cards: List[Dict[str, Any]] = []

    cards.extend([card.copy() for card in CORE_CARDS])

    emo_key = emotion.lower().strip() if emotion else "neutral"
    emotion_set = EMOTION_CARDS.get(emo_key, EMOTION_CARDS["neutral"])
    cards.extend([card.copy() for card in emotion_set])

    topic_key = topic.lower().strip() if topic else "school"
    topic_set = TOPIC_CARDS.get(topic_key, TOPIC_CARDS["school"])

    if llm_suggestions and len(llm_suggestions) >= 4:
        topic_cards: List[Dict[str, Any]] = []
        for idx, suggestion in enumerate(llm_suggestions[:8]):
            if isinstance(suggestion, dict):
                card = suggestion.copy()
                card["category"] = card.get("category", "topic")
                card["color"] = card.get("color", "emerald")
                card["id"] = card.get("id") or f"llm-{uuid.uuid4().hex[:8]}"
                card["position"] = len(cards) + len(topic_cards) + 1
                topic_cards.append(card)
            else:
                label = str(suggestion).strip()
                if label:
                    card = _normalize_llm_card(label, idx)
                    card["position"] = len(cards) + len(topic_cards) + 1
                    topic_cards.append(card)

        cards.extend(topic_cards)
        while len(cards) < 16:
            fallback_index = max(0, len(cards) - len(CORE_CARDS) - 4)
            fallback_base = topic_set[fallback_index] if fallback_index < len(topic_set) else topic_set[0]
            fallback = fallback_base.copy()
            fallback["id"] = fallback.get("id", f"fallback-{uuid.uuid4().hex[:8]}")
            fallback["position"] = len(cards) + 1
            cards.append(fallback)
    else:
        cards.extend([card.copy() for card in topic_set])

    while len(cards) < 16:
        fallback = topic_set[0].copy()
        fallback["id"] = f"fallback-{uuid.uuid4().hex[:8]}"
        fallback["position"] = len(cards) + 1
        cards.append(fallback)

    return cards[:16]


def suggest_cards_from_insights(
    emotion_distribution: Dict[str, float],
    total_selections: int,
    volatility: float,
    current_topic: str,
) -> List[Dict[str, Any]]:
    """
    Helper used by LLM layer or insights endpoint to propose adaptive cards.
    Returns 8 candidate cards biased toward dominant emotion and topic.
    """
    dominant_emotion = (
        max(emotion_distribution.items(), key=lambda x: x[1])[0]
        if emotion_distribution
        else "neutral"
    )

    base = [card.copy() for card in EMOTION_CARDS.get(dominant_emotion.lower(), EMOTION_CARDS["neutral"])[:2]]
    topic_cards = [card.copy() for card in TOPIC_CARDS.get(current_topic.lower(), TOPIC_CARDS["school"])[:6]]

    suggestions = base + topic_cards
    if volatility > 0.7 and len(suggestions) > 4:
        suggestions = suggestions[:4] + [card.copy() for card in TOPIC_CARDS["feelings"][:4]]

    for i, card in enumerate(suggestions[:8]):
        card["position"] = i + 1
        card["id"] = card.get("id") or f"sugg-{uuid.uuid4().hex[:8]}"

    return suggestions[:8]


def generate_cards(emotion: str, topic: str, llm_cards: list[str] | None) -> list[dict[str, Any]]:
    if llm_cards and len(llm_cards) >= 4:
        llm_suggestions = [
            _normalize_llm_card(str(label), idx) for idx, label in enumerate(llm_cards[:8]) if str(label).strip()
        ]
    else:
        llm_suggestions = None

    return get_cards(topic=topic, emotion=emotion, llm_suggestions=llm_suggestions)


def get_ai_suggestions(
    emotion_dist: dict[str, float],
    help_count: int,
    volatility: float,
) -> list[str]:
    """
    Rule-based suggestions based on emotion percentages and volatility.
    """
    dist = emotion_dist or {}
    normalized = {k: float(v) for k, v in dist.items()}
    if normalized:
        top_emotion, top_pct = max(normalized.items(), key=lambda kv: kv[1])
    else:
        top_emotion, top_pct = "neutral", 0.0

    high_vol = volatility >= 0.35
    suggestions: list[str] = []

    if top_emotion == "sad":
        suggestions.append("Offer comfort cards first, then a preferred activity choice.")
        suggestions.append("Use short, calm phrases and reduce demands during transitions.")
    elif top_emotion == "angry":
        suggestions.append("Provide a 'Stop' and 'Help' choice to reduce frustration immediately.")
        suggestions.append("Use clear step-by-step prompts and offer a brief break card.")
    elif top_emotion == "fear":
        suggestions.append("Use predictable routine cards and show the next step before starting.")
        suggestions.append("Avoid sudden changes; offer a safe-choice card during uncertainty.")
    elif top_emotion == "happy":
        suggestions.append("Follow the child's interest cards and build a turn-taking routine.")
        suggestions.append("Reinforce communication with quick, positive feedback.")
    elif top_emotion == "disgust":
        suggestions.append("Offer choice cards for sensory preferences (what to do next)." )
        suggestions.append("Check that disliked stimuli are reduced and provide a preferred alternative.")
    elif top_emotion == "surprise":
        suggestions.append("Use 'All done' and transition cards to help the child settle.")
        suggestions.append("Offer calming choices after high-arousal moments.")
    else:
        suggestions.append("Use core cards ('I want', 'Help', 'Stop') to support expression of needs.")
        suggestions.append("Maintain consistent prompts and allow the child to choose from 2 options.")

    if high_vol:
        suggestions.append("Due to emotion volatility, run 3-5 minute micro-sessions with frequent resets.")

    if help_count >= 6:
        suggestions.append("Increase visual supports: point, model the card, then fade prompts gradually.")
    elif help_count <= 1:
        suggestions.append("Reduce prompts over time; encourage spontaneous card selection with minimal cues.")

    return suggestions[:5]
