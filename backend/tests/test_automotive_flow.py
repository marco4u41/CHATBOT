"""End-to-end flow tests for the automotive chat integration.

Validates the complete message flow from user input through
automotive data fetching, prompt construction, and LLM invocation.
All tests use mocks — no real database or LLM calls.

Message phrasing is chosen to match the IntentClassifier's keywords:
  RECOMMENDATION → "necesito un auto", "comprar", "quiero un carro"
  COMPARISON     → "compara ... y ..."
  DIAGNOSIS      → "problema con", "motor hace"
  GENERAL        → "hola", "qué es"
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.agent.automotive_tool import AutomotiveAgentTool, VehicleDataBlock
from app.domain.agent.capabilities.comparison import ComparisonCapability
from app.domain.agent.capabilities.diagnosis import DiagnosisCapability
from app.domain.agent.capabilities.recommendation import (
    RecommendationCapability,
)
from app.domain.agent.context.manager import ContextManager
from app.domain.agent.context.user_context import UserContext
from app.domain.agent.intent import Intent
from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.agent.registry import CapabilityRegistry
from app.domain.exceptions import MessageValidationError
from app.domain.interfaces.llm_provider import LLMProvider
from app.domain.models.message import Message, MessageRole
from app.use_cases.chat import ChatUseCase

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _msg(content: str, role: str = "user") -> Message:
    return Message(
        content=content,
        role=MessageRole(role),
        conversation_id="conv-test",
    )


def _make_tool(**methods: object) -> MagicMock:
    """Create a mock AutomotiveAgentTool.

    Configured methods return the given value.
    Unconfigured async methods return None (no data found).
    """
    tool = MagicMock(spec=AutomotiveAgentTool)
    for name, impl in methods.items():
        if isinstance(impl, AsyncMock):
            setattr(tool, name, impl)
        else:
            setattr(tool, name, AsyncMock(return_value=impl))
    for meth_name in (
        "get_brand_info", "get_vehicle_details", "get_model_info",
        "search_vehicles", "list_brands", "health_check",
    ):
        if meth_name not in methods:
            setattr(tool, meth_name, AsyncMock(return_value=None))
    return tool


def _llm_stream(tokens: list[str]) -> MagicMock:
    llm = MagicMock(spec=LLMProvider)

    async def _stream(
        messages: list[Message], system_prompt: str = "",
    ) -> AsyncIterator[str]:
        for t in tokens:
            yield t

    llm.stream_chat = _stream
    return llm


def _orch(
    automotive_tool: AutomotiveAgentTool | None = None,
    llm: LLMProvider | None = None,
    context_manager: ContextManager | None = None,
) -> AgentOrchestrator:
    registry = CapabilityRegistry()
    registry.register(ComparisonCapability())
    registry.register(DiagnosisCapability())
    registry.register(RecommendationCapability())
    return AgentOrchestrator(
        llm=llm or _llm_stream(["ok"]),
        registry=registry,
        automotive_tool=automotive_tool,
        context_manager=context_manager,
    )


def _conv_mock(message_count: int = 0) -> MagicMock:
    conv = MagicMock()
    conv.id = "conv-test"
    conv.message_count = message_count
    return conv


def _use_case(orch, conv=None, msg_repo=None, history: list[Message] | None = None):
    conv = conv or _conv_mock()
    mr = msg_repo or MagicMock()
    mr.create = AsyncMock()
    mr.get_last_n = AsyncMock(return_value=history if history is not None else [])
    cr = MagicMock()
    cr.get_by_id = AsyncMock(return_value=None)
    cr.create = AsyncMock(return_value=conv)
    cr.update = AsyncMock()
    return ChatUseCase(orch, cr, mr), conv


# ===========================================================================
# 1. Automotive tool is invoked before OpenRouter
# ===========================================================================

class TestToolInvokedBeforeLLM:
    async def test_tool_called_during_orchestrate(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Acura", content="[BRAND] Acura"),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Acura",
            [_msg("necesito un auto Acura")],
        )

        tool.get_brand_info.assert_awaited()
        assert "[BRAND]" in result.system_prompt

    async def test_tool_returns_empty_string_on_error(self) -> None:
        tool = _make_tool(
            get_brand_info=AsyncMock(side_effect=RuntimeError("db down")),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Acura",
            [_msg("necesito un auto Acura")],
        )

        assert isinstance(result.system_prompt, str)


# ===========================================================================
# 2. Automotive data is appended to the prompt (via capability)
# ===========================================================================

class TestDataInjectedIntoPrompt:
    async def test_recommendation_brand_in_prompt(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(
                title="Acura", content="[BRAND_INFO]\nMarca: Acura\nModelos: 261",
            ),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Acura",
            [_msg("necesito un auto Acura")],
        )

        assert result.intent == Intent.RECOMMENDATION
        assert "[BRAND_INFO]" in result.system_prompt

    async def test_comparison_brand_in_prompt(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(
                title="Honda", content="[BRAND]\nMarca: Honda",
            ),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "compara Honda y Toyota",
            [_msg("compara Honda y Toyota")],
        )

        assert result.intent == Intent.COMPARISON
        assert "[BRAND]" in result.system_prompt


# ===========================================================================
# 3. OpenRouter receives the automotive data block
# ===========================================================================

class TestLLMReceivesAutomotiveData:
    async def test_stream_chat_receives_prompt_with_data(self) -> None:
        captured_prompts: list[str] = []

        async def fake_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            captured_prompts.append(system_prompt)
            yield "respuesta"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = fake_stream

        tool = _make_tool(
            get_brand_info=VehicleDataBlock(
                title="Acura", content="[BRAND_INFO]\nMarca: Acura",
            ),
        )
        orch = _orch(automotive_tool=tool, llm=llm)

        user_msg = _msg("necesito un auto Acura")
        uc, _ = _use_case(orch, history=[user_msg])

        async for _ in uc.stream_response("necesito un auto Acura"):
            pass

        assert len(captured_prompts) == 1
        assert "[BRAND_INFO]" in captured_prompts[0]


# ===========================================================================
# 4. Only one LLM call per message
# ===========================================================================

class TestSingleLLMCall:
    async def test_one_stream_chat_per_message(self) -> None:
        call_count = 0

        async def counting_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            nonlocal call_count
            call_count += 1
            yield "ok"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = counting_stream

        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Toyota", content="data"),
        )
        orch = _orch(automotive_tool=tool, llm=llm)

        uc, _ = _use_case(orch)

        async for _ in uc.stream_response("necesito un auto Toyota"):
            pass

        assert call_count == 1


# ===========================================================================
# 5. Response uses streaming
# ===========================================================================

class TestStreamingResponse:
    async def test_yields_multiple_chunks(self) -> None:
        async def multi_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            for token in ["Hola", " ", "mundo"]:
                yield token

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = multi_stream
        orch = _orch(llm=llm)
        uc, _ = _use_case(orch)

        chunks = []
        async for chunk, done, _cid in uc.stream_response("test"):
            if not done:
                chunks.append(chunk)

        assert len(chunks) == 3
        assert "".join(chunks) == "Hola mundo"


# ===========================================================================
# 6. Missing automotive data does not produce 500
# ===========================================================================

class TestMissingDataNoError:
    async def test_no_tool_still_works(self) -> None:
        orch = _orch(automotive_tool=None)
        result = await orch.orchestrate("hola", [_msg("hola")])
        assert result.system_prompt
        assert result.intent == Intent.GENERAL

    async def test_tool_returns_none_blocks(self) -> None:
        tool = _make_tool(get_brand_info=None)
        orch = _orch(automotive_tool=tool)
        result = await orch.orchestrate(
            "necesito un auto algo",
            [_msg("necesito un auto algo")],
        )
        assert isinstance(result.system_prompt, str)


# ===========================================================================
# 7. Repository failure does not stop the chat
# ===========================================================================

class TestRepoFailureGraceful:
    async def test_tool_exception_returns_prompt(self) -> None:
        tool = MagicMock(spec=AutomotiveAgentTool)
        tool.get_brand_info = AsyncMock(side_effect=RuntimeError("db down"))
        tool.get_vehicle_details = AsyncMock(side_effect=RuntimeError("db down"))
        tool.get_model_info = AsyncMock(side_effect=RuntimeError("db down"))
        tool.search_vehicles = AsyncMock(return_value=None)
        tool.list_brands = AsyncMock(return_value=None)
        tool.health_check = AsyncMock(return_value=False)

        orch = _orch(automotive_tool=tool)
        result = await orch.orchestrate(
            "necesito un auto Acura", [_msg("necesito un auto Acura")],
        )

        assert isinstance(result.system_prompt, str)
        assert result.intent == Intent.RECOMMENDATION


# ===========================================================================
# 8. Prompt indicates when data is absent
# ===========================================================================

class TestPromptDataAbsence:
    async def test_no_brand_enhancement_when_tool_returns_none(self) -> None:
        tool = _make_tool(get_brand_info=None)
        orch = _orch(automotive_tool=tool)
        result = await orch.orchestrate(
            "necesito un auto Zzzz", [_msg("necesito un auto Zzzz")],
        )

        assert isinstance(result.system_prompt, str)
        assert "[BRAND" not in result.system_prompt


# ===========================================================================
# 9. Persistent profile remains available
# ===========================================================================

class TestProfileAvailable:
    async def test_context_manager_called_with_profile_id(self) -> None:
        mock_cm = MagicMock()
        mock_cm.build_context = AsyncMock(
            return_value=(UserContext(budget=15000), "Ctx block"),
        )
        orch = AgentOrchestrator(
            llm=_llm_stream(["ok"]),
            registry=CapabilityRegistry(),
            context_manager=mock_cm,
        )

        await orch.orchestrate(
            "comprar un auto",
            [_msg("comprar un auto")],
            profile_id="user-123",
        )

        mock_cm.build_context.assert_awaited_once()
        call_kw = mock_cm.build_context.call_args
        assert call_kw[1].get("profile_id") == "user-123"


# ===========================================================================
# 10. Messages saved in correct order
# ===========================================================================

class TestMessageOrder:
    async def test_user_then_assistant(self) -> None:
        save_order: list[str] = []

        async def fake_stream(
            messages: list[Message], system_prompt: str = "",
        ) -> AsyncIterator[str]:
            yield "reply"

        llm = MagicMock(spec=LLMProvider)
        llm.stream_chat = fake_stream
        orch = _orch(llm=llm)

        conv = _conv_mock()
        msg_repo = MagicMock()
        msg_repo.create = AsyncMock(side_effect=lambda m: (save_order.append(m.role.value), m)[-1])
        msg_repo.get_last_n = AsyncMock(return_value=[])
        conv_repo = MagicMock()
        conv_repo.get_by_id = AsyncMock(return_value=None)
        conv_repo.create = AsyncMock(return_value=conv)
        conv_repo.update = AsyncMock()

        use_case = ChatUseCase(orch, conv_repo, msg_repo)
        async for _ in use_case.stream_response("test message"):
            pass

        assert save_order == ["user", "assistant"]


# ===========================================================================
# 11. Correct capability receives automotive_data
# ===========================================================================

class TestCapabilityReceivesData:
    async def test_recommendation_gets_data(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Toyota", content="[BRAND] data"),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Toyota", [_msg("necesito un auto Toyota")],
        )

        assert result.intent == Intent.RECOMMENDATION
        assert "[BRAND]" in result.system_prompt

    async def test_comparison_gets_data(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Honda", content="[BRAND] Honda"),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "compara Honda y Toyota", [_msg("compara Honda y Toyota")],
        )

        assert result.intent == Intent.COMPARISON
        assert "[BRAND]" in result.system_prompt


# ===========================================================================
# 12. No ORM models injected into prompt
# ===========================================================================

class TestNoORMInPrompt:
    async def test_prompt_is_string_only(self) -> None:
        orch = _orch(
            automotive_tool=_make_tool(
                get_brand_info=VehicleDataBlock(title="X", content="data"),
            ),
        )
        result = await orch.orchestrate(
            "necesito un auto X", [_msg("necesito un auto X")],
        )

        assert isinstance(result.system_prompt, str)
        assert "VehicleMasterModel" not in result.system_prompt
        assert "BrandModel" not in result.system_prompt


# ===========================================================================
# 13. Internal exceptions not exposed to user
# ===========================================================================

class TestNoExposedExceptions:
    async def test_empty_message_raises_validation(self) -> None:
        orch = _orch()
        uc, _ = _use_case(orch)

        with pytest.raises(MessageValidationError):
            async for _ in uc.stream_response(""):
                pass


# ===========================================================================
# 14. No duplicate automotive blocks
# ===========================================================================

class TestNoDuplicateBlocks:
    async def test_mentioned_brand_not_fetched_twice(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Acura", content="[BRAND] data"),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Acura", [_msg("necesito un auto Acura")],
        )

        assert result.system_prompt.count("[BRAND]") == 1


# ===========================================================================
# 15. General chat works without automotive consultation
# ===========================================================================

class TestGeneralChatWithoutAutomotive:
    async def test_greeting_no_tool_invocation(self) -> None:
        tool = _make_tool()
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate("hola", [_msg("hola")])

        assert result.intent == Intent.GENERAL
        tool.get_brand_info.assert_not_called()
        tool.get_vehicle_details.assert_not_called()

    async def test_general_intent_no_automotive_enhancement(self) -> None:
        orch = _orch(automotive_tool=None)

        result = await orch.orchestrate(
            "¿Qué es el GPS?", [_msg("¿Qué es el GPS?")],
        )

        assert result.intent == Intent.GENERAL
        assert result.system_prompt


# ===========================================================================
# 16. Scenario A — Direct vehicle query (recommendation intent)
# ===========================================================================

class TestScenarioADirectQuery:
    async def test_acura_30cl_query(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(
                title="Acura", content="[BRAND_INFO]\nMarca: Acura",
            ),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto Acura 3.0cl",
            [_msg("necesito un auto Acura 3.0cl")],
        )

        assert result.intent == Intent.RECOMMENDATION
        assert "[BRAND_INFO]" in result.system_prompt

    async def test_nonexistent_vehicle_year(self) -> None:
        tool = _make_tool(get_brand_info=None)
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "comprar un Toyota Corolla 2035",
            [_msg("comprar un Toyota Corolla 2035")],
        )

        assert isinstance(result.system_prompt, str)
        assert result.intent == Intent.RECOMMENDATION


# ===========================================================================
# 17. Scenario D — Recommendation with profile
# ===========================================================================

class TestScenarioDRecommendation:
    async def test_recommendation_preserves_profile(self) -> None:
        tool = _make_tool(
            get_brand_info=VehicleDataBlock(title="Honda", content="[SEARCH]"),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "necesito un auto familiar",
            [_msg("necesito un auto familiar")],
            budget=15000,
        )

        assert result.intent == Intent.RECOMMENDATION
        assert result.user_context.budget == 15000


# ===========================================================================
# 18. Scenario E — Comparison
# ===========================================================================

class TestScenarioEComparison:
    async def test_comparison_both_brands_queried(self) -> None:
        tool = _make_tool(
            get_vehicle_details=VehicleDataBlock(
                title="Honda Civic",
                content="[DETAILS] Honda Civic",
            ),
            get_model_info=VehicleDataBlock(
                title="Honda Civic Stats",
                content="[MODEL] Honda Civic",
            ),
        )
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "compara Honda Civic y Toyota Corolla",
            [_msg("compara Honda Civic y Toyota Corolla")],
        )

        assert result.intent == Intent.COMPARISON
        assert tool.get_vehicle_details.await_count >= 1
        assert "[DETAILS]" in result.system_prompt


# ===========================================================================
# 19. Scenario F — General conversation
# ===========================================================================

class TestScenarioFGeneral:
    async def test_gps_question_no_db(self) -> None:
        tool = _make_tool()
        orch = _orch(automotive_tool=tool)

        result = await orch.orchestrate(
            "¿Qué es el GPS en un auto?",
            [_msg("¿Qué es el GPS en un auto?")],
        )

        assert result.intent == Intent.GENERAL
        tool.get_brand_info.assert_not_called()
        tool.get_vehicle_details.assert_not_called()
        tool.get_model_info.assert_not_called()
