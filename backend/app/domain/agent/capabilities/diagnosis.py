from app.domain.agent.capability import Capability, CapabilityContext
from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent
from app.prompts.loader import render_prompt


class DiagnosisCapability(Capability):
    """Capability for vehicle diagnosis requests."""

    @property
    def name(self) -> str:
        return "vehicle_diagnosis"

    @property
    def supported_intents(self) -> list[Intent]:
        return [Intent.DIAGNOSIS]

    def get_system_prompt_enhancement(self, context: CapabilityContext) -> str:
        base = render_prompt("agent_diagnosis_enhancement")

        sections: list[str] = [base]

        if context.automotive_data:
            sections.append(
                "DATOS AUTOMOTRICES REALES DEL VEHÍCULO:\n"
                "La base de datos contiene información técnica del vehículo "
                "que se está diagnosticando. Utiliza estos datos como contexto "
                "para causas probables, especificaciones y mantenimiento conocido:\n\n"
                f"{context.automotive_data}\n\n"
                "REGLAS PARA DIAGNÓSTICO CON DATOS REALES:\n"
                "- Si los datos incluyen especificaciones del motor, "
                "úsalas para acotar las causas probables.\n"
                "- Si aparece información de mantenimiento conocido del modelo, "
                "menciónala como referencia.\n"
                "- Si los datos no cubren el problema reportado, "
                "indica que no hay información específica del modelo.\n"
                "- NO inventes datos técnicos que no aparezcan aquí."
            )

        return "\n\n".join(sections)

    def get_context_enrichment(self, context: CapabilityContext) -> str:
        parts = [
            "El usuario está describiendo un problema o síntoma vehicular. "
            "Proporciona un diagnóstico preliminar con: 1) Resumen del problema, "
            "2) Causas posibles ordenadas por probabilidad, 3) Acciones recomendadas, "
            "4) Nivel de urgencia. Siempre recomienda consultar con un mecánico "
            "certificado para un diagnóstico definitivo.",
        ]

        if context.automotive_data:
            parts.append(
                "Tienes datos reales del vehículo disponible. Úsalos para "
                "contextualizar el diagnóstico: especificaciones del motor, "
                "mantenimiento conocido del modelo y problemas frecuentes "
                "reportados en la base de datos."
            )

        if context.vehicles_count > 0:
            parts.append(
                "El usuario ya proporcionó información del vehículo. "
                "No solicites marca, modelo o año si ya están disponibles."
            )

        if context.has_symptoms:
            parts.append(
                "El usuario ya describió síntomas. Continúa el diagnóstico "
                "sin pedir que repita la información."
            )

        parts.append(
            "Si el usuario no ha especificado el vehículo o los síntomas "
            "con claridad, solicita esos detalles."
        )

        return " ".join(parts)

    def get_required_fields(
        self, context: CapabilityContext,
    ) -> list[FollowupField]:
        fields: list[FollowupField] = []
        if context.vehicles_count < 1:
            fields.append(FollowupField(
                name="vehicle",
                question=(
                    "Indica la marca, modelo y año del vehículo "
                    "que presenta el problema."
                ),
                priority=1,
            ))
        if not context.has_symptoms:
            fields.append(FollowupField(
                name="symptoms",
                question=(
                    "Describe con detalle los síntomas que observas: "
                    "cuándo ocurren, a qué velocidad o condiciones, "
                    "y si hay olores, ruidos o luces inusuales."
                ),
                priority=2,
            ))
        return fields
