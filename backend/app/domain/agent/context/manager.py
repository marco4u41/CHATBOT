import logging

from app.domain.agent.context.extractor import ContextExtractor
from app.domain.agent.context.user_context import UserContext
from app.domain.agent.memory import ConversationMemoryService
from app.domain.agent.profile.manager import UserProfileManager
from app.domain.interfaces.repository import ConversationRepository
from app.domain.models.message import Message
from app.domain.models.user_profile import UserProfile
from app.prompts.loader import render_prompt

logger = logging.getLogger(__name__)


class ContextManager:
    """Builds a compact context block by combining persistent user profile
    data with freshly extracted conversation history and cross-conversation
    memory summaries.

    Flow:
    1. Load user profile from DB (persistent memory)
    2. Extract new data from recent messages (gap filling)
    3. Merge active-conversation data with non-conflicting global preferences
    4. Save durable preferences back to DB
    5. Render the active-conversation context block
    """

    def __init__(
        self,
        profile_manager: UserProfileManager | None = None,
        extractor: ContextExtractor | None = None,
        conversation_repo: ConversationRepository | None = None,
        memory_service: ConversationMemoryService | None = None,
    ) -> None:
        self._profile_manager = profile_manager
        self._extractor = extractor or ContextExtractor()
        self._conversation_repo = conversation_repo
        self._memory_service = memory_service or ConversationMemoryService(
            self._extractor,
        )

    async def build_context(
        self,
        messages: list[Message],
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
        profile_id: str | None = None,
        exclude_conversation_id: str | None = None,
        conversation_id: str | None = None,
        user_id: str | None = None,
    ) -> tuple[UserContext, str]:
        """Extract context from profile + history and render a compact
        prompt block. Returns (user_context, context_block_text).

        Args:
            exclude_conversation_id: When loading recent summaries, skip
                this conversation (the current one being processed).
        """

        if self._profile_manager is not None:
            profile = await self._profile_manager.get_profile(profile_id)
        else:
            profile = UserProfile()

        extracted = self._extractor.extract(
            messages,
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
        )
        inherited = self._extractor.extract(
            messages[:-1],
            budget=None,
            terrain=None,
            engine_type=None,
        ) if messages else UserContext()
        current = self._extractor.extract(
            messages[-1:],
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
        ) if messages else UserContext()

        extracted_profile = self._context_to_profile(extracted, profile.id)

        if self._profile_manager is not None:
            merged_profile = await self._profile_manager.update_profile(
                extracted_profile,
                profile_id,
            )
        else:
            merged_profile = profile

        user_context = self._profile_to_context(merged_profile, extracted)

        # Conversation summaries are intentionally not injected here. They
        # contain query-specific constraints (brand, budget, symptoms, etc.)
        # and are not global user preferences.
        recent_summaries: list[str] = []

        logger.info(
            "Recommendation context conversation_id=%s user_id=%s "
            "extracted=%s inherited=%s final=%s",
            conversation_id or exclude_conversation_id or "-",
            user_id or profile_id or "-",
            current.to_compact_dict(),
            inherited.to_compact_dict(),
            user_context.to_compact_dict(),
        )

        if user_context.is_empty() and not recent_summaries:
            return user_context, ""

        context_block = render_prompt(
            "agent_context_block",
            ctx=user_context.to_compact_dict(),
            vehicles=user_context.vehicles,
            brands=user_context.mentioned_brands,
            preferred_brands=user_context.preferred_brands,
            budget=user_context.budget,
            terrain=user_context.terrain,
            engine_type=user_context.engine_type,
            usage=user_context.usage,
            preferences=user_context.preferences,
            has_issue=user_context.has_diagnosed_issue,
            symptoms=user_context.diagnosis_symptoms,
            fuel_preference=user_context.fuel_preference,
            family_size=user_context.family_size,
            recent_summaries=recent_summaries,
        )

        logger.info(
            "Context built: vehicle=%s, budget=%s, usage=%s, prefs=%d, summaries=%d",
            user_context.vehicles[0].brand if user_context.vehicles else "-",
            user_context.budget,
            user_context.usage,
            len(user_context.preferences),
            len(recent_summaries),
        )

        return user_context, context_block

    async def update_conversation_summary(
        self,
        messages: list[Message],
        conversation_id: str,
    ) -> str:
        """Generate and persist a summary for a conversation.

        Returns the generated summary string.
        """
        summary = self._memory_service.generate_summary(messages)

        if summary and self._conversation_repo is not None:
            conversation = await self._conversation_repo.get_by_id(
                conversation_id,
            )
            if conversation is not None:
                conversation.summary = summary
                await self._conversation_repo.update(conversation)
                logger.info(
                    "Summary updated for conversation %s: %s",
                    conversation_id,
                    summary[:80],
                )

        return summary

    async def _load_recent_summaries(
        self,
        exclude_conversation_id: str | None = None,
    ) -> list[str]:
        """Load brief summaries from recent conversations."""
        if self._conversation_repo is None:
            return []

        try:
            recent = await self._conversation_repo.get_recent(limit=5)
            summaries: list[str] = []
            for conv in recent:
                if conv.id == exclude_conversation_id:
                    continue
                if conv.summary:
                    summaries.append(conv.summary)
            return summaries
        except Exception:
            logger.debug("Failed to load recent summaries", exc_info=True)
            return []

    @staticmethod
    def _context_to_profile(
        ctx: UserContext,
        profile_id: str,
    ) -> UserProfile:
        # Only durable, explicitly expressed preferences belong in the global
        # profile. Query filters and mentioned vehicles stay conversation-local.
        return UserProfile(
            id=profile_id,
            preferences=ctx.preferences,
            preferred_brands=ctx.preferred_brands,
        )

    @staticmethod
    def _profile_to_context(
        profile: UserProfile,
        extracted: UserContext,
    ) -> UserContext:
        prefs = list(dict.fromkeys(profile.preferences + extracted.preferences))
        preferred = (
            []
            if extracted.manufacturer_cleared
            else list(dict.fromkeys(
                extracted.preferred_brands + profile.preferred_brands,
            ))
        )

        return UserContext(
            vehicles=list(extracted.vehicles),
            mentioned_brands=list(extracted.mentioned_brands),
            budget=extracted.budget,
            terrain=extracted.terrain,
            engine_type=extracted.engine_type,
            usage=extracted.usage,
            preferences=prefs,
            has_diagnosed_issue=extracted.has_diagnosed_issue,
            diagnosis_symptoms=extracted.diagnosis_symptoms,
            fuel_preference=extracted.fuel_preference,
            body_type=extracted.body_type,
            manufacturer_cleared=extracted.manufacturer_cleared,
            family_size=profile.family_size,
            preferred_brands=preferred,
        )
