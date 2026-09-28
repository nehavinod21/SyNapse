from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Child, Session, User
from schemas import ChildCreate, ChildRead, ChildUpdate, Role

router = APIRouter(prefix="/api/children", tags=["children"])


def _load_json_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except Exception:
            return []
    return []


def _dump_json_list(items: list[str]) -> str:
    return json.dumps(items, ensure_ascii=False)


def _current_user_can_access_child(current_user: User, child: Child) -> bool:
    if current_user.role == "send_officer":
        return True
    if current_user.role == "teacher" and child.teacher_id == current_user.id:
        return True
    if current_user.role == "caregiver" and child.caregiver_id == current_user.id:
        return True
    if current_user.role == "student" and child.id == current_user.id:
        return True
    return False


@router.post("/", response_model=ChildRead)
async def create_child(
    child_in: ChildCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChildRead:
    if current_user.role == "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students cannot create child profiles")

    teacher_id = child_in.teacher_id
    caregiver_id = child_in.caregiver_id

    if current_user.role == "teacher" and not teacher_id:
        teacher_id = current_user.id
    if current_user.role == "caregiver" and not caregiver_id:
        caregiver_id = current_user.id

    child = Child(
        id=str(uuid.uuid4()),
        name=child_in.name,
        age=child_in.age,
        diagnosis=child_in.diagnosis,
        communication_level=child_in.communication_level,
        interests=_dump_json_list(child_in.interests),
        preferred_topics=_dump_json_list(child_in.preferred_topics),
        teacher_id=teacher_id,
        caregiver_id=caregiver_id,
    )

    db.add(child)
    await db.commit()
    await db.refresh(child)

    return ChildRead(
        id=child.id,
        name=child.name,
        age=child.age,
        diagnosis=child.diagnosis,
        communication_level=child.communication_level,
        interests=_load_json_list(child.interests),
        preferred_topics=_load_json_list(child.preferred_topics),
        teacher_id=child.teacher_id,
        caregiver_id=child.caregiver_id,
        created_at=child.created_at,
        session_count=None,
        last_session_at=None,
    )


@router.get("/", response_model=list[ChildRead])
async def list_children(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChildRead]:
    stmt = select(Child)

    if current_user.role == "teacher":
        stmt = stmt.where(Child.teacher_id == current_user.id)
    elif current_user.role == "caregiver":
        stmt = stmt.where(Child.caregiver_id == current_user.id)
    elif current_user.role == "student":
        stmt = stmt.where(Child.id == current_user.id)
    # send_officer sees all

    result = await db.execute(stmt.order_by(Child.created_at.desc()))
    children = result.scalars().all()

    # Enrich with session stats
    if not children:
        return []

    child_ids = [c.id for c in children]

    session_counts_stmt = (
        select(Session.child_id, func.count(Session.id))
        .where(Session.child_id.in_(child_ids))
        .group_by(Session.child_id)
    )
    counts_result = await db.execute(session_counts_stmt)
    counts_map = {row[0]: int(row[1]) for row in counts_result.all()}

    last_session_stmt = (
        select(Session.child_id, func.max(Session.started_at))
        .where(Session.child_id.in_(child_ids))
        .group_by(Session.child_id)
    )
    last_result = await db.execute(last_session_stmt)
    last_map = {row[0]: row[1] for row in last_result.all()}

    out: list[ChildRead] = []
    for child in children:
        out.append(
            ChildRead(
                id=child.id,
                name=child.name,
                age=child.age,
                diagnosis=child.diagnosis,
                communication_level=child.communication_level,
                interests=_load_json_list(child.interests),
                preferred_topics=_load_json_list(child.preferred_topics),
                teacher_id=child.teacher_id,
                caregiver_id=child.caregiver_id,
                created_at=child.created_at,
                session_count=counts_map.get(child.id),
                last_session_at=last_map.get(child.id),
            )
        )
    return out


@router.get("/{id}", response_model=ChildRead)
async def get_child(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChildRead:
    result = await db.execute(select(Child).where(Child.id == id))
    child = result.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    if not _current_user_can_access_child(current_user, child):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    session_count_stmt = select(func.count(Session.id)).where(Session.child_id == id)
    last_stmt = select(func.max(Session.started_at)).where(Session.child_id == id)
    counts_res = await db.execute(session_count_stmt)
    last_res = await db.execute(last_stmt)

    session_count = counts_res.scalar_one() or 0
    last_session_at = last_res.scalar_one_or_none()

    return ChildRead(
        id=child.id,
        name=child.name,
        age=child.age,
        diagnosis=child.diagnosis,
        communication_level=child.communication_level,
        interests=_load_json_list(child.interests),
        preferred_topics=_load_json_list(child.preferred_topics),
        teacher_id=child.teacher_id,
        caregiver_id=child.caregiver_id,
        created_at=child.created_at,
        session_count=int(session_count),
        last_session_at=last_session_at,
    )


@router.put("/{id}", response_model=ChildRead)
async def update_child(
    id: str,
    child_in: ChildUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChildRead:
    result = await db.execute(select(Child).where(Child.id == id))
    child = result.scalar_one_or_none()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if not _current_user_can_access_child(current_user, child):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this child")

    data = child_in.model_dump(exclude_unset=True)

    if current_user.role == "teacher":
        data.pop("teacher_id", None)
        data["teacher_id"] = current_user.id
    if current_user.role == "caregiver":
        data.pop("caregiver_id", None)
        data["caregiver_id"] = current_user.id

    if "interests" in data and isinstance(data["interests"], list):
        data["interests"] = _dump_json_list(data["interests"])
    if "preferred_topics" in data and isinstance(data["preferred_topics"], list):
        data["preferred_topics"] = _dump_json_list(data["preferred_topics"])

    for k, v in data.items():
        if hasattr(child, k):
            setattr(child, k, v)

    await db.commit()
    await db.refresh(child)

    return ChildRead(
        id=child.id,
        name=child.name,
        age=child.age,
        diagnosis=child.diagnosis,
        communication_level=child.communication_level,
        interests=_load_json_list(child.interests),
        preferred_topics=_load_json_list(child.preferred_topics),
        teacher_id=child.teacher_id,
        caregiver_id=child.caregiver_id,
        created_at=child.created_at,
        session_count=None,
        last_session_at=None,
    )

