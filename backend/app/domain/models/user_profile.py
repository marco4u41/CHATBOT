from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class UserProfile:
    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    primary_vehicle_brand: str | None = None
    primary_vehicle_model: str | None = None
    primary_vehicle_year: int | None = None
    primary_vehicle_engine: str | None = None
    budget_usd: float | None = None
    terrain: str | None = None
    engine_type: str | None = None
    usage: str | None = None
    fuel_preference: str | None = None
    family_size: int | None = None
    preferences: list[str] = field(default_factory=list)
    mentioned_brands: list[str] = field(default_factory=list)
    preferred_brands: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def is_empty(self) -> bool:
        return (
            self.primary_vehicle_brand is None
            and self.budget_usd is None
            and self.terrain is None
            and self.engine_type is None
            and self.usage is None
            and self.fuel_preference is None
            and self.family_size is None
            and not self.preferences
            and not self.mentioned_brands
            and not self.preferred_brands
        )

    def has_vehicle(self) -> bool:
        return self.primary_vehicle_brand is not None
