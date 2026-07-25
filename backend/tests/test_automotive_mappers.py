from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import pytest

from app.infrastructure.database.mappers import (
    _decimal_to_float,
    _normalize_str,
    map_brand,
    map_vehicle_market_stats,
    map_vehicle_master,
)
from app.infrastructure.database.models import (
    BrandModel,
    VehicleMarketStatsModel,
    VehicleMasterModel,
)

# ---------------------------------------------------------------------------
# _decimal_to_float
# ---------------------------------------------------------------------------

class TestDecimalToFloat:
    def test_decimal_integer(self) -> None:
        assert _decimal_to_float(Decimal("100")) == 100.0

    def test_decimal_fractional(self) -> None:
        assert _decimal_to_float(Decimal("12345.67")) == 12345.67

    def test_none_returns_none(self) -> None:
        assert _decimal_to_float(None) is None

    def test_float_passthrough(self) -> None:
        assert _decimal_to_float(42.5) == 42.5

    def test_zero(self) -> None:
        assert _decimal_to_float(Decimal("0")) == 0.0

    def test_negative(self) -> None:
        assert _decimal_to_float(Decimal("-5000.50")) == -5000.5


# ---------------------------------------------------------------------------
# _normalize_str
# ---------------------------------------------------------------------------

class TestNormalizeStr:
    def test_none_returns_none(self) -> None:
        assert _normalize_str(None) is None

    def test_empty_string(self) -> None:
        assert _normalize_str("") is None

    def test_whitespace_only(self) -> None:
        assert _normalize_str("   ") is None

    def test_na_value(self) -> None:
        assert _normalize_str("NA") is None

    def test_na_slash_value(self) -> None:
        assert _normalize_str("N/A") is None

    def test_null_string(self) -> None:
        assert _normalize_str("null") is None

    def test_none_string(self) -> None:
        assert _normalize_str("None") is None

    def test_normal_string_preserved(self) -> None:
        assert _normalize_str("Gas") == "Gas"

    def test_strips_surrounding_whitespace(self) -> None:
        assert _normalize_str("  Automatic  ") == "Automatic"


# ---------------------------------------------------------------------------
# map_vehicle_master
# ---------------------------------------------------------------------------

def _make_vehicle_master(**overrides: object) -> VehicleMasterModel:
    defaults = {
        "vehicle_id": 1,
        "vehicle_name": "Ford Focus 2020",
        "manufacturer": "Ford",
        "model": "Focus",
        "year": 2020,
        "listing_count": 5,
        "price_mean": Decimal("15000.00"),
        "price_median": Decimal("14500.00"),
        "price_min": Decimal("12000.00"),
        "price_max": Decimal("18000.00"),
        "odometer_mean": Decimal("45000.00"),
        "odometer_median": Decimal("42000.00"),
        "fuel_mode": "Gas",
        "transmission_mode": "Automatic",
        "condition_mode": None,
        "cylinders_mode": None,
        "drive_mode": "FWD",
        "type_mode": "Sedan",
        "size_mode": None,
        "paint_color_mode": "White",
        "states_count": 3,
        "first_posting_date": datetime(2021, 4, 12, 15, 22, 37),
        "last_posting_date": datetime(2021, 5, 2, 23, 33, 39),
        "price_range": "Medio",
        "market_confidence": "Muy baja",
    }
    defaults.update(overrides)
    return VehicleMasterModel(**defaults)  # type: ignore[arg-type]


class TestMapVehicleMaster:
    def test_basic_mapping(self) -> None:
        orm = _make_vehicle_master()
        dto = map_vehicle_master(orm)

        assert dto.vehicle_id == 1
        assert dto.vehicle_name == "Ford Focus 2020"
        assert dto.manufacturer == "Ford"
        assert dto.model == "Focus"
        assert dto.year == 2020
        assert dto.listing_count == 5

    def test_decimal_converted_to_float(self) -> None:
        orm = _make_vehicle_master()
        dto = map_vehicle_master(orm)

        assert dto.price_mean == 15000.0
        assert dto.price_median == 14500.0
        assert dto.price_min == 12000.0
        assert dto.price_max == 18000.0
        assert dto.odometer_mean == 45000.0
        assert dto.odometer_median == 42000.0
        assert isinstance(dto.price_mean, float)

    def test_field_renaming(self) -> None:
        orm = _make_vehicle_master()
        dto = map_vehicle_master(orm)

        assert dto.fuel == "Gas"
        assert dto.transmission == "Automatic"
        assert dto.drive == "FWD"
        assert dto.vehicle_type == "Sedan"
        assert dto.paint_color == "White"
        assert dto.price_range == "Medio"
        assert dto.market_confidence == "Muy baja"

    def test_none_values_preserved(self) -> None:
        orm = _make_vehicle_master(
            condition_mode=None,
            cylinders_mode=None,
            size_mode=None,
        )
        dto = map_vehicle_master(orm)

        assert dto.condition is None
        assert dto.cylinders is None
        assert dto.size is None

    def test_timestamps_preserved(self) -> None:
        ts_first = datetime(2021, 4, 12, 15, 22, 37)
        ts_last = datetime(2021, 5, 2, 23, 33, 39)
        orm = _make_vehicle_master(
            first_posting_date=ts_first,
            last_posting_date=ts_last,
        )
        dto = map_vehicle_master(orm)

        assert dto.first_posting_date == ts_first
        assert dto.last_posting_date == ts_last

    def test_empty_string_normalized_to_none(self) -> None:
        orm = _make_vehicle_master(
            fuel_mode="NA",
            transmission_mode="N/A",
            drive_mode="null",
            type_mode="None",
            condition_mode="",
        )
        dto = map_vehicle_master(orm)

        assert dto.fuel is None
        assert dto.transmission is None
        assert dto.drive is None
        assert dto.vehicle_type is None
        assert dto.condition is None

    def test_orm_not_modified(self) -> None:
        orm = _make_vehicle_master(fuel_mode="Gas")
        original_fuel = orm.fuel_mode
        map_vehicle_master(orm)
        assert orm.fuel_mode == original_fuel


# ---------------------------------------------------------------------------
# map_vehicle_market_stats
# ---------------------------------------------------------------------------

def _make_market_stats(**overrides: object) -> VehicleMarketStatsModel:
    defaults = {
        "id": 100,
        "manufacturer": "Toyota",
        "model": "Corolla",
        "years_available": 10,
        "oldest_year": 2010,
        "newest_year": 2020,
        "total_listings": 500,
        "overall_price_mean": Decimal("18000.00"),
        "overall_price_median": Decimal("17000.00"),
        "overall_odometer_mean": Decimal("80000.00"),
        "fuel_mode": "Gas",
        "transmission_mode": "Automatic",
        "drive_mode": None,
        "type_mode": "Sedan",
    }
    defaults.update(overrides)
    return VehicleMarketStatsModel(**defaults)  # type: ignore[arg-type]


class TestMapVehicleMarketStats:
    def test_basic_mapping(self) -> None:
        orm = _make_market_stats()
        dto = map_vehicle_market_stats(orm)

        assert dto.id == 100
        assert dto.manufacturer == "Toyota"
        assert dto.model == "Corolla"
        assert dto.years_available == 10
        assert dto.oldest_year == 2010
        assert dto.newest_year == 2020
        assert dto.total_listings == 500

    def test_decimal_converted_to_float(self) -> None:
        orm = _make_market_stats()
        dto = map_vehicle_market_stats(orm)

        assert dto.overall_price_mean == 18000.0
        assert dto.overall_price_median == 17000.0
        assert dto.overall_odometer_mean == 80000.0

    def test_field_renaming(self) -> None:
        orm = _make_market_stats()
        dto = map_vehicle_market_stats(orm)

        assert dto.fuel == "Gas"
        assert dto.transmission == "Automatic"
        assert dto.vehicle_type == "Sedan"
        assert dto.drive is None

    def test_none_decimal_preserved(self) -> None:
        orm = _make_market_stats(
            overall_price_mean=None,
            overall_price_median=None,
            overall_odometer_mean=None,
        )
        dto = map_vehicle_market_stats(orm)

        assert dto.overall_price_mean is None
        assert dto.overall_price_median is None
        assert dto.overall_odometer_mean is None


# ---------------------------------------------------------------------------
# map_brand
# ---------------------------------------------------------------------------

def _make_brand(**overrides: object) -> BrandModel:
    defaults = {
        "brand_id": 1,
        "manufacturer": "Toyota",
        "model_count": 150,
        "year_count": 20,
        "total_listings": 10000,
        "average_price": Decimal("22000.00"),
    }
    defaults.update(overrides)
    return BrandModel(**defaults)  # type: ignore[arg-type]


class TestMapBrand:
    def test_basic_mapping(self) -> None:
        orm = _make_brand()
        dto = map_brand(orm)

        assert dto.brand_id == 1
        assert dto.manufacturer == "Toyota"
        assert dto.model_count == 150
        assert dto.year_count == 20
        assert dto.total_listings == 10000

    def test_decimal_converted_to_float(self) -> None:
        orm = _make_brand()
        dto = map_brand(orm)

        assert dto.average_price == 22000.0
        assert isinstance(dto.average_price, float)

    def test_none_values_preserved(self) -> None:
        orm = _make_brand(
            model_count=None,
            year_count=None,
            total_listings=None,
            average_price=None,
        )
        dto = map_brand(orm)

        assert dto.model_count is None
        assert dto.year_count is None
        assert dto.total_listings is None
        assert dto.average_price is None


# ---------------------------------------------------------------------------
# DTO immutability
# ---------------------------------------------------------------------------

class TestDTOImmutability:
    def test_vehicle_summary_frozen(self) -> None:
        dto = map_vehicle_master(_make_vehicle_master())
        with pytest.raises(AttributeError):
            dto.fuel = "Electric"  # type: ignore[misc]

    def test_vehicle_market_summary_frozen(self) -> None:
        dto = map_vehicle_market_stats(_make_market_stats())
        with pytest.raises(AttributeError):
            dto.fuel = "Electric"  # type: ignore[misc]

    def test_brand_summary_frozen(self) -> None:
        dto = map_brand(_make_brand())
        with pytest.raises(AttributeError):
            dto.manufacturer = "Honda"  # type: ignore[misc]
