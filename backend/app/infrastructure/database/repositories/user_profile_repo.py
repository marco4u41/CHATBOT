import json
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.interfaces.repository import UserProfileRepository
from app.domain.models.user_profile import UserProfile
from app.infrastructure.database.models import UserProfileModel


def _profile_to_domain(model: UserProfileModel) -> UserProfile:
    preferences: list[str] = []
    brands: list[str] = []
    preferred: list[str] = []
    if model.preferences:
        try:
            preferences = json.loads(model.preferences)
        except (json.JSONDecodeError, TypeError):
            pass
    if model.mentioned_brands:
        try:
            brands = json.loads(model.mentioned_brands)
        except (json.JSONDecodeError, TypeError):
            pass
    if model.preferred_brands:
        try:
            preferred = json.loads(model.preferred_brands)
        except (json.JSONDecodeError, TypeError):
            pass
    return UserProfile(
        id=model.id,
        primary_vehicle_brand=model.primary_vehicle_brand,
        primary_vehicle_model=model.primary_vehicle_model,
        primary_vehicle_year=model.primary_vehicle_year,
        primary_vehicle_engine=model.primary_vehicle_engine,
        budget_usd=model.budget_usd,
        terrain=model.terrain,
        engine_type=model.engine_type,
        usage=model.usage,
        fuel_preference=model.fuel_preference,
        family_size=model.family_size,
        preferences=preferences,
        mentioned_brands=brands,
        preferred_brands=preferred,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SQLAlchemyUserProfileRepository(UserProfileRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, profile_id: str) -> UserProfile | None:
        stmt = select(UserProfileModel).where(UserProfileModel.id == profile_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return None
        return _profile_to_domain(model)

    async def get_or_create(self, profile_id: str) -> UserProfile:
        existing = await self.get_by_id(profile_id)
        if existing:
            return existing
        model = UserProfileModel(id=profile_id)
        self._session.add(model)
        await self._session.flush()
        return _profile_to_domain(model)

    async def update(self, profile: UserProfile) -> UserProfile:
        stmt = select(UserProfileModel).where(UserProfileModel.id == profile.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            model = UserProfileModel(id=profile.id)
            self._session.add(model)

        model.primary_vehicle_brand = profile.primary_vehicle_brand
        model.primary_vehicle_model = profile.primary_vehicle_model
        model.primary_vehicle_year = profile.primary_vehicle_year
        model.primary_vehicle_engine = profile.primary_vehicle_engine
        model.budget_usd = profile.budget_usd
        model.terrain = profile.terrain
        model.engine_type = profile.engine_type
        model.usage = profile.usage
        model.fuel_preference = profile.fuel_preference
        model.family_size = profile.family_size
        model.preferences = (
            json.dumps(profile.preferences) if profile.preferences else None
        )
        model.mentioned_brands = (
            json.dumps(profile.mentioned_brands)
            if profile.mentioned_brands
            else None
        )
        model.preferred_brands = (
            json.dumps(profile.preferred_brands)
            if profile.preferred_brands
            else None
        )
        model.updated_at = datetime.now(UTC)

        await self._session.flush()
        return _profile_to_domain(model)
