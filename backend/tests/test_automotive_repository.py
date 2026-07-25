from __future__ import annotations

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.infrastructure.database.models import (
    BrandModel,
    VehicleMarketStatsModel,
    VehicleMasterModel,
)
from app.infrastructure.database.repositories.automotive_repo import (
    _clamp,
    _normalize_filter,
)

# ---------------------------------------------------------------------------
# Helpers
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
        "first_posting_date": None,
        "last_posting_date": None,
        "price_range": "Medio",
        "market_confidence": "Muy baja",
    }
    defaults.update(overrides)
    return VehicleMasterModel(**defaults)  # type: ignore[arg-type]


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


def _mock_session(scalars_result: list | None = None) -> AsyncMock:
    session = AsyncMock()
    mock_result = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = scalars_result or []
    mock_result.scalars.return_value = mock_scalars
    session.execute.return_value = mock_result
    return session


def _mock_session_scalar(value: object | None = None) -> AsyncMock:
    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = value
    session.execute.return_value = mock_result
    return session


# ---------------------------------------------------------------------------
# _normalize_filter
# ---------------------------------------------------------------------------

class TestNormalizeFilter:
    def test_none_returns_none(self) -> None:
        assert _normalize_filter(None) is None

    def test_empty_string(self) -> None:
        assert _normalize_filter("") is None

    def test_whitespace_only(self) -> None:
        assert _normalize_filter("   ") is None

    def test_normal_string(self) -> None:
        assert _normalize_filter("Ford") == "Ford"

    def test_strips_whitespace(self) -> None:
        assert _normalize_filter("  Toyota  ") == "Toyota"


# ---------------------------------------------------------------------------
# _clamp
# ---------------------------------------------------------------------------

class TestClamp:
    def test_within_range(self) -> None:
        assert _clamp(5, 1, 50) == 5

    def test_below_min(self) -> None:
        assert _clamp(0, 1, 50) == 1

    def test_above_max(self) -> None:
        assert _clamp(100, 1, 50) == 50

    def test_exact_min(self) -> None:
        assert _clamp(1, 1, 50) == 1

    def test_exact_max(self) -> None:
        assert _clamp(50, 1, 50) == 50


# ---------------------------------------------------------------------------
# search_vehicles
# ---------------------------------------------------------------------------

class TestSearchVehicles:
    async def test_no_filters(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master()
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles()

        assert len(results) == 1
        assert results[0].manufacturer == "Ford"
        session.execute.assert_awaited_once()

    async def test_filter_manufacturer(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(manufacturer="Toyota")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(manufacturer="Toyota")

        assert len(results) == 1
        assert results[0].manufacturer == "Toyota"

    async def test_filter_manufacturer_case_insensitive(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(manufacturer="Ford")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(manufacturer="ford")

        assert len(results) == 1

    async def test_filter_model_partial(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(model="Focus SE")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(model="focus")

        assert len(results) == 1

    async def test_filter_year(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(year=2020)
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(year=2020)

        assert len(results) == 1
        assert results[0].year == 2020

    async def test_filter_fuel(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(fuel_mode="Gas")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(fuel="gas")

        assert len(results) == 1

    async def test_filter_transmission(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(transmission_mode="Automatic")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(transmission="automatic")

        assert len(results) == 1

    async def test_filter_vehicle_type(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(type_mode="Sedan")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(vehicle_type="sedan")

        assert len(results) == 1

    async def test_limit_clamped(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        await repo.search_vehicles(limit=0)
        await repo.search_vehicles(limit=100)

        assert session.execute.await_count == 2

    async def test_offset_negative_becomes_zero(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(offset=-5)

        assert results == []

    async def test_empty_manufacturer_returns_all(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles(manufacturer="")

        assert results == []

    async def test_db_error_returns_empty(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection lost")
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.search_vehicles()

        assert results == []


# ---------------------------------------------------------------------------
# get_vehicle_details
# ---------------------------------------------------------------------------

class TestGetVehicleDetails:
    async def test_found(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(manufacturer="Acura", model="3.0cl", year=2001)
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Acura", "3.0cl")

        assert len(results) == 1
        assert results[0].manufacturer == "Acura"

    async def test_with_year(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(manufacturer="Acura", model="3.0cl", year=2001)
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Acura", "3.0cl", year=2001)

        assert len(results) == 1
        assert results[0].year == 2001

    async def test_without_year_returns_all(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v1 = _make_vehicle_master(vehicle_id=1, year=2001)
        v2 = _make_vehicle_master(vehicle_id=2, year=2002)
        session = _mock_session([v1, v2])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Ford", "Focus")

        assert len(results) == 2

    async def test_empty_manufacturer_returns_empty(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("", "Focus")

        assert results == []

    async def test_empty_model_returns_empty(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Ford", "")

        assert results == []

    async def test_case_insensitive(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        v = _make_vehicle_master(manufacturer="Ford", model="Focus")
        session = _mock_session([v])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("ford", "focus")

        assert len(results) == 1

    async def test_not_found_returns_empty(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Zzzzz", "Nonexistent")

        assert results == []

    async def test_db_error_returns_empty(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection lost")
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.get_vehicle_details("Ford", "Focus")

        assert results == []


# ---------------------------------------------------------------------------
# get_model_stats
# ---------------------------------------------------------------------------

class TestGetModelStats:
    async def test_found(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        m = _make_market_stats(manufacturer="Toyota", model="Corolla")
        session = _mock_session_scalar(m)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_model_stats("Toyota", "Corolla")

        assert result is not None
        assert result.manufacturer == "Toyota"
        assert result.model == "Corolla"

    async def test_not_found(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session_scalar(None)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_model_stats("Zzzzz", "Nonexistent")

        assert result is None

    async def test_empty_manufacturer(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session_scalar(None)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_model_stats("", "Corolla")

        assert result is None

    async def test_case_insensitive(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        m = _make_market_stats(manufacturer="Toyota", model="Corolla")
        session = _mock_session_scalar(m)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_model_stats("toyota", "corolla")

        assert result is not None

    async def test_db_error_returns_none(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection lost")
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_model_stats("Toyota", "Corolla")

        assert result is None


# ---------------------------------------------------------------------------
# get_brand_stats
# ---------------------------------------------------------------------------

class TestGetBrandStats:
    async def test_found(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        b = _make_brand(manufacturer="Toyota")
        session = _mock_session_scalar(b)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_brand_stats("Toyota")

        assert result is not None
        assert result.manufacturer == "Toyota"

    async def test_not_found(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session_scalar(None)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_brand_stats("Zzzzz")

        assert result is None

    async def test_empty_manufacturer(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session_scalar(None)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_brand_stats("")

        assert result is None

    async def test_case_insensitive(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        b = _make_brand(manufacturer="Toyota")
        session = _mock_session_scalar(b)
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_brand_stats("toyota")

        assert result is not None

    async def test_db_error_returns_none(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection lost")
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.get_brand_stats("Toyota")

        assert result is None


# ---------------------------------------------------------------------------
# list_brands
# ---------------------------------------------------------------------------

class TestListBrands:
    async def test_returns_brands(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        b1 = _make_brand(brand_id=1, manufacturer="Ford")
        b2 = _make_brand(brand_id=2, manufacturer="Toyota")
        session = _mock_session([b1, b2])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.list_brands()

        assert len(results) == 2
        assert results[0].manufacturer == "Ford"
        assert results[1].manufacturer == "Toyota"

    async def test_limit_clamped(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        await repo.list_brands(limit=0)
        await repo.list_brands(limit=200)

        assert session.execute.await_count == 2

    async def test_empty_list(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = _mock_session([])
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.list_brands()

        assert results == []

    async def test_db_error_returns_empty(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection lost")
        repo = SqlAlchemyAutomotiveRepository(session)

        results = await repo.list_brands()

        assert results == []


# ---------------------------------------------------------------------------
# health_check
# ---------------------------------------------------------------------------

class TestHealthCheck:
    async def test_success(self) -> None:
        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.health_check()

        assert result is True

    async def test_failure(self) -> None:
        from sqlalchemy.exc import SQLAlchemyError

        from app.infrastructure.database.repositories.automotive_repo import (
            SqlAlchemyAutomotiveRepository,
        )

        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("connection refused")
        repo = SqlAlchemyAutomotiveRepository(session)

        result = await repo.health_check()

        assert result is False
