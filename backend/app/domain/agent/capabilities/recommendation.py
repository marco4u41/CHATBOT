from app.domain.agent.capability import Capability, CapabilityContext
from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent
from app.prompts.loader import render_prompt

_USAGE_VEHICLE_GUIDANCE: dict[str, str] = {
    "urbano": (
        "El uso principal es urbano. Prioriza sedan, hatchback y crossover "
        "compactos con buen consumo de combustible y facilidad de estacionamiento."
    ),
    "familiar": (
        "El uso principal es familiar. Prioriza SUV y minivan con capacidad "
        "para 5+ pasajeros, amplio espacio de carga y altos niveles de seguridad."
    ),
    "trabajo": (
        "El uso principal es trabajo. Prioriza trucks y vans con capacidad "
        "de carga, durabilidad y relación costo-beneficio para uso intensivo."
    ),
    "carga": (
        "El uso principal es transporte de carga. Prioriza trucks y vans "
        "con capacidad de carga probada y motor robusto."
    ),
    "deportivo": (
        "El uso principal es deportivo. Prioriza coupés y convertibles "
        "con alto rendimiento, potencia y manejo preciso."
    ),
    "offroad": (
        "El uso principal es off-road. Prioriza SUV y trucks con tracción "
        "4x4, buena altura al piso y capacidad todoterreno."
    ),
    "ruta": (
        "El uso principal es ruta/autopista. Prioriza sedan y SUV con "
        "comodidad en viajes largos, eficiencia en combustible y estabilidad."
    ),
}


class RecommendationCapability(Capability):
    """Capability for vehicle recommendation requests."""

    @property
    def name(self) -> str:
        return "vehicle_recommendation"

    @property
    def supported_intents(self) -> list[Intent]:
        return [Intent.RECOMMENDATION]

    def get_system_prompt_enhancement(self, context: CapabilityContext) -> str:
        base = render_prompt("agent_recommendation_enhancement")

        sections: list[str] = [base]

        if context.automotive_data:
            sections.append(
                "DATOS AUTOMOTRICES REALES DE LA BASE DE DATOS:\n"
                "Utiliza la siguiente información del mercado como fuente "
                "principal para tus recomendaciones. Cada vehículo listado "
                "corresponde a un registro real en la base de datos:\n\n"
                f"{context.automotive_data}\n\n"
                "REGLAS ANTI-ALUCINACIÓN:\n"
                "- Estos datos son estadísticas históricas de listings, NO "
                "inventario en tiempo real ni disponibilidad actual.\n"
                "- NO presentes los precios como ofertas vigentes ni como "
                "disponibilidad confirmada.\n"
                "- Si la información de un vehículo no está en los datos, "
                "indica explícitamente que no se encontró, NO inventes "
                "especificaciones ni precios.\n"
                "- Cuando uses datos históricos, menciona que son "
                "referencias basadas en datos de mercado anteriores.\n"
                "- Prioriza los vehículos que aparecen en los resultados "
                "de búsqueda, ya que cumplen con los filtros del usuario."
            )

        if context.usage:
            guidance = _USAGE_VEHICLE_GUIDANCE.get(context.usage.lower())
            if guidance:
                sections.append(f"ORIENTACIÓN DE USO:\n{guidance}")

        return "\n\n".join(sections)

    def get_context_enrichment(self, context: CapabilityContext) -> str:
        parts = ["El usuario está buscando recomendación para adquirir un vehículo."]

        if context.budget is not None:
            parts.append(f"Presupuesto configurado: ${context.budget:,.0f} USD.")

        if context.usage:
            usage_labels = {
                "urbano": "urbano/ciudad",
                "familiar": "familiar",
                "trabajo": "trabajo/carga",
                "carga": "transporte de carga",
                "deportivo": "deportivo",
                "offroad": "off-road/todo terreno",
                "ruta": "ruta/autopista",
            }
            usage_label = usage_labels.get(context.usage, context.usage)
            parts.append(f"Tipo de uso declarado: {usage_label}.")

        if context.terrain:
            terrain_labels = {
                "city": "urbano/ciudad",
                "highway": "autopista/ruta",
                "offroad": "off-road/todo terreno",
                "mixed": "mixto",
            }
            terrain_label = terrain_labels.get(
                context.terrain, context.terrain,
            )
            parts.append(f"Terreno principal de uso: {terrain_label}.")

        if context.engine_type:
            engine_labels = {
                "gasoline": "gasolina",
                "diesel": "diésel",
                "electric": "eléctrico",
                "hybrid": "híbrido",
            }
            engine_label = engine_labels.get(
                context.engine_type, context.engine_type,
            )
            parts.append(f"Preferencia de motor: {engine_label}.")

        if context.automotive_data:
            parts.append(
                "Tienes datos reales del mercado disponibles. Úsalos como "
                "base para cada recomendación, incluyendo precios reales, "
                "especificaciones y estadísticas del modelo."
            )

        parts.append(
            "Proporciona 3-5 recomendaciones con tablas comparativas, consejos de "
            "compra, alternativas y estimación de costos de tenencia. "
            "Incluye bloques [CAR] estructurados para cada vehículo recomendado."
        )

        if context.budget is None:
            parts.append(
                "Si el usuario no ha indicado presupuesto, "
                "solicítalo antes de recomendar."
            )

        return " ".join(parts)

    def get_required_fields(
        self, context: CapabilityContext,
    ) -> list[FollowupField]:
        fields: list[FollowupField] = []
        if context.budget is None:
            fields.append(FollowupField(
                name="budget",
                question=(
                    "Indica tu presupuesto máximo para el vehículo "
                    "(puede ser un rango aproximado en USD)."
                ),
                priority=1,
            ))
        if not context.usage:
            fields.append(FollowupField(
                name="usage",
                question=(
                    "¿Para qué usarás el vehículo principalmente? "
                    "(urbano, familiar, trabajo, carga, deportivo, off-road, ruta)."
                ),
                priority=2,
            ))
        if not context.terrain:
            fields.append(FollowupField(
                name="terrain",
                question=(
                    "Describe el terreno o tipo de vía donde conduces "
                    "con más frecuencia (ciudad, autopista, off-road, mixto)."
                ),
                priority=3,
            ))
        if not context.engine_type:
            fields.append(FollowupField(
                name="engine_type",
                question=(
                    "Tienes preferencia por algún tipo de motor: "
                    "gasolina, diésel, eléctrico o híbrido?"
                ),
                priority=4,
            ))
        return fields
