"""User authentication model."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class User:
    """Domain model for an authenticated user."""

    email: str
    password_hash: str
    id: str = ""
    display_name: str = ""
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
