from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class VehicleSummary:
    vehicle_id: int
    vehicle_name: str
    manufacturer: str
    model: str
    year: int
    listing_count: int | None = None
    price_mean: float | None = None
    price_median: float | None = None
    price_min: float | None = None
    price_max: float | None = None
    odometer_mean: float | None = None
    odometer_median: float | None = None
    fuel: str | None = None
    transmission: str | None = None
    condition: str | None = None
    cylinders: str | None = None
    drive: str | None = None
    vehicle_type: str | None = None
    size: str | None = None
    paint_color: str | None = None
    states_count: int | None = None
    first_posting_date: datetime | None = None
    last_posting_date: datetime | None = None
    price_range: str | None = None
    market_confidence: str | None = None


@dataclass(frozen=True)
class VehicleMarketSummary:
    id: int
    manufacturer: str
    model: str
    years_available: int | None = None
    oldest_year: int | None = None
    newest_year: int | None = None
    total_listings: int | None = None
    overall_price_mean: float | None = None
    overall_price_median: float | None = None
    overall_odometer_mean: float | None = None
    fuel: str | None = None
    transmission: str | None = None
    drive: str | None = None
    vehicle_type: str | None = None


@dataclass(frozen=True)
class BrandSummary:
    brand_id: int
    manufacturer: str
    model_count: int | None = None
    year_count: int | None = None
    total_listings: int | None = None
    average_price: float | None = None
