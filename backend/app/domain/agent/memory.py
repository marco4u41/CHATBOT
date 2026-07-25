from __future__ import annotations

import logging

from app.domain.agent.context.extractor import ContextExtractor
from app.domain.agent.context.user_context import UserContext
from app.domain.models.message import Message

logger = logging.getLogger(__name__)


class ConversationMemoryService:
    """Extracts and persists cross-conversation summaries.

    Uses ContextExtractor to pull structured data from conversation
    messages and formats a brief summary for context injection.
    Stores nothing itself — delegates persistence to ConversationRepository.
    """

    def __init__(self, extractor: ContextExtractor | None = None) -> None:
        self._extractor = extractor or ContextExtractor()

    def generate_summary(self, messages: list[Message]) -> str:
        """Generate a brief summary from conversation messages.

        Extracts vehicles, budget, usage, and key topics to produce
        a compact one-line summary suitable for prompt injection.
        """
        if not messages:
            return ""

        ctx: UserContext = self._extractor.extract(messages)

        parts: list[str] = []

        if ctx.vehicles:
            vehicles_str = ", ".join(
                f"{v.brand} {v.model}".strip()
                for v in ctx.vehicles[:3]
            )
            parts.append(f"Vehículos: {vehicles_str}")

        if ctx.budget is not None:
            parts.append(f"Presupuesto: ${ctx.budget:,.0f}")

        if ctx.usage:
            parts.append(f"Uso: {ctx.usage}")

        if ctx.terrain:
            parts.append(f"Terreno: {ctx.terrain}")

        if ctx.mentioned_brands:
            brands_str = ", ".join(ctx.mentioned_brands[:5])
            parts.append(f"Marcas: {brands_str}")

        if ctx.has_diagnosed_issue and ctx.diagnosis_symptoms:
            symptoms_str = ", ".join(ctx.diagnosis_symptoms[:5])
            parts.append(f"Problema: {symptoms_str}")

        if ctx.preferences:
            prefs_str = ", ".join(ctx.preferences[:5])
            parts.append(f"Preferencias: {prefs_str}")

        summary = "; ".join(parts)

        logger.debug(
            "Generated summary: %s", summary[:100] if summary else "(empty)",
        )
        return summary
