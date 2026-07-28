from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.agent.capability import CapabilityContext
from app.domain.agent.context.user_context import UserContext, VehicleInfo
from app.domain.agent.intent import Intent
from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.agent.registry import CapabilityRegistry

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_automotive_tool(**methods: object) -> MagicMock:
    tool = MagicMock()
    for name, impl in methods.items():
        setattr(tool, name, AsyncMock(return_value=impl))
    return tool


def _orchestrator_with_tool(
    automotive_tool: object | None = None,
) -> AgentOrchestrator:
    llm = MagicMock()
    registry = CapabilityRegistry()
    return AgentOrchestrator(
        llm=llm,
        registry=registry,
        automotive_tool=automotive_tool,
    )


# ---------------------------------------------------------------------------
# _fetch_automotive_data — no tool
# ---------------------------------------------------------------------------

class TestFetchNoTool:
    @pytest.mark.asyncio
    async def test_returns_empty_when_no_tool(self) -> None:
        orch = _orchestrator_with_tool(automotive_tool=None)
        result = await orch._fetch_automotive_data(Intent.GENERAL, UserContext())
        assert result == ""


# ---------------------------------------------------------------------------
# _fetch_automotive_data — GENERAL intent
# ---------------------------------------------------------------------------

class TestFetchGeneralIntent:
    @pytest.mark.asyncio
    async def test_general_returns_empty_without_queries(self) -> None:
        tool = _mock_automotive_tool(get_brand_info=MagicMock())
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(mentioned_brands=["Toyota"])
        result = await orch._fetch_automotive_data(Intent.GENERAL, ctx)

        assert result == ""
        tool.get_brand_info.assert_not_called()


# ---------------------------------------------------------------------------
# _fetch_automotive_data — RECOMMENDATION intent
# ---------------------------------------------------------------------------

class TestFetchRecommendationIntent:
    @pytest.mark.asyncio
    async def test_any_brand_suv_city_payload_has_no_manufacturer(self) -> None:
        search_block = MagicMock(
            content="[VEHICLE_SEARCH_RESULTS]\nResultados: 4 vehículos"
        )
        tool = _mock_automotive_tool(search_vehicles=search_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)
        ctx = UserContext(
            mentioned_brands=[],
            preferred_brands=["Subaru"],
            manufacturer_cleared=True,
            body_type="suv",
            fuel_preference="gas",
            budget=25_000,
            usage="urbano",
        )

        await orch._fetch_automotive_data(
            Intent.RECOMMENDATION,
            ctx,
            conversation_id="conversation-b",
            user_id="user-1",
        )

        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None,
            max_price=25_000,
            vehicle_type="suv",
            fuel="gas",
            limit=20,
        )

    @pytest.mark.asyncio
    async def test_calls_search_vehicles_with_budget(self) -> None:
        search_block = MagicMock(content="[VEHICLE_SEARCH]\nResults")
        tool = _mock_automotive_tool(search_vehicles=search_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=50000.0)
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert "VEHICLE_SEARCH" in result
        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None,
            max_price=pytest.approx(50000.0),
            vehicle_type=None,
            fuel=None,
            limit=20,
        )

    @pytest.mark.asyncio
    async def test_maps_usage_to_vehicle_type(self) -> None:
        search_block = MagicMock(content="[VEHICLE_SEARCH]\nResults")
        tool = _mock_automotive_tool(search_vehicles=search_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=30000.0, usage="familiar")
        await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None, max_price=30000.0, vehicle_type="suv", fuel=None, limit=20,
        )

    @pytest.mark.asyncio
    async def test_passes_fuel_from_engine_type(self) -> None:
        search_block = MagicMock(content="[VEHICLE_SEARCH]\nResults")
        tool = _mock_automotive_tool(search_vehicles=search_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=40000.0, engine_type="electrico")
        await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None, max_price=40000.0, vehicle_type=None, fuel="electrico", limit=20,
        )

    @pytest.mark.asyncio
    async def test_fetches_details_for_owned_vehicles(self) -> None:
        detail_block = MagicMock(content="[VEHICLE_DETAILS]\nToyota Corolla")
        model_block = MagicMock(content="[MODEL_INFO]\nCorolla stats")
        tool = _mock_automotive_tool(
            search_vehicles=MagicMock(content="[VEHICLE_SEARCH]\nResults"),
            get_vehicle_details=detail_block,
            get_model_info=model_block,
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(
            budget=50000.0,
            vehicles=[VehicleInfo(brand="Toyota", model="Corolla", year=2024)],
        )
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert "VEHICLE_DETAILS" in result
        assert "MODEL_INFO" in result
        tool.get_vehicle_details.assert_awaited_once_with(
            "Toyota", "Corolla", year=2024,
        )
        tool.get_model_info.assert_awaited_once_with("Toyota", "Corolla")

    @pytest.mark.asyncio
    async def test_fetches_brand_info_for_mentioned_brands(self) -> None:
        brand_block = MagicMock(content="[BRAND_INFO]\nMazda data")
        tool = _mock_automotive_tool(
            search_vehicles=MagicMock(content="[VEHICLE_SEARCH]\nResults"),
            get_brand_info=brand_block,
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=50000.0, mentioned_brands=["Mazda"])
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert "BRAND_INFO" in result
        tool.get_brand_info.assert_awaited_once_with("Mazda")

    @pytest.mark.asyncio
    async def test_no_duplicate_brand_fetch(self) -> None:
        brand_block = MagicMock(content="[BRAND_INFO]\nToyota data")
        tool = _mock_automotive_tool(
            search_vehicles=MagicMock(content="[VEHICLE_SEARCH]\nResults"),
            get_brand_info=brand_block,
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(
            budget=50000.0,
            vehicles=[VehicleInfo(brand="Toyota", model="")],
            mentioned_brands=["Toyota"],
        )
        await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert tool.get_brand_info.await_count == 1

    @pytest.mark.asyncio
    async def test_search_always_called_for_recommendation(self) -> None:
        tool = _mock_automotive_tool(
            search_vehicles=MagicMock(content="[VEHICLE_SEARCH]\nPopular"),
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext()
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None, max_price=None, vehicle_type=None, fuel=None, limit=20,
        )
        assert "VEHICLE_SEARCH" in result

    @pytest.mark.asyncio
    async def test_search_even_without_budget_when_usage_set(self) -> None:
        search_block = MagicMock(content="[VEHICLE_SEARCH]\nResults")
        tool = _mock_automotive_tool(search_vehicles=search_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(usage="trabajo")
        await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        tool.search_vehicles.assert_awaited_once_with(
            manufacturer=None, max_price=None, vehicle_type="truck", fuel=None, limit=20,
        )


# ---------------------------------------------------------------------------
# _fetch_automotive_data — COMPARISON intent
# ---------------------------------------------------------------------------

class TestFetchComparisonIntent:
    @pytest.mark.asyncio
    async def test_queries_details_and_model_for_each_vehicle(self) -> None:
        detail_a = MagicMock(content="[VEHICLE_DETAILS]\nToyota Corolla")
        model_a = MagicMock(content="[MODEL_INFO]\nCorolla stats")
        detail_b = MagicMock(content="[VEHICLE_DETAILS]\nHonda Civic")
        model_b = MagicMock(content="[MODEL_INFO]\nCivic stats")

        tool = _mock_automotive_tool(
            get_vehicle_details=detail_a,
            get_model_info=model_a,
        )
        tool.get_vehicle_details = AsyncMock(
            side_effect=[detail_a, detail_b],
        )
        tool.get_model_info = AsyncMock(
            side_effect=[model_a, model_b],
        )

        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(vehicles=[
            VehicleInfo(brand="Toyota", model="Corolla"),
            VehicleInfo(brand="Honda", model="Civic"),
        ])
        result = await orch._fetch_automotive_data(Intent.COMPARISON, ctx)

        assert "VEHICLE_DETAILS" in result
        assert tool.get_vehicle_details.await_count == 2
        assert tool.get_model_info.await_count == 2

    @pytest.mark.asyncio
    async def test_falls_back_to_brand_when_no_model(self) -> None:
        brand_block = MagicMock(content="[BRAND_INFO]\nHonda overview")
        tool = _mock_automotive_tool(get_brand_info=brand_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(vehicles=[
            VehicleInfo(brand="Honda", model=""),
        ])
        result = await orch._fetch_automotive_data(Intent.COMPARISON, ctx)

        assert "BRAND_INFO" in result
        tool.get_brand_info.assert_awaited_once_with("Honda")
        tool.get_vehicle_details.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetches_mentioned_brands(self) -> None:
        brand_block = MagicMock(content="[BRAND_INFO]\nMazda data")
        tool = _mock_automotive_tool(get_brand_info=brand_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(mentioned_brands=["Mazda"])
        result = await orch._fetch_automotive_data(Intent.COMPARISON, ctx)

        assert "BRAND_INFO" in result
        tool.get_brand_info.assert_awaited_once_with("Mazda")


# ---------------------------------------------------------------------------
# _fetch_automotive_data — DIAGNOSIS intent
# ---------------------------------------------------------------------------

class TestFetchDiagnosisIntent:
    @pytest.mark.asyncio
    async def test_queries_first_vehicle_only(self) -> None:
        detail_block = MagicMock(content="[VEHICLE_DETAILS]\nAcura MDX")
        model_block = MagicMock(content="[MODEL_INFO]\nMDX stats")
        tool = _mock_automotive_tool(
            get_vehicle_details=detail_block,
            get_model_info=model_block,
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(vehicles=[
            VehicleInfo(brand="Acura", model="MDX"),
            VehicleInfo(brand="Toyota", model="Corolla"),
        ])
        result = await orch._fetch_automotive_data(Intent.DIAGNOSIS, ctx)

        assert "VEHICLE_DETAILS" in result
        assert "MODEL_INFO" in result
        tool.get_vehicle_details.assert_awaited_once_with(
            "Acura", "MDX", year=None,
        )
        tool.get_model_info.assert_awaited_once_with("Acura", "MDX")

    @pytest.mark.asyncio
    async def test_falls_back_to_brand_when_no_model(self) -> None:
        brand_block = MagicMock(content="[BRAND_INFO]\nHonda overview")
        tool = _mock_automotive_tool(get_brand_info=brand_block)
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(vehicles=[
            VehicleInfo(brand="Honda", model=""),
        ])
        result = await orch._fetch_automotive_data(Intent.DIAGNOSIS, ctx)

        assert "BRAND_INFO" in result
        tool.get_brand_info.assert_awaited_once_with("Honda")
        tool.get_vehicle_details.assert_not_called()

    @pytest.mark.asyncio
    async def test_empty_when_no_vehicles(self) -> None:
        tool = _mock_automotive_tool()
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext()
        result = await orch._fetch_automotive_data(Intent.DIAGNOSIS, ctx)

        assert result == ""


# ---------------------------------------------------------------------------
# _fetch_automotive_data — exception handling
# ---------------------------------------------------------------------------

class TestFetchExceptionHandling:
    @pytest.mark.asyncio
    async def test_handles_exception_gracefully(self) -> None:
        tool = _mock_automotive_tool(
            search_vehicles=AsyncMock(side_effect=RuntimeError("db down")),
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=50000.0)
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert result == ""

    @pytest.mark.asyncio
    async def test_handles_tool_returning_none(self) -> None:
        tool = _mock_automotive_tool(
            search_vehicles=AsyncMock(return_value=None),
        )
        orch = _orchestrator_with_tool(automotive_tool=tool)

        ctx = UserContext(budget=50000.0)
        result = await orch._fetch_automotive_data(Intent.RECOMMENDATION, ctx)

        assert result == ""


# ---------------------------------------------------------------------------
# _map_usage_to_vehicle_type
# ---------------------------------------------------------------------------

class TestMapUsageToVehicleType:
    def test_urbano_maps_to_sedan(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("urbano") == "sedan"

    def test_familiar_maps_to_suv(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("familiar") == "suv"

    def test_trabajo_maps_to_truck(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("trabajo") == "truck"

    def test_carga_maps_to_truck(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("carga") == "truck"

    def test_deportivo_maps_to_coupe(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("deportivo") == "coupe"

    def test_offroad_maps_to_suv(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("offroad") == "suv"

    def test_ruta_maps_to_sedan(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("ruta") == "sedan"

    def test_unknown_returns_none(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("xyz") is None

    def test_none_returns_none(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type(None) is None

    def test_empty_string_returns_none(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("") is None

    def test_case_insensitive(self) -> None:
        assert AgentOrchestrator._map_usage_to_vehicle_type("URBANO") == "sedan"


# ---------------------------------------------------------------------------
# CapabilityContext.automotive_data
# ---------------------------------------------------------------------------

class TestCapabilityContextAutomotiveData:
    def test_default_is_empty(self) -> None:
        ctx = CapabilityContext(user_message="test")
        assert ctx.automotive_data == ""

    def test_injected_data_preserved(self) -> None:
        ctx = CapabilityContext(
            user_message="test",
            automotive_data="[BRAND_INFO]\nToyota",
        )
        assert ctx.automotive_data == "[BRAND_INFO]\nToyota"
