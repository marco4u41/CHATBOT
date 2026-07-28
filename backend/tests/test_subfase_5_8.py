from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.domain.agent.context.extractor import ContextExtractor
from app.domain.agent.context.user_context import UserContext
from app.domain.agent.profile.updater import ProfileUpdater
from app.domain.models.message import Message, MessageRole
from app.domain.models.user_profile import UserProfile

# ---------------------------------------------------------------------------
# Subfase 5.8 — ContextExtractor: preferred brand detection
# ---------------------------------------------------------------------------

class TestPreferredBrandExtraction:
    def test_me_gusta_pattern(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="me gusta Toyota",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "toyota" in ctx.preferred_brands

    def test_mi_marca_favorita_pattern(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="mi marca favorita es Honda",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "honda" in ctx.preferred_brands

    def test_siempre_con_pattern(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="siempre compro Ford",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "ford" in ctx.preferred_brands

    def test_prefiero_pattern(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="prefiero Chevrolet",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "chevrolet" in ctx.preferred_brands

    def test_unknown_brand_not_added(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="me gusta Ferrari",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "ferrari" not in ctx.preferred_brands

    def test_multiple_preferred_brands(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="me gusta Toyota y Honda",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert "toyota" in ctx.preferred_brands

    def test_preferred_brands_deduplicated(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="me gusta Toyota y siempre compro Toyota",
                role=MessageRole.USER,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert ctx.preferred_brands.count("toyota") == 1

    def test_assistant_messages_ignored(self) -> None:
        ext = ContextExtractor()
        messages = [
            Message(
                content="me gusta Honda",
                role=MessageRole.ASSISTANT,
                conversation_id="c1",
            ),
        ]
        ctx = ext.extract(messages)
        assert ctx.preferred_brands == []

    def test_empty_messages(self) -> None:
        ext = ContextExtractor()
        ctx = ext.extract([])
        assert ctx.preferred_brands == []


# ---------------------------------------------------------------------------
# Subfase 5.8 — UserContext preferred_brands field
# ---------------------------------------------------------------------------

class TestUserContextPreferredBrands:
    def test_default_empty(self) -> None:
        ctx = UserContext()
        assert ctx.preferred_brands == []

    def test_is_empty_false_when_preferred(self) -> None:
        ctx = UserContext(preferred_brands=["toyota"])
        assert not ctx.is_empty()

    def test_to_compact_dict_includes_preferred(self) -> None:
        ctx = UserContext(preferred_brands=["toyota", "honda"])
        d = ctx.to_compact_dict()
        assert "preferred_brands" in d
        assert "toyota" in d["preferred_brands"]

    def test_to_compact_dict_excludes_empty_preferred(self) -> None:
        ctx = UserContext()
        d = ctx.to_compact_dict()
        assert "preferred_brands" not in d


# ---------------------------------------------------------------------------
# Subfase 5.8 — UserProfile preferred_brands field
# ---------------------------------------------------------------------------

class TestUserProfilePreferredBrands:
    def test_default_empty(self) -> None:
        profile = UserProfile()
        assert profile.preferred_brands == []

    def test_is_empty_false_when_preferred(self) -> None:
        profile = UserProfile(preferred_brands=["toyota"])
        assert not profile.is_empty()

    def test_settable(self) -> None:
        profile = UserProfile(preferred_brands=["toyota", "honda"])
        assert profile.preferred_brands == ["toyota", "honda"]


# ---------------------------------------------------------------------------
# Subfase 5.8 — ProfileUpdater merge
# ---------------------------------------------------------------------------

class TestProfileUpdaterPreferredBrands:
    def test_merge_adds_preferred_brands(self) -> None:
        updater = ProfileUpdater()
        current = UserProfile()
        extracted = UserProfile(preferred_brands=["toyota", "honda"])
        merged = updater.merge(current, extracted)
        assert merged.preferred_brands == ["toyota", "honda"]

    def test_merge_keeps_existing_preferred(self) -> None:
        updater = ProfileUpdater()
        current = UserProfile(preferred_brands=["ford"])
        extracted = UserProfile(preferred_brands=["toyota"])
        merged = updater.merge(current, extracted)
        assert "ford" in merged.preferred_brands
        assert "toyota" in merged.preferred_brands

    def test_merge_deduplicates_preferred(self) -> None:
        updater = ProfileUpdater()
        current = UserProfile(preferred_brands=["toyota"])
        extracted = UserProfile(preferred_brands=["toyota", "honda"])
        merged = updater.merge(current, extracted)
        assert merged.preferred_brands.count("toyota") == 1
        assert len(merged.preferred_brands) == 2


# ---------------------------------------------------------------------------
# Subfase 5.8 — ContextManager integration
# ---------------------------------------------------------------------------

class TestContextManagerPreferredBrands:
    @pytest.mark.asyncio
    async def test_preferred_brands_in_context_block(self) -> None:
        from app.domain.agent.context.manager import ContextManager

        mock_repo = AsyncMock()
        mock_repo.get_recent.return_value = []

        mgr = ContextManager(conversation_repo=mock_repo)
        messages = [
            Message(
                content="me gusta Toyota y tengo $25000",
                role=MessageRole.USER,
                conversation_id="test",
            ),
        ]
        ctx, context_block = await mgr.build_context(messages)
        assert "toyota" in ctx.preferred_brands
        assert "Marcas favoritas" in context_block
        assert "toyota" in context_block.lower()

    @pytest.mark.asyncio
    async def test_preferred_not_duplicate_with_mentioned(self) -> None:
        from app.domain.agent.context.manager import ContextManager

        mock_repo = AsyncMock()
        mock_repo.get_recent.return_value = []

        mgr = ContextManager(conversation_repo=mock_repo)
        messages = [
            Message(
                content="tengo un Toyota y me gusta Toyota",
                role=MessageRole.USER,
                conversation_id="test",
            ),
        ]
        ctx, _ = await mgr.build_context(messages)
        assert "toyota" in ctx.mentioned_brands
        assert "toyota" in ctx.preferred_brands


class TestRecommendationContextIsolation:
    @staticmethod
    def _message(content: str, conversation_id: str = "conversation-b") -> Message:
        return Message(
            content=content,
            role=MessageRole.USER,
            conversation_id=conversation_id,
        )

    def test_any_brand_clears_brand_and_extracts_current_filters(self) -> None:
        ctx = ContextExtractor().extract([
            self._message("Prefiero Subaru"),
            self._message(
                "¿Puedes recomendarme un SUV para la ciudad, a gasolina, "
                "por menos de 25.000 dólares, de cualquier marca?"
            ),
        ])

        assert ctx.mentioned_brands == []
        assert ctx.preferred_brands == []
        assert ctx.manufacturer_cleared is True
        assert ctx.body_type == "suv"
        assert ctx.fuel_preference == "gas"
        assert ctx.budget == 25_000
        assert ctx.usage == "urbano"

    @pytest.mark.parametrize(
        "message",
        ["en realidad, cualquier marca", "sin preferencia de marca"],
    )
    def test_explicit_no_brand_phrases_clear_toyota(self, message: str) -> None:
        ctx = ContextExtractor().extract([
            self._message("prefiero Toyota"),
            self._message(message),
        ])

        assert ctx.manufacturer_cleared is True
        assert ctx.mentioned_brands == []
        assert ctx.preferred_brands == []

    def test_current_message_overwrites_budget_and_body_type(self) -> None:
        ctx = ContextExtractor().extract([
            self._message("Busco un sedán por 40.000 dólares"),
            self._message("Ahora quiero un SUV por 25.000 dólares"),
        ])

        assert ctx.body_type == "suv"
        assert ctx.budget == 25_000

    @pytest.mark.asyncio
    async def test_new_conversation_ignores_mentioned_brand_from_profile(self) -> None:
        from app.domain.agent.context.manager import ContextManager

        stale_profile = UserProfile(
            id="user-1",
            mentioned_brands=["subaru"],
            budget_usd=40_000,
            usage="offroad",
        )
        profile_manager = AsyncMock()
        profile_manager.get_profile.return_value = stale_profile
        profile_manager.update_profile.return_value = stale_profile
        manager = ContextManager(profile_manager=profile_manager)

        ctx, _ = await manager.build_context(
            [self._message(
                "Recomiéndame un SUV de cualquier marca por 25.000 dólares"
            )],
            profile_id="user-1",
            conversation_id="conversation-b",
            user_id="user-1",
        )

        assert ctx.mentioned_brands == []
        assert ctx.manufacturer_cleared is True
        assert ctx.budget == 25_000
        assert ctx.body_type == "suv"
        assert ctx.usage == ""
