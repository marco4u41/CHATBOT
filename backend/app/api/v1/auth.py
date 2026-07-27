"""Authentication endpoints."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Response, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.api.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.config import settings
from app.domain.models.user import User
from app.infrastructure.database.connection import get_async_session
from app.infrastructure.database.repositories.user_repo import SQLAlchemyUserRepository

import secrets

logger = logging.getLogger(__name__)

router = APIRouter()

_COOKIE_NAME = "autoexpert_session"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _is_production() -> bool:
    return settings.app_env == "production"


def _set_session_cookie(response: Response, token: str) -> None:
    """Set the session cookie with appropriate security flags."""
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        path="/",
        secure=_is_production(),
    )


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name or None,
        created_at=user.created_at.isoformat(),
        is_admin=user.is_admin,
    )


async def _get_user_from_request(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
) -> User | None:
    """Extract and validate user from cookie token."""
    token = request.cookies.get(_COOKIE_NAME)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    repo = SQLAlchemyUserRepository(session)
    return await repo.get_by_id(user_id)


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """Dependency that requires an authenticated user."""
    user = await _get_user_from_request(request, session)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Sesión no válida. Inicia sesión nuevamente.")
    return user


async def get_optional_user(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
) -> User | None:
    """Dependency that returns user if authenticated, None otherwise."""
    return await _get_user_from_request(request, session)


@router.post("/register", response_model=AuthResponse)
async def register(
    request: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_async_session),
):
    """Register a new user account."""
    repo = SQLAlchemyUserRepository(session)

    # Email is already normalized by Pydantic validator
    email = request.email

    # Check password confirmation
    if request.password != request.confirm_password:
        return AuthResponse(success=False, error="Las contraseñas no coinciden")

    # Check if email already exists
    existing = await repo.get_by_email(email)
    if existing:
        return AuthResponse(success=False, error="Ya existe una cuenta con este correo electrónico")

    # Create user
    user_id = secrets.token_hex(16)
    password_hash = hash_password(request.password)
    now = datetime.now(UTC)

    user = User(
        id=user_id,
        email=email,
        password_hash=password_hash,
        display_name=request.display_name or email.split("@")[0],
        is_active=True,
        is_admin=False,
        created_at=now,
        updated_at=now,
    )

    created_user = await repo.create(user)

    # Set session cookie
    token = create_access_token(created_user.id, created_user.email)
    _set_session_cookie(response, token)

    logger.info("User registered: %s", email)
    return AuthResponse(success=True, user=_user_response(created_user))


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_async_session),
):
    """Authenticate an existing user."""
    repo = SQLAlchemyUserRepository(session)

    # Email is already normalized by Pydantic validator
    email = request.email
    user = await repo.get_by_email(email)

    if not user or not verify_password(request.password, user.password_hash):
        return AuthResponse(success=False, error="Correo electrónico o contraseña incorrectos")

    if not user.is_active:
        return AuthResponse(success=False, error="Tu cuenta está desactivada. Contacta al administrador.")

    # Set session cookie
    token = create_access_token(user.id, user.email)
    _set_session_cookie(response, token)

    logger.info("User logged in: %s", email)
    return AuthResponse(success=True, user=_user_response(user))


@router.post("/logout")
async def logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(
        key=_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=_is_production(),
    )
    return {"success": True}


@router.get("/me", response_model=AuthResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return AuthResponse(success=True, user=_user_response(user))
