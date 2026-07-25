"""Integration tests for AutomotiveRepository.

These tests run ONLY when RUN_DB_INTEGRATION_TESTS=true is set.
They are read-only and never modify data.
"""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_DB_INTEGRATION_TESTS", "").lower() != "true",
    reason="Set RUN_DB_INTEGRATION_TESTS=true to run",
)


@pytest.fixture
async def repo() -> object:
    from app.infrastructure.database.connection import async_session_factory
    from app.infrastructure.database.repositories.automotive_repo import (
        SqlAlchemyAutomotiveRepository,
    )

    async with async_session_factory() as session:
        yield SqlAlchemyAutomotiveRepository(session)


class TestHealthCheck:
    async def test_returns_true(self, repo: object) -> None:
        result = await repo.health_check()
        assert result is True


class TestListBrands:
    async def test_returns_brands(self, repo: object) -> None:
        brands = await repo.list_brands(limit=5)
        assert len(brands) > 0
        assert brands[0].manufacturer is not None

    async def test_limit_works(self, repo: object) -> None:
        brands = await repo.list_brands(limit=3)
        assert len(brands) <= 3


class TestGetBrandStats:
    async def test_acura(self, repo: object) -> None:
        brand = await repo.get_brand_stats("Acura")
        assert brand is not None
        assert brand.manufacturer == "Acura"
        assert brand.total_listings is not None
        assert brand.total_listings > 0

    async def test_not_found(self, repo: object) -> None:
        brand = await repo.get_brand_stats("ZzzzzNonexistent")
        assert brand is None


class TestGetModelStats:
    async def test_acura_30cl(self, repo: object) -> None:
        stats = await repo.get_model_stats("Acura", "3.0cl")
        assert stats is not None
        assert stats.manufacturer == "Acura"
        assert stats.model == "3.0cl"

    async def test_not_found(self, repo: object) -> None:
        stats = await repo.get_model_stats("Zzzzz", "Nonexistent")
        assert stats is None


class TestSearchVehicles:
    async def test_acura(self, repo: object) -> None:
        vehicles = await repo.search_vehicles(manufacturer="Acura", limit=5)
        assert len(vehicles) > 0
        assert all(v.manufacturer == "Acura" for v in vehicles)

    async def test_model_partial(self, repo: object) -> None:
        vehicles = await repo.search_vehicles(manufacturer="Acura", model="3.0cl", limit=5)
        assert len(vehicles) > 0
        assert all("3.0cl" in v.model.lower() for v in vehicles)

    async def test_no_filters(self, repo: object) -> None:
        vehicles = await repo.search_vehicles(limit=3)
        assert len(vehicles) > 0


class TestGetVehicleDetails:
    async def test_acura_30cl(self, repo: object) -> None:
        details = await repo.get_vehicle_details("Acura", "3.0cl")
        assert len(details) > 0
        assert all(v.manufacturer == "Acura" for v in details)
        assert all(v.model == "3.0cl" for v in details)

    async def test_years_available(self, repo: object) -> None:
        details = await repo.get_vehicle_details("Acura", "3.0cl")
        years = sorted({d.year for d in details}, reverse=True)
        assert len(years) > 0

    async def test_with_year(self, repo: object) -> None:
        details_all = await repo.get_vehicle_details("Acura", "3.0cl")
        if details_all:
            year = details_all[0].year
            details_filtered = await repo.get_vehicle_details("Acura", "3.0cl", year=year)
            assert all(d.year == year for d in details_filtered)

    async def test_not_found(self, repo: object) -> None:
        details = await repo.get_vehicle_details("Zzzzz", "Nonexistent")
        assert details == []
