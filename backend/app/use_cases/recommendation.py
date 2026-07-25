from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.models.message import Message, MessageRole


class RecommendationUseCase:
    def __init__(self, orchestrator: AgentOrchestrator) -> None:
        self._orchestrator = orchestrator

    async def recommend(
        self,
        budget_usd: float,
        usage: str,
        priorities: list[str] | None = None,
        *,
        profile_id: str | None = None,
    ) -> str:
        parts = [
            f"Necesito una recomendación de auto con presupuesto de ${budget_usd:,.0f} USD",
            f"Uso principal: {usage}",
        ]
        if priorities:
            parts.append(f"Prioridades: {', '.join(priorities)}")

        message_content = ". ".join(parts) + "."

        history = [
            Message(
                content=message_content,
                role=MessageRole.USER,
                conversation_id="",
            ),
        ]

        result = await self._orchestrator.orchestrate(
            message_content,
            history,
            budget=budget_usd,
            usage=usage,
            profile_id=profile_id,
        )

        system_prompt = result.system_prompt
        if result.context_enrichment:
            system_prompt = f"{system_prompt}\n\n{result.context_enrichment}"

        return await self._orchestrator.llm.chat(history, system_prompt)
