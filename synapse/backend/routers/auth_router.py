from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_access_token, hash_password, get_current_user, verify_password
from database import get_db
from models import User
from schemas import LoginResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> dict:
    print(f"[REGISTER] Incoming user_in.role: {user_in.role!r}")
    existing = await db.execute(select(User).where(User.username == user_in.username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user = User(
        id=str(uuid.uuid4()),
        username=user_in.username,
        email=str(user_in.email) if user_in.email else None,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True,
    )
    print(f"[REGISTER] User object created with role: {user.role!r}")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    print(f"[REGISTER] User after DB commit/refresh, role: {user.role!r}")
    
    # Auto-login: return token after registration
    access_token = create_access_token({"sub": user.username})
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "role": user.role,
        "full_name": user.full_name,
    }
    print(f"[REGISTER] Response role: {response['role']!r}")
    return response


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    print(f"[LOGIN] User {form_data.username!r}, found: {user is not None}")
    if user:
        print(f"[LOGIN] User role from DB: {user.role!r} (type: {type(user.role).__name__})")
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token({"sub": user.username})
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "role": user.role,
        "full_name": user.full_name,
    }
    print(f"[LOGIN] Response role: {response['role']!r}")
    return response


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    validated = UserRead.model_validate(current_user)
    print(f"[ME] Current user: {current_user.username!r}")
    print(f"[ME] Current user role from DB: {current_user.role!r} (type: {type(current_user.role).__name__})")
    print(f"[ME] UserRead validated role: {validated.role!r} (type: {type(validated.role).__name__})")
    return validated

