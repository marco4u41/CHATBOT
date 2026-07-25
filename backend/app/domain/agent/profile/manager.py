import logging

from app.domain.agent.profile.updater import ProfileUpdater
from app.domain.interfaces.repository import UserProfileRepository
from app.domain.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

_DEFAULT_PROFILE_ID = "default"


class UserProfileManager:
    """Manages persistent user profile storage and retrieval.
    Loads profile from DB, delegates updates to ProfileUpdater."""

    def __init__(
        self,
        repo: UserProfileRepository,
        updater: ProfileUpdater | None = None,
    ) -> None:
        self._repo = repo
        self._updater = updater or ProfileUpdater()

    async def get_profile(self, profile_id: str | None = None) -> UserProfile:
        pid = profile_id or _DEFAULT_PROFILE_ID
        return await self._repo.get_or_create(pid)

    async def update_profile(
        self,
        extracted: UserProfile,
        profile_id: str | None = None,
    ) -> UserProfile:
        pid = profile_id or _DEFAULT_PROFILE_ID
        current = await self._repo.get_or_create(pid)
        merged = self._updater.merge(current, extracted)
        if self._has_changes(current, merged):
            updated = await self._repo.update(merged)
            logger.info(
                "Profile %s updated: vehicle=%s, budget=%s, usage=%s",
                pid,
                updated.primary_vehicle_brand,
                updated.budget_usd,
                updated.usage,
            )
            return updated
        return current

    @staticmethod
    def _has_changes(current: UserProfile, updated: UserProfile) -> bool:
        return (
            current.primary_vehicle_brand != updated.primary_vehicle_brand
            or current.primary_vehicle_model != updated.primary_vehicle_model
            or current.primary_vehicle_year != updated.primary_vehicle_year
            or current.primary_vehicle_engine != updated.primary_vehicle_engine
            or current.budget_usd != updated.budget_usd
            or current.terrain != updated.terrain
            or current.engine_type != updated.engine_type
            or current.usage != updated.usage
            or current.fuel_preference != updated.fuel_preference
            or current.family_size != updated.family_size
            or current.preferences != updated.preferences
            or current.mentioned_brands != updated.mentioned_brands
            or current.preferred_brands != updated.preferred_brands
        )
