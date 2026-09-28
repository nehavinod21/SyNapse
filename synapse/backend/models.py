from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    teacher_children: Mapped[list["Child"]] = relationship(
        "Child",
        foreign_keys="Child.teacher_id",
        back_populates="teacher",
        lazy="selectin",
    )
    caregiver_children: Mapped[list["Child"]] = relationship(
        "Child",
        foreign_keys="Child.caregiver_id",
        back_populates="caregiver",
        lazy="selectin",
    )
    sessions_started: Mapped[list["Session"]] = relationship(
        "Session",
        foreign_keys="Session.started_by",
        back_populates="started_by_user",
        lazy="selectin",
    )
    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment",
        foreign_keys="Assessment.send_officer_id",
        back_populates="send_officer",
        lazy="selectin",
    )


class Child(Base):
    __tablename__ = "children"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    age: Mapped[int] = mapped_column(Integer)
    diagnosis: Mapped[str] = mapped_column(String(255))
    communication_level: Mapped[str] = mapped_column(String(64))

    # JSON-encoded lists (stored as text per spec).
    interests: Mapped[str] = mapped_column(Text)  # JSON list string
    preferred_topics: Mapped[str] = mapped_column(Text)  # JSON list string

    teacher_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    caregiver_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    preferred_communication_style: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    reinforcement_preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    break_frequency_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    home_school_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_deescalation_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    communication_matrix_level: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    teacher: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[teacher_id],
        back_populates="teacher_children",
        lazy="selectin",
    )
    caregiver: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[caregiver_id],
        back_populates="caregiver_children",
        lazy="selectin",
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session",
        foreign_keys="Session.child_id",
        back_populates="child",
        lazy="selectin",
    )
    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment",
        foreign_keys="Assessment.child_id",
        back_populates="child",
        lazy="selectin",
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("children.id", ondelete="CASCADE"),
    )
    started_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
    )

    session_type: Mapped[str] = mapped_column(String(64))
    topic: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # SEND assessment phase (1-6).
    phase: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    child: Mapped["Child"] = relationship("Child", back_populates="sessions", lazy="selectin")
    started_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="sessions_started",
        foreign_keys=[started_by],
        lazy="selectin",
    )
    emotion_logs: Mapped[list["EmotionLog"]] = relationship(
        "EmotionLog",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    card_selections: Mapped[list["CardSelection"]] = relationship(
        "CardSelection",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
    )

    emotion_label: Mapped[str] = mapped_column(String(32))
    confidence: Mapped[float] = mapped_column(Float)
    intensity: Mapped[int] = mapped_column(Integer)

    # NOTE: Must never store image paths or raw images.
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    session: Mapped["Session"] = relationship("Session", back_populates="emotion_logs", lazy="selectin")


class CardSelection(Base):
    __tablename__ = "card_selections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
    )

    card_id: Mapped[str] = mapped_column(String(64))
    card_label: Mapped[str] = mapped_column(String(255))
    card_label_ar: Mapped[str] = mapped_column(String(255))
    card_category: Mapped[str] = mapped_column(String(64))
    emotion_at_selection: Mapped[str] = mapped_column(String(32))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    session: Mapped["Session"] = relationship("Session", back_populates="card_selections", lazy="selectin")


class EmotionAlert(Base):
    __tablename__ = "emotion_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("children.id", ondelete="CASCADE"),
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
    )
    emotion_label: Mapped[str] = mapped_column(String(32))
    confidence: Mapped[float] = mapped_column(Float)
    intensity: Mapped[int] = mapped_column(Integer)
    recipient_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    recipient_role: Mapped[str] = mapped_column(String(32))
    environment: Mapped[str] = mapped_column(String(16))
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("children.id", ondelete="CASCADE"),
    )
    send_officer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
    )

    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(64))

    # JSON dict / array stored as strings per spec.
    phase_notes: Mapped[str] = mapped_column(Text)  # JSON dict string: {"1":"...","2":"..."}
    accommodations_tried: Mapped[str] = mapped_column(Text)  # JSON array string

    report_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    child: Mapped["Child"] = relationship("Child", back_populates="assessments", lazy="selectin")
    send_officer: Mapped["User"] = relationship(
        "User",
        back_populates="assessments",
        foreign_keys=[send_officer_id],
        lazy="selectin",
    )


class RoutineTemplate(Base):
    __tablename__ = "routine_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    name_ar: Mapped[str] = mapped_column(String(255))
    context: Mapped[str] = mapped_column(String(32))  # school | home
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")
    steps: Mapped[list["RoutineStep"]] = relationship(
        "RoutineStep",
        back_populates="template",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("routine_templates.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer, default=1)
    label: Mapped[str] = mapped_column(String(255))
    label_ar: Mapped[str] = mapped_column(String(255))
    emoji: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    template: Mapped["RoutineTemplate"] = relationship("RoutineTemplate", back_populates="steps", lazy="selectin")


class SensoryProfile(Base):
    __tablename__ = "sensory_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"), unique=True)
    sound_level: Mapped[str] = mapped_column(String(32), default="moderate")
    light_level: Mapped[str] = mapped_column(String(32), default="moderate")
    texture_preferences: Mapped[str] = mapped_column(Text, default="[]")
    movement_needs: Mapped[str] = mapped_column(String(128), default="typical")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class CalmCornerSession(Base):
    __tablename__ = "calm_corner_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    strategy_used: Mapped[str] = mapped_column(String(128))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class BreakActivity(Base):
    __tablename__ = "break_activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    label: Mapped[str] = mapped_column(String(255))
    label_ar: Mapped[str] = mapped_column(String(255))
    activity_type: Mapped[str] = mapped_column(String(64))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=5)
    emoji: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class BreakLog(Base):
    __tablename__ = "break_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    activity_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("break_activities.id", ondelete="SET NULL"), nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(64), default="teacher")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")
    activity: Mapped[Optional["BreakActivity"]] = relationship("BreakActivity", lazy="selectin")


class RewardGoal(Base):
    __tablename__ = "reward_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    title_ar: Mapped[str] = mapped_column(String(255))
    target_count: Mapped[int] = mapped_column(Integer, default=10)
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class RewardEvent(Base):
    __tablename__ = "reward_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    goal_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("reward_goals.id", ondelete="SET NULL"), nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=1)
    reason: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")
    goal: Mapped[Optional["RewardGoal"]] = relationship("RewardGoal", lazy="selectin")


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    badge_key: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(255))
    title_ar: Mapped[str] = mapped_column(String(255))
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class VideoModel(Base):
    __tablename__ = "video_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    title_ar: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(String(512))
    category: Mapped[str] = mapped_column(String(64), default="general")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    child: Mapped[Optional["Child"]] = relationship("Child", lazy="selectin")


class SelfReport(Base):
    __tablename__ = "self_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    emotion_label: Mapped[str] = mapped_column(String(32))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class DisplayPreference(Base):
    __tablename__ = "display_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"), unique=True)
    simplified_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    max_aac_cards: Mapped[int] = mapped_column(Integer, default=16)
    max_routine_steps_visible: Mapped[int] = mapped_column(Integer, default=8)
    font_size_scale: Mapped[float] = mapped_column(Float, default=1.0)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")


class SharedNote(Base):
    __tablename__ = "shared_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    author_role: Mapped[str] = mapped_column(String(32))
    content_en: Mapped[str] = mapped_column(Text)
    content_ar: Mapped[str] = mapped_column(Text)
    visibility: Mapped[str] = mapped_column(String(32), default="team")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")
    author: Mapped["User"] = relationship("User", lazy="selectin")


class PreEventPlan(Base):
    __tablename__ = "pre_event_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(36), ForeignKey("children.id", ondelete="CASCADE"))
    event_name: Mapped[str] = mapped_column(String(255))
    event_name_ar: Mapped[str] = mapped_column(String(255))
    plan_en: Mapped[str] = mapped_column(Text)
    plan_ar: Mapped[str] = mapped_column(Text)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    child: Mapped["Child"] = relationship("Child", lazy="selectin")

