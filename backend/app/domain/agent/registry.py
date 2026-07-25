from app.domain.agent.capability import Capability, CapabilityContext
from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent


class CapabilityRegistry:
    """Registry of available agent capabilities."""

    def __init__(self, capabilities: list[Capability] | None = None) -> None:
        self._capabilities: list[Capability] = capabilities or []

    def register(self, capability: Capability) -> None:
        self._capabilities.append(capability)

    def get_capabilities_for_intent(self, intent: Intent) -> list[Capability]:
        return [
            cap
            for cap in self._capabilities
            if intent in cap.supported_intents
        ]

    def build_system_prompt(
        self,
        intent: Intent,
        context: CapabilityContext,
    ) -> str:
        enhancements: list[str] = []

        for cap in self.get_capabilities_for_intent(intent):
            enhancement = cap.get_system_prompt_enhancement(context)
            if enhancement:
                enhancements.append(enhancement)

        return "\n\n".join(enhancements)

    def build_context_enrichment(
        self,
        intent: Intent,
        context: CapabilityContext,
    ) -> str:
        enrichments: list[str] = []

        for cap in self.get_capabilities_for_intent(intent):
            enrichment = cap.get_context_enrichment(context)
            if enrichment:
                enrichments.append(enrichment)

        return "\n\n".join(enrichments)

    @property
    def available_capabilities(self) -> list[Capability]:
        return list(self._capabilities)

    def detect_missing_info(
        self,
        intent: Intent,
        context: CapabilityContext,
    ) -> list[FollowupField]:
        """Aggregate required fields that are missing from *context*.

        Iterates all capabilities registered for *intent* and collects
        every ``FollowupField`` they declare as absent.  Results are
        sorted by priority (1 = most critical first) with duplicates
        removed by field name.
        """
        seen: set[str] = set()
        missing: list[FollowupField] = []

        for cap in self.get_capabilities_for_intent(intent):
            for field in cap.get_required_fields(context):
                if field.name not in seen:
                    seen.add(field.name)
                    missing.append(field)

        return sorted(missing, key=lambda f: f.priority)
