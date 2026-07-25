from app.domain.agent.capability import Capability, CapabilityContext
from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent
from app.prompts.loader import render_prompt

_FOCUS_GUIDANCE: dict[str, str] = {
    "performance": (
        "ENFOQUE EN RENDIMIENTO: Prioriza el análisis de motor (caballos de "
        "fuerza, torque, aceleración 0-100), transmisión, peso, y capacidad "
        "de arrastre. Presenta especificaciones de rendimiento en tabla."
    ),
    "economy": (
        "ENFOQUE EN ECONOMÍA: Prioriza consumo de combustible (MPG/km por "
        "litro), costo de mantenimiento anual, depreciación, seguro, y "
        "valor de reventa. Incluye estimación de costos a 5 años."
    ),
    "safety": (
        "ENFOQUE EN SEGURIDAD: Prioriza calificaciones de seguridad (NHTSA, "
        "IIHS), airbags, sistemas de asistencia al conductor (ADAS), "
        "estructura del cuerpo, y tecnología de frenado."
    ),
    "value": (
        "ENFOQUE EN RELACIÓN PRECIO-VALOR: Prioriza precio vs. "
        "especificaciones, garantía incluida, costo de propiedad total, "
        "y calificaciones de confiabilidad a largo plazo."
    ),
    "comfort": (
        "ENFOQUE EN CONFORT: Prioriza espacio interior, calidad de "
        "materiales, tecnología a bordo (pantalla, conectividad), "
        "aislamiento acústico, y comodidad en asientos."
    ),
}


class ComparisonCapability(Capability):
    """Capability for vehicle comparison requests."""

    @property
    def name(self) -> str:
        return "vehicle_comparison"

    @property
    def supported_intents(self) -> list[Intent]:
        return [Intent.COMPARISON]

    def get_system_prompt_enhancement(self, context: CapabilityContext) -> str:
        base = render_prompt("agent_comparison_enhancement")

        sections: list[str] = [base]

        if context.automotive_data:
            sections.append(
                "DATOS AUTOMOTRICES REALES DE LA BASE DE DATOS:\n"
                "Cada vehículo en esta comparación tiene datos reales del mercado "
                "adjuntos. Utiliza exclusivamente esta información para "
                "especificaciones, precios y estadísticas:\n\n"
                f"{context.automotive_data}\n\n"
                "REGLAS ANTI-ALUCINACIÓN:\n"
                "- Estos datos son estadísticas históricas de listings, NO "
                "inventario en tiempo real ni disponibilidad actual.\n"
                "- NO presentes los precios como ofertas vigentes ni como "
                "disponibilidad confirmada.\n"
                "- Si la información de un vehículo no está en los datos, "
                "indica explícitamente qué datos faltan, NO inventes "
                "especificaciones ni precios.\n"
                "- Cuando uses datos históricos, menciona que son "
                "referencias basadas en datos de mercado anteriores.\n"
                "- Para cada categoría de comparación, cita los datos "
                "específicos de cada vehículo."
            )

        if context.focus and context.focus != "all":
            guidance = _FOCUS_GUIDANCE.get(context.focus)
            if guidance:
                sections.append(guidance)

        return "\n\n".join(sections)

    def get_context_enrichment(self, context: CapabilityContext) -> str:
        parts = [
            "El usuario está solicitando una comparación de vehículos.",
        ]

        if context.vehicles_count >= 2:
            parts.append(
                f"Se están comparando {context.vehicles_count} vehículos. "
                "Proporciona una tabla comparativa detallada con datos reales."
            )

        if context.focus and context.focus != "all":
            focus_labels = {
                "performance": "rendimiento/potencia",
                "economy": "economía/consumo",
                "safety": "seguridad",
                "value": "relación precio-valor",
                "comfort": "confort/tecnología",
            }
            focus_label = focus_labels.get(context.focus, context.focus)
            parts.append(
                f"El análisis debe priorizar: {focus_label}. "
                "Dedica más espacio y detalle a esta categoría."
            )

        if context.automotive_data:
            parts.append(
                "Tienes datos reales del mercado para cada vehículo. "
                "Cita especificaciones, precios y estadísticas exactas "
                "de los datos proporcionados."
            )

        parts.append(
            "Análisis por categorías: motor, seguridad, confort, economía, "
            "confiabilidad. Enumera ventajas y desventajas de cada uno. "
            "Proporciona una recomendación final clara con justificación."
        )

        if context.vehicles_count < 2:
            parts.append(
                "Si el usuario no ha especificado vehículos concretos, "
                "solicita las marcas, modelos y años que desea comparar."
            )

        return " ".join(parts)

    def get_required_fields(
        self, context: CapabilityContext,
    ) -> list[FollowupField]:
        fields: list[FollowupField] = []
        if context.vehicles_count < 2:
            fields.append(FollowupField(
                name="vehicles",
                question=(
                    "Indica las marcas y modelos de los vehículos que "
                    "deseas comparar (mínimo dos)."
                ),
                priority=1,
            ))
        return fields
