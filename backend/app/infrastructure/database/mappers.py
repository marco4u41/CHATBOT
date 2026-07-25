from __future__ import annotations

from decimal import Decimal

from app.domain.models.automotive import (
    BrandSummary,
    VehicleMarketSummary,
    VehicleSummary,
)
from app.infrastructure.database.models import (
    BrandModel,
    VehicleMarketStatsModel,
    VehicleMasterModel,
)

_EMPTY_VALUES = frozenset({"", " ", "NA", "N/A", "null", "None"})


def _decimal_to_float(value: Decimal | float | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _normalize_str(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    if stripped in _EMPTY_VALUES:
        return None
    return stripped


def map_vehicle_master(orm: VehicleMasterModel) -> VehicleSummary:
    return VehicleSummary(
        vehicle_id=orm.vehicle_id,
        vehicle_name=orm.vehicle_name,
        manufacturer=orm.manufacturer,
        model=orm.model,
        year=orm.year,
        listing_count=orm.listing_count,
        price_mean=_decimal_to_float(orm.price_mean),
        price_median=_decimal_to_float(orm.price_median),
        price_min=_decimal_to_float(orm.price_min),
        price_max=_decimal_to_float(orm.price_max),
        odometer_mean=_decimal_to_float(orm.odometer_mean),
        odometer_median=_decimal_to_float(orm.odometer_median),
        fuel=_normalize_str(orm.fuel_mode),
        transmission=_normalize_str(orm.transmission_mode),
        condition=_normalize_str(orm.condition_mode),
        cylinders=_normalize_str(orm.cylinders_mode),
        drive=_normalize_str(orm.drive_mode),
        vehicle_type=_normalize_str(orm.type_mode),
        size=_normalize_str(orm.size_mode),
        paint_color=_normalize_str(orm.paint_color_mode),
        states_count=orm.states_count,
        first_posting_date=orm.first_posting_date,
        last_posting_date=orm.last_posting_date,
        price_range=_normalize_str(orm.price_range),
        market_confidence=_normalize_str(orm.market_confidence),
    )


def map_vehicle_market_stats(orm: VehicleMarketStatsModel) -> VehicleMarketSummary:
    return VehicleMarketSummary(
        id=orm.id,
        manufacturer=orm.manufacturer,
        model=orm.model,
        years_available=orm.years_available,
        oldest_year=orm.oldest_year,
        newest_year=orm.newest_year,
        total_listings=orm.total_listings,
        overall_price_mean=_decimal_to_float(orm.overall_price_mean),
        overall_price_median=_decimal_to_float(orm.overall_price_median),
        overall_odometer_mean=_decimal_to_float(orm.overall_odometer_mean),
        fuel=_normalize_str(orm.fuel_mode),
        transmission=_normalize_str(orm.transmission_mode),
        drive=_normalize_str(orm.drive_mode),
        vehicle_type=_normalize_str(orm.type_mode),
    )


def map_brand(orm: BrandModel) -> BrandSummary:
    return BrandSummary(
        brand_id=orm.brand_id,
        manufacturer=orm.manufacturer,
        model_count=orm.model_count,
        year_count=orm.year_count,
        total_listings=orm.total_listings,
        average_price=_decimal_to_float(orm.average_price),
    )
