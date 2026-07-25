from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.agent.automotive_tool import VehicleDataBlock
from app.domain.models.automotive import (
    BrandSummary,
    VehicleMarketSummary,
    VehicleSummary,
)
from app.infrastructure.agent.automotive_tool_impl import SqlAlchemyAutomotiveAgentTool

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_vehicle(
    *,
    vehicle_id: int = 1,
    vehicle_name: str = "Acura MDX 2023",
    manufacturer: str = "Acura",
    model: str = "mdx",
    year: int = 2023,
    price_mean: float = 45000.0,
    price_median: float = 43000.0,
    **kwargs: object,
) -> VehicleSummary:
    defaults = {
        "vehicle_id": vehicle_id,
        "vehicle_name": vehicle_name,
        "manufacturer": manufacturer,
        "model": model,
        "year": year,
        "price_mean": price_mean,
        "price_median": price_median,
    }
    defaults.update(kwargs)
    return VehicleSummary(**defaults)  # type: ignore[arg-type]


def _make_brand(
    *,
    brand_id: int = 1,
    manufacturer: str = "Acura",
    model_count: int = 5,
    total_listings: int = 1200,
    average_price: float = 42000.0,
    **kwargs: object,
) -> BrandSummary:
    defaults = {
        "brand_id": brand_id,
        "manufacturer": manufacturer,
        "model_count": model_count,
        "total_listings": total_listings,
        "average_price": average_price,
    }
    defaults.update(kwargs)
    return BrandSummary(**defaults)  # type: ignore[arg-type]


def _make_market_stats(
    *,
    stat_id: int = 1,
    manufacturer: str = "Acura",
    model: str = "mdx",
    total_listings: int = 800,
    overall_price_mean: float = 44000.0,
    overall_price_median: float = 42500.0,
    **kwargs: object,
) -> VehicleMarketSummary:
    defaults = {
        "id": stat_id,
        "manufacturer": manufacturer,
        "model": model,
        "total_listings": total_listings,
        "overall_price_mean": overall_price_mean,
        "overall_price_median": overall_price_median,
    }
    defaults.update(kwargs)
    return VehicleMarketSummary(**defaults)  # type: ignore[arg-type]


def _mock_repo(**methods: object) -> MagicMock:
    repo = MagicMock()
    for name, impl in methods.items():
        setattr(repo, name, AsyncMock(return_value=impl))
    return repo


# ---------------------------------------------------------------------------
# search_vehicles
# ---------------------------------------------------------------------------

class TestSearchVehicles:
    @pytest.mark.asyncio
    async def test_returns_formatted_block(self) -> None:
        vehicles = [_make_vehicle(), _make_vehicle(vehicle_id=2, vehicle_name="Acura TLX 2023")]
        repo = _mock_repo(search_vehicles=vehicles)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.search_vehicles(manufacturer="Acura")

        assert result is not None
        assert isinstance(result, VehicleDataBlock)
        assert "2 vehículo(s)" in result.title
        assert "[VEHICLE_SEARCH_RESULTS]" in result.content
        assert "Acura MDX 2023" in result.content
        assert "Acura TLX 2023" in result.content
        repo.search_vehicles.assert_awaited_once_with(
            manufacturer="Acura",
            model=None,
            year=None,
            min_price=None,
            max_price=None,
            fuel=None,
            vehicle_type=None,
            limit=5,
        )

    @pytest.mark.asyncio
    async def test_empty_results_returns_none(self) -> None:
        repo = _mock_repo(search_vehicles=[])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.search_vehicles(manufacturer="Zzzz")

        assert result is None

    @pytest.mark.asyncio
    async def test_passes_all_filters(self) -> None:
        repo = _mock_repo(search_vehicles=[])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        await tool.search_vehicles(
            manufacturer="Toyota",
            model="camry",
            year=2023,
            min_price=20000,
            max_price=30000,
            fuel="gasoline",
            vehicle_type="sedan",
            limit=3,
        )

        repo.search_vehicles.assert_awaited_once_with(
            manufacturer="Toyota",
            model="camry",
            year=2023,
            min_price=20000,
            max_price=30000,
            fuel="gasoline",
            vehicle_type="sedan",
            limit=3,
        )

    @pytest.mark.asyncio
    async def test_formats_prices(self) -> None:
        vehicles = [_make_vehicle(price_mean=45678.5, price_median=43210.0)]
        repo = _mock_repo(search_vehicles=vehicles)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.search_vehicles()

        assert result is not None
        assert "$43,210" in result.content
        assert "$45,678" in result.content


# ---------------------------------------------------------------------------
# get_vehicle_details
# ---------------------------------------------------------------------------

class TestGetVehicleDetails:
    @pytest.mark.asyncio
    async def test_returns_formatted_block(self) -> None:
        details = [
            _make_vehicle(year=2023, vehicle_name="Acura MDX 2023"),
            _make_vehicle(year=2022, vehicle_name="Acura MDX 2022"),
        ]
        repo = _mock_repo(get_vehicle_details=details)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_vehicle_details("Acura", "mdx")

        assert result is not None
        assert "[VEHICLE_DETAILS]" in result.content
        assert "2023" in result.content
        assert "2022" in result.content

    @pytest.mark.asyncio
    async def test_not_found_returns_none(self) -> None:
        repo = _mock_repo(get_vehicle_details=[])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_vehicle_details("Zzzz", "nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_with_year_filter(self) -> None:
        details = [_make_vehicle(year=2023)]
        repo = _mock_repo(get_vehicle_details=details)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_vehicle_details("Acura", "mdx", year=2023)

        assert result is not None
        repo.get_vehicle_details.assert_awaited_once_with("Acura", "mdx", 2023)


# ---------------------------------------------------------------------------
# get_brand_info
# ---------------------------------------------------------------------------

class TestGetBrandInfo:
    @pytest.mark.asyncio
    async def test_returns_formatted_block(self) -> None:
        brand = _make_brand()
        repo = _mock_repo(get_brand_stats=brand)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_brand_info("Acura")

        assert result is not None
        assert "[BRAND_INFO]" in result.content
        assert "Acura" in result.content
        assert "Modelos distintos: 5" in result.content
        assert "$42,000" in result.content

    @pytest.mark.asyncio
    async def test_not_found_returns_none(self) -> None:
        repo = _mock_repo(get_brand_stats=None)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_brand_info("Zzzz")

        assert result is None


# ---------------------------------------------------------------------------
# get_model_info
# ---------------------------------------------------------------------------

class TestGetModelInfo:
    @pytest.mark.asyncio
    async def test_returns_formatted_block(self) -> None:
        stats = _make_market_stats()
        repo = _mock_repo(get_model_stats=stats)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_model_info("Acura", "mdx")

        assert result is not None
        assert "[MODEL_INFO]" in result.content
        assert "Acura" in result.content
        assert "mdx" in result.content

    @pytest.mark.asyncio
    async def test_not_found_returns_none(self) -> None:
        repo = _mock_repo(get_model_stats=None)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_model_info("Zzzz", "nonexistent")

        assert result is None


# ---------------------------------------------------------------------------
# list_brands
# ---------------------------------------------------------------------------

class TestListBrands:
    @pytest.mark.asyncio
    async def test_returns_formatted_block(self) -> None:
        brands = [_make_brand(), _make_brand(brand_id=2, manufacturer="Toyota")]
        repo = _mock_repo(list_brands=brands)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.list_brands()

        assert result is not None
        assert "[BRAND_LIST]" in result.content
        assert "Acura" in result.content
        assert "Toyota" in result.content
        assert "2" in result.title

    @pytest.mark.asyncio
    async def test_empty_returns_none(self) -> None:
        repo = _mock_repo(list_brands=[])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.list_brands()

        assert result is None

    @pytest.mark.asyncio
    async def test_passes_limit(self) -> None:
        repo = _mock_repo(list_brands=[])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        await tool.list_brands(limit=50)

        repo.list_brands.assert_awaited_once_with(limit=50)


# ---------------------------------------------------------------------------
# health_check
# ---------------------------------------------------------------------------

class TestHealthCheck:
    @pytest.mark.asyncio
    async def test_returns_true(self) -> None:
        repo = _mock_repo(health_check=True)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        assert await tool.health_check() is True

    @pytest.mark.asyncio
    async def test_returns_false(self) -> None:
        repo = _mock_repo(health_check=False)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        assert await tool.health_check() is False


# ---------------------------------------------------------------------------
# Formatting edge cases
# ---------------------------------------------------------------------------

class TestFormatting:
    @pytest.mark.asyncio
    async def test_none_prices_display_na(self) -> None:
        vehicle = _make_vehicle(price_mean=None, price_median=None)
        repo = _mock_repo(search_vehicles=[vehicle])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.search_vehicles()

        assert result is not None
        assert "N/A" in result.content

    @pytest.mark.asyncio
    async def test_brand_none_fields_display_na(self) -> None:
        brand = _make_brand(model_count=None, total_listings=None, average_price=None)
        repo = _mock_repo(get_brand_stats=brand)
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.get_brand_info("Acura")

        assert result is not None
        assert "N/A" in result.content

    @pytest.mark.asyncio
    async def test_single_vehicle_no_index_issue(self) -> None:
        vehicle = _make_vehicle()
        repo = _mock_repo(search_vehicles=[vehicle])
        tool = SqlAlchemyAutomotiveAgentTool(repo)

        result = await tool.search_vehicles()

        assert result is not None
        assert "1 vehículo(s)" in result.title
        assert "Vehículo 1" in result.content
