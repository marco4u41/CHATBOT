"""Password hashing and JWT token utilities."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from typing import Any

import bcrypt
import jwt

from app.config import settings

# ---------------------------------------------------------------------------
# Password hashing (bcrypt)
# ---------------------------------------------------------------------------

_HASH_ROUNDS = 12


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=_HASH_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8"),
        )
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT access token."""
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + _TOKEN_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token. Returns None if invalid."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ---------------------------------------------------------------------------
# CSRF / session helpers
# ---------------------------------------------------------------------------

def generate_session_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_hex(32)
