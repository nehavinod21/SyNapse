from __future__ import annotations

import os
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# models.py defines Base; keep import here so init_db() can create tables.
from models import Base  # noqa: E402

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./synapse.db",
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _apply_sqlite_schema_updates(conn)


async def _apply_sqlite_schema_updates(conn) -> None:
    """Add new columns/tables when models change (SQLite has no auto-migrate)."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    from sqlalchemy import inspect, text

    def _migrate(sync_conn) -> None:
        inspector = inspect(sync_conn)
        if "children" in inspector.get_table_names():
            existing = {c["name"] for c in inspector.get_columns("children")}
            for col, col_type in (
                ("preferred_communication_style", "VARCHAR(128)"),
                ("reinforcement_preferences", "TEXT"),
                ("break_frequency_minutes", "INTEGER"),
                ("home_school_notes", "TEXT"),
                ("emergency_deescalation_guidance", "TEXT"),
                ("communication_matrix_level", "VARCHAR(64)"),
            ):
                if col not in existing:
                    sync_conn.execute(text(f"ALTER TABLE children ADD COLUMN {col} {col_type}"))

    await conn.run_sync(_migrate)
