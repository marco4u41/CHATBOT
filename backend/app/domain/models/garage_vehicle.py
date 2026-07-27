"""Domain model for user garage vehicles."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class GarageVehicle:
    """A vehicle saved to a user's garage."""

    id: str
    user_id: str
    brand: str
    model: str
    year: int
    added_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    engine: str = ""
    transmission: str = ""
    fuel_type: str = ""
    mileage_km: int | None = None
    price_usd: float | None = None
    body_type: str = ""
    drive: str = ""
    condition: str = ""
    color: str = ""
    cylinders: int | None = None
    passengers: int | None = None
    consumption: str = ""
    notes: str = ""
