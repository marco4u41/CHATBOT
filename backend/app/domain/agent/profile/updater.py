from app.domain.models.user_profile import UserProfile


class ProfileUpdater:
    """Merges newly extracted user data into an existing profile.

    Existing (persistent) data wins for all fields.
    Extracted data only fills gaps — values that are None or empty
    in the current profile. Lists (preferences, mentioned_brands)
    are merged additively (deduplicated).
    """

    def merge(
        self,
        current: UserProfile,
        extracted: UserProfile,
    ) -> UserProfile:
        return UserProfile(
            id=current.id,
            primary_vehicle_brand=(
                current.primary_vehicle_brand
                or extracted.primary_vehicle_brand
            ),
            primary_vehicle_model=(
                current.primary_vehicle_model
                or extracted.primary_vehicle_model
            ),
            primary_vehicle_year=(
                current.primary_vehicle_year
                or extracted.primary_vehicle_year
            ),
            primary_vehicle_engine=(
                current.primary_vehicle_engine
                or extracted.primary_vehicle_engine
            ),
            budget_usd=(
                current.budget_usd
                if current.budget_usd is not None
                else extracted.budget_usd
            ),
            terrain=(
                current.terrain or extracted.terrain
            ),
            engine_type=(
                current.engine_type or extracted.engine_type
            ),
            usage=(
                current.usage or extracted.usage
            ),
            fuel_preference=(
                current.fuel_preference or extracted.fuel_preference
            ),
            family_size=(
                current.family_size
                if current.family_size is not None
                else extracted.family_size
            ),
            preferences=(
                self._merge_lists(current.preferences, extracted.preferences)
            ),
            mentioned_brands=(
                self._merge_lists(
                    current.mentioned_brands, extracted.mentioned_brands
                )
            ),
            preferred_brands=(
                self._merge_lists(
                    current.preferred_brands, extracted.preferred_brands
                )
            ),
            created_at=current.created_at,
        )

    @staticmethod
    def _merge_lists(
        existing: list[str],
        new: list[str],
    ) -> list[str]:
        seen = set(existing)
        result = list(existing)
        for item in new:
            if item not in seen:
                result.append(item)
                seen.add(item)
        return result
