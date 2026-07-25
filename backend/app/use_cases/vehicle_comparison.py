from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.models.message import Message, MessageRole
from app.domain.models.vehicle import Vehicle


class VehicleComparisonUseCase:
    def __init__(self, orchestrator: AgentOrchestrator) -> None:
        self._orchestrator = orchestrator

    async def compare(
        self,
        vehicles: list[Vehicle],
        focus: str = "all",
        *,
        profile_id: str | None = None,
    ) -> str:
        vehicle_names = [
            f"{v.brand} {v.model}" + (f" {v.year}" if v.year else "")
            for v in vehicles
        ]

        if len(vehicle_names) == 2:
            message_content = (
                f"Quiero comparar el {vehicle_names[0]} con el {vehicle_names[1]}."
            )
        else:
            vehicles_str = ", ".join(vehicle_names[:-1]) + f" y {vehicle_names[-1]}"
            message_content = f"Quiero comparar los siguientes vehículos: {vehicles_str}."

        if focus and focus != "all":
            focus_labels = {
                "performance": "rendimiento/potencia",
                "economy": "economía/consumo",
                "safety": "seguridad",
                "value": "relación precio-valor",
            }
            focus_label = focus_labels.get(focus, focus)
            message_content += f" Enfocar el análisis en {focus_label}."

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
            focus=focus,
        )

        system_prompt = result.system_prompt
        if result.context_enrichment:
            system_prompt = f"{system_prompt}\n\n{result.context_enrichment}"

        return await self._orchestrator.llm.chat(history, system_prompt)
