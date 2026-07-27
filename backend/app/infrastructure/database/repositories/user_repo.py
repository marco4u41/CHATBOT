"""SQLAlchemy implementation of UserRepository."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.interfaces.repository import UserRepository
from app.domain.models.user import User
from app.infrastructure.database.models import UserModel


def _user_to_domain(model: UserModel) -> User:
    return User(
        id=model.id,
        email=model.email,
        password_hash=model.password_hash,
        display_name=model.display_name or "",
        is_active=model.is_active,
        is_admin=model.is_admin,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user: User) -> User:
        model = UserModel(
            id=user.id,
            email=user.email,
            password_hash=user.password_hash,
            display_name=user.display_name or None,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        self._session.add(model)
        await self._session.flush()
        return _user_to_domain(model)

    async def get_by_id(self, user_id: str) -> User | None:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _user_to_domain(model) if model else None

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(UserModel).where(UserModel.email == email.lower().strip())
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _user_to_domain(model) if model else None

    async def update(self, user: User) -> User:
        stmt = select(UserModel).where(UserModel.id == user.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"User {user.id} not found")
        model.email = user.email
        model.display_name = user.display_name or None
        model.is_active = user.is_active
        model.is_admin = user.is_admin
        model.updated_at = user.updated_at
        await self._session.flush()
        return _user_to_domain(model)

    async def delete(self, user_id: str) -> bool:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return False
        await self._session.delete(model)
        await self._session.flush()
        return True
