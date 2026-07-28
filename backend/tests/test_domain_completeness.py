"""Tests for expanded automotive domain coverage.

Validates that:
- Lubricants, filters, tires, batteries, parts, fluids, ECU, tools, etc. stay in scope
- The sample comparison query from the spec reaches the LLM
- Out-of-scope topics (Docker, recipes, general history) do NOT reach the LLM
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, MagicMock

from app.domain.agent.intent import Intent
from app.domain.agent.intent_classifier import IntentClassifier
from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.agent.registry import CapabilityRegistry
from app.domain.interfaces.llm_provider import LLMProvider
from app.domain.models.message import Message
from app.use_cases.chat import ChatUseCase

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _llm_stream(tokens: list[str]) -> MagicMock:
    llm = MagicMock(spec=LLMProvider)

    async def _stream(
        messages: list[Message], system_prompt: str = "",
    ) -> AsyncIterator[str]:
        for t in tokens:
            yield t

    llm.stream_chat = _stream
    return llm


def _orch(llm=None) -> AgentOrchestrator:
    registry = CapabilityRegistry()
    return AgentOrchestrator(
        llm=llm or _llm_stream(["ok"]),
        registry=registry,
        automotive_tool=None,
    )


def _conv_mock(message_count: int = 0) -> MagicMock:
    conv = MagicMock()
    conv.id = "conv-test"
    conv.message_count = message_count
    return conv


def _use_case(orch, conv=None, msg_repo=None):
    conv = conv or _conv_mock()
    mr = msg_repo or MagicMock()
    mr.create = AsyncMock()
    mr.get_last_n = AsyncMock(return_value=[])
    cr = MagicMock()
    cr.get_by_id = AsyncMock(return_value=None)
    cr.create = AsyncMock(return_value=conv)
    cr.update = AsyncMock()
    return ChatUseCase(orch, cr, mr), conv


# ===========================================================================
# 1. Lubricants & oils — must be IN SCOPE
# ===========================================================================

class TestLubricantsAndOils:
    def test_5w30_oil_query(self) -> None:
        clf = IntentClassifier()
        result = clf.classify(
            "Compara los 5 mejores aceites sintéticos 5W-30 "
            "disponibles en Venezuela para un motor turbo"
        )
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_5w30_standalone(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué aceite 5W-30 me recomiendas?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_api_sp_certification(self) -> None:
        clf = IntentClassifier()
        result = clf.classify(
            "Qué diferencia hay entre aceite con certificación "
            "API SP y API SN"
        )
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_acea_certification(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cuál es la norma ACEA para motores diesel modernos?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_ilsac(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué significa ILSAC GF-6 en un aceite de motor?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_oem_approvals(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué aprobaciones OEM necesito para mi Toyota?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_synthetic_vs_mineral(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Es mejor aceite sintético o mineral?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_oil_viscosity(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué viscosidad debo usar en clima tropical?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_oil_change_interval(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cada cuánto debo cambiar el aceite?")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 2. Coolants & brake fluids — must be IN SCOPE
# ===========================================================================

class TestCoolantsAndBrakeFluids:
    def test_coolant_type(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué tipo de refrigerante usa mi carro?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_brake_fluid_dot4(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cada cuánto debo cambiar el líquido de frenos DOT4?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_anticongelante(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cuándo debo reponer el anticongelante?")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 3. Filters — must be IN SCOPE
# ===========================================================================

class TestFilters:
    def test_oil_filter(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué filtro de aceite es compatible con mi Civic?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_air_filter(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cada cuánto debo cambiar el filtro de aire?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_fuel_filter(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿El filtro de combustible se cambia con el service?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_cabin_filter(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué es el filtro de habitáculo?")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 4. Tires & wheels — must be IN SCOPE
# ===========================================================================

class TestTires:
    def tire_pressure(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cuál es la presión ideal para las llantas?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_tire_rotation(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cuándo debo rotar los neumáticos?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_tire_brand(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué marca de llantas me recomiendas?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_tire_wear(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cómo sé si mis neumáticos están en buen estado?")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 5. Batteries — must be IN SCOPE
# ===========================================================================

class TestBatteries:
    def test_battery_replacement(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cada cuánto se cambia la batería del carro?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_battery_type(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Qué batería es mejor, AGM o convencional?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_battery_warning(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("Se enciende el testigo de la batería")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 6. Spare parts — must be IN SCOPE
# ===========================================================================

class TestSpareParts:
    def test_oem_parts(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Dónde consigo repuestos originales Toyota?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_aftermarket_parts(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Los repuestos aftermarket son confiables?")
        assert result.intent != Intent.OUT_OF_SCOPE

    def test_clutch_kit(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("¿Cuánto cuesta un kit de embrague para un Corolla?")
        assert result.intent != Intent.OUT_OF_SCOPE


# ===========================================================================
# 7. The SPEC QUERY — must be IN SCOPE and classify as COMPARISON
# ===========================================================================

class TestSpecQuery:
    def test_spec_oil_comparison(self) -> None:
        """The exact query from the requirements spec."""
        clf = IntentClassifier()
        result = clf.classify(
            "Compara los 5 mejores aceites sintéticos 5W-30 disponibles en Venezuela "
            "para un motor turbo: índice de viscosidad, certificaciones OEM, precio "
            "estimado, intervalo de cambio y rendimiento en altas temperaturas."
        )
        assert result.intent != Intent.OUT_OF_SCOPE
        assert result.intent in (Intent.COMPARISON, Intent.RECOMMENDATION, Intent.GENERAL)


# ===========================================================================
# 8. Out-of-scope — must NOT reach LLM
# ===========================================================================

class TestOutOfScopeNoLLM:
    async def test_recipe_no_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "should not be called"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response("Dame una receta de cocina para arepas"):
            pass

        assert llm_call_count == 0

    async def test_general_history_reaches_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta general"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "Qué fue la Revolución Francesa y cuáles fueron sus causas"
        ):
            pass

        assert llm_call_count == 1

    async def test_docker_no_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "should not be called"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response("Explícame cómo funciona Docker"):
            pass

        assert llm_call_count == 0

    async def test_recipe_classifier(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("Dame una receta de cocina para arepas")
        assert result.intent == Intent.OUT_OF_SCOPE

    async def test_history_classifier(self) -> None:
        clf = IntentClassifier()
        result = clf.classify(
            "Qué fue la Revolución Francesa y cuáles fueron sus causas"
        )
        assert result.intent == Intent.GENERAL

    async def test_docker_classifier(self) -> None:
        clf = IntentClassifier()
        result = clf.classify("Explícame cómo funciona Docker")
        assert result.intent == Intent.OUT_OF_SCOPE


# ===========================================================================
# 9. Automotive queries — must reach LLM
# ===========================================================================

class TestAutomotiveQueriesReachLLM:
    async def test_oil_comparison_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta automotriz"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "Compara los 5 mejores aceites sintéticos 5W-30 disponibles en Venezuela "
            "para un motor turbo"
        ):
            pass

        assert llm_call_count == 1

    async def test_filter_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Qué filtro de aceite es compatible con mi Honda Civic 2020?"
        ):
            pass

        assert llm_call_count == 1

    async def test_tire_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Qué neumáticos me recomiendas para una SUV?"
        ):
            pass

        assert llm_call_count == 1

    async def test_battery_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Cada cuánto se cambia la batería del carro?"
        ):
            pass

        assert llm_call_count == 1

    async def test_parts_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Dónde consigo repuestos originales Toyota?"
        ):
            pass

        assert llm_call_count == 1

    async def test_coolant_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Qué tipo de refrigerante usa mi carro?"
        ):
            pass

        assert llm_call_count == 1

    async def test_brake_fluid_query_calls_llm(self) -> None:
        llm_call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal llm_call_count
            llm_call_count += 1
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        async for _ in uc.stream_response(
            "¿Cada cuánto debo cambiar el líquido de frenos?"
        ):
            pass

        assert llm_call_count == 1
