from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.models.message import Message, MessageRole
from app.domain.models.vehicle import Vehicle


class DiagnosisUseCase:
    def __init__(self, orchestrator: AgentOrchestrator) -> None:
        self._orchestrator = orchestrator

    async def diagnose(
        self,
        vehicle: Vehicle,
        symptoms: list[str],
        category: str | None = None,
        *,
        profile_id: str | None = None,
    ) -> str:
        vehicle_desc = f"{vehicle.brand} {vehicle.model}"
        if vehicle.year:
            vehicle_desc += f" {vehicle.year}"
        if vehicle.engine:
            vehicle_desc += f" con motor {vehicle.engine}"

        symptoms_text = ", ".join(symptoms)
        message_content = (
            f"Tengo un problema con mi {vehicle_desc}. "
            f"Los síntomas son: {symptoms_text}."
        )
        if category:
            message_content += f" Categoría del problema: {category}."

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
            profile_id=profile_id,
        )

        system_prompt = result.system_prompt
        if result.context_enrichment:
            system_prompt = f"{system_prompt}\n\n{result.context_enrichment}"

        return await self._orchestrator.llm.chat(history, system_prompt)
