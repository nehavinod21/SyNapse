from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


Role = Literal["student", "teacher", "send_officer", "caregiver"]

EmotionLabel = Literal["happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: str
    role: str
    full_name: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    email: Optional[str] = None
    password: str = Field(min_length=6, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    role: Role


class UserRead(ORMBaseModel):
    id: str
    username: str
    email: Optional[str]
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime


class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    age: int = Field(ge=0, le=120)
    diagnosis: str
    communication_level: str
    interests: list[str] = Field(default_factory=list)
    preferred_topics: list[str] = Field(default_factory=list)
    teacher_id: Optional[str] = None
    caregiver_id: Optional[str] = None


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    diagnosis: Optional[str] = None
    communication_level: Optional[str] = None
    interests: Optional[list[str]] = None
    preferred_topics: Optional[list[str]] = None
    teacher_id: Optional[str] = None
    caregiver_id: Optional[str] = None


class ChildRead(ORMBaseModel):
    id: str
    name: str
    age: int
    diagnosis: str
    communication_level: str
    interests: list[str]
    preferred_topics: list[str]
    teacher_id: Optional[str] = None
    caregiver_id: Optional[str] = None
    created_at: datetime

    # Optional enriched fields (computed by routers).
    session_count: Optional[int] = None
    last_session_at: Optional[datetime] = None


class SessionCreate(BaseModel):
    child_id: str
    session_type: Literal["classroom", "home", "assessment"]
    topic: str


class EmotionLogRead(ORMBaseModel):
    id: str
    emotion_label: EmotionLabel | str
    confidence: float
    intensity: int
    timestamp: datetime


class CardSelectionRead(ORMBaseModel):
    id: str
    session_id: str
    card_id: str
    card_label: str
    card_label_ar: str
    card_category: str
    emotion_at_selection: str
    timestamp: datetime


class SessionRead(ORMBaseModel):
    id: str
    child_id: str
    started_by: str
    session_type: str
    topic: str
    is_active: bool
    started_at: datetime
    ended_at: Optional[datetime] = None
    phase: int

    # Full session includes logs/selections for richer UI.
    emotion_logs: list[EmotionLogRead] = Field(default_factory=list)
    card_selections: list[CardSelectionRead] = Field(default_factory=list)


class SessionInsight(BaseModel):
    emotion_distribution: dict[str, float]
    dominant_emotion: str
    emotion_volatility: float
    top_cards: list[dict[str, Any]]  # {label, count}
    help_count: int
    ai_suggestions: list[str]
    session_duration_minutes: float
    total_card_selections: int


class EmotionDetectResponse(BaseModel):
    emotion: str
    confidence: float
    intensity: int
    all_scores: dict[str, float]


class SupportChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=600)


class SupportChatResponse(BaseModel):
    answer: str
    source: Literal["faq", "llm"]


class SessionHistoryRecord(BaseModel):
    id: str
    topic: str
    session_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: float
    dominant_emotion: str
    total_emotions_logged: int
    total_card_selections: int
    is_active: bool


class SessionHistoryResponse(BaseModel):
    child_id: str
    child_name: str
    total_sessions: int
    sessions: list[SessionHistoryRecord]


class SessionReportResponse(BaseModel):
    session_id: str
    child_name: str
    generated_at: datetime
    english: str
    arabic: str

class Card(BaseModel):
    id: str
    label: str
    label_ar: str
    emoji: str
    category: Literal["core", "emotion", "topic"]
    color: str
    position: int


class CardGenerateRequest(BaseModel):
    session_id: str
    emotion: str
    child_id: str
    topic: str


class CardSelectRequest(BaseModel):
    session_id: str
    card_id: str
    card_label: str
    card_label_ar: str
    card_category: str
    emotion_at_selection: str


class AssessmentCreate(BaseModel):
    child_id: str
    scheduled_date: Optional[datetime] = None


class AssessmentPhaseUpdate(BaseModel):
    phase: int = Field(ge=1, le=6)
    notes: str
    accommodations: list[str] = Field(default_factory=list)


class AssessmentRead(ORMBaseModel):
    id: str
    child_id: str
    send_officer_id: str
    scheduled_date: datetime
    status: str

    phase_notes: dict[str, str] = Field(default_factory=dict)
    accommodations_tried: list[str] = Field(default_factory=list)

    report_path: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class AssessmentCompleteResponse(BaseModel):
    status: str
    report_url: Optional[str] = None
    report_path: Optional[str] = None
    created_at: Optional[datetime] = None


# ============================================================================
# TEACHER PORTAL SCHEMAS
# ============================================================================

class TeacherStudentCard(BaseModel):
    """Mini card for teacher dashboard student list."""
    id: str
    name: str
    age: int
    status: str  # "ready", "needs_support", "needs_immediate_support"
    status_label: str
    last_session_at: Optional[datetime] = None
    last_session_turns: Optional[int] = None
    baseline_mean: float
    baseline_std: float
    signal_score: float
    recommendation: Optional[str] = None
    active_session_id: Optional[str] = None


class TeacherDashboardSummary(BaseModel):
    """Dashboard summary for teacher."""
    classroom_name: str
    session_active: bool
    current_time: str
    average_engagement: float
    sessions_this_week: int
    students_making_progress: int
    students_total: int
    students: list[TeacherStudentCard]
    # Charts for dashboard (last 7 days, teacher's children only).
    engagement_this_week: list[EngagementTrendPoint] = Field(default_factory=list)
    emotion_mix_class: list[EmotionDistributionPoint] = Field(default_factory=list)
    reports_this_week: int = 0


class SendCaseloadChildRow(BaseModel):
    child_id: str
    name: str
    age: int
    school_class: str
    last_assessment_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    status: str  # on_track | monitor | needs_attention
    latest_assessment_id: Optional[str] = None
    latest_assessment_status: Optional[str] = None
    latest_assessment_completed: bool = False


class SendRecentInteraction(BaseModel):
    id: str
    child_id: str
    child_name: str
    interaction_type: str  # card_selection | emotion_detected | session_start
    summary_en: str
    summary_ar: str
    emotion: Optional[str] = None
    session_type: Optional[str] = None
    timestamp: datetime


class SendDashboardSummary(BaseModel):
    officer_name: str
    children_on_caseload: int
    upcoming_reviews_week: int
    overdue_reviews: int
    status_counts: dict[str, int]
    children: list[SendCaseloadChildRow]
    recent_interactions: list[SendRecentInteraction] = Field(default_factory=list)


class KhdaSendReportGenerateRequest(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD


class EngagementTrendPoint(BaseModel):
    day: str
    value: float


class EmotionDistributionPoint(BaseModel):
    emotion: str
    percentage: float


class TopCardUsage(BaseModel):
    label: str
    count: int


class AchievementBadge(BaseModel):
    title: str
    description: str


class TeacherStudentProfileResponse(BaseModel):
    """Complete profile for a student."""
    id: str
    name: str
    student_identifier: str
    age: int
    grade: str
    communication_level: str
    status: str
    signal_score: float
    last_session_label: str
    turns: int
    baseline_mean: float
    baseline_std: float
    engagement_avg: float
    total_sessions: int
    engagement_trend: list[EngagementTrendPoint]
    emotion_distribution: list[EmotionDistributionPoint]
    most_used_cards: list[TopCardUsage]
    achievements: list[AchievementBadge]


class TranscriptEntry(BaseModel):
    timestamp: datetime
    speaker: str  # "system", "teacher", "student"
    message: str


class GuidanceSuggestion(BaseModel):
    id: str
    type: str  # "ask_elaboration", "show_empathy", "expand_topic"
    text: str
    example: str


class TeacherLiveSessionResponse(BaseModel):
    """Live session state for teacher monitoring."""
    session_id: str
    child_name: str
    phase: str
    timer_seconds: int
    signal_intensity: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    turn_index: int
    turn_target: int
    duration_seconds: int
    engagement_score: float
    transcript: list[TranscriptEntry]
    guidance_suggestions: list[GuidanceSuggestion]
    is_active: bool = True
    latest_emotion: Optional[str] = None
    latest_confidence: float = 0.0
    recent_cards: list[str] = Field(default_factory=list)
    topic: str = ""
    session_type: str = "classroom"


class TeacherActionResponse(BaseModel):
    """Response to teacher actions (pause, next-turn, end)."""
    status: str
    message: str
    session_id: str


class TeacherMessageRequest(BaseModel):
    """Request for teacher to send a message."""
    message: str


class EmotionAlertRead(ORMBaseModel):
    id: str
    child_id: str
    session_id: str
    emotion_label: str
    confidence: float
    intensity: int
    recipient_user_id: str
    recipient_role: str
    environment: str
    acknowledged: bool
    created_at: datetime
    child_name: Optional[str] = None

