from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent


@dataclass
class CapabilityContext:
    user_message: str
    conversation_history: list[dict[str, str]] = field(default_factory=list)
    budget: float | None = None
    terrain: str | None = None
    engine_type: str | None = None
    automotive_data: str = ""
    vehicles_count: int = 0
    has_symptoms: bool = False
    usage: str = ""
    focus: str = "all"


class Capability(ABC):
    """Base class for agent capabilities."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this capability."""
        ...

    @property
    @abstractmethod
    def supported_intents(self) -> list[Intent]:
        """Which intents this capability handles."""
        ...

    @abstractmethod
    def get_system_prompt_enhancement(self, context: CapabilityContext) -> str:
        """Returns additional system prompt text to inject when this capability is active."""
        ...

    def get_context_enrichment(self, context: CapabilityContext) -> str:
        """Optional: Returns enriched user message context. Default returns empty."""
        return ""

    def should_stream(self) -> bool:
        """Whether this capability's responses should be streamed. Default True."""
        return True

    def get_required_fields(
        self, context: CapabilityContext,
    ) -> list[FollowupField]:
        """Fields this capability needs to work optimally.

        Returns a (possibly empty) list of fields that are *missing* from
        *context*.  The orchestrator uses this to inject follow-up
        instructions into the system prompt so the LLM asks targeted
        questions instead of guessing.
        """
        return []
