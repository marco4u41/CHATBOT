import logging
from dataclasses import dataclass, field

from app.domain.agent.automotive_tool import AutomotiveAgentTool
from app.domain.agent.capability import CapabilityContext
from app.domain.agent.context.manager import ContextManager
from app.domain.agent.context.user_context import UserContext
from app.domain.agent.followup import FollowupField
from app.domain.agent.intent import Intent
from app.domain.agent.intent_classifier import ClassificationResult, IntentClassifier
from app.domain.agent.registry import CapabilityRegistry
from app.domain.interfaces.llm_provider import LLMProvider
from app.domain.models.message import Message
from app.prompts.loader import render_prompt

logger = logging.getLogger(__name__)


@dataclass
class OrchestrationResult:
    intent: Intent
    confidence: float
    matched_keywords: list[str]
    system_prompt: str
    context_enrichment: str
    user_context: UserContext = field(default_factory=UserContext)


class AgentOrchestrator:
    """Central coordinator that routes user messages through the intent
    classifier, builds persistent user context, enriches the prompt with
    relevant capabilities, and delegates to the LLM provider."""

    def __init__(
        self,
        llm: LLMProvider,
        registry: CapabilityRegistry,
        context_manager: ContextManager | None = None,
        classifier: IntentClassifier | None = None,
        automotive_tool: AutomotiveAgentTool | None = None,
    ) -> None:
        self._llm = llm
        self._registry = registry
        self._context_manager = context_manager or ContextManager()
        self._classifier = classifier or IntentClassifier()
        self._automotive_tool = automotive_tool

    def classify_intent(
        self,
        message: str,
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
    ) -> ClassificationResult:
        return self._classifier.classify(
            message,
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
        )

    async def orchestrate(
        self,
        message: str,
        history: list[Message],
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
        profile_id: str | None = None,
        focus: str = "all",
        usage: str = "",
    ) -> OrchestrationResult:
        classification = self.classify_intent(
            message,
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
        )

        user_context, context_block = await self._context_manager.build_context(
            history,
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
            profile_id=profile_id,
        )

        automotive_data = await self._fetch_automotive_data(
            classification.intent, user_context,
        )

        capability_context = CapabilityContext(
            user_message=message,
            conversation_history=[
                {"role": m.role.value, "content": m.content} for m in history
            ],
            budget=user_context.budget,
            terrain=user_context.terrain or terrain,
            engine_type=user_context.engine_type or engine_type,
            automotive_data=automotive_data,
            vehicles_count=len(user_context.vehicles),
            has_symptoms=bool(user_context.diagnosis_symptoms),
            usage=user_context.usage or usage,
            focus=focus,
        )

        base_system_prompt = render_prompt(
            "base",
            budget=user_context.budget,
            terrain=user_context.terrain or terrain,
            engine_type=user_context.engine_type or engine_type,
        )

        prompt_parts = [base_system_prompt]

        if context_block:
            prompt_parts.append(context_block)

        capability_enhancement = self._registry.build_system_prompt(
            classification.intent,
            capability_context,
        )
        if capability_enhancement:
            prompt_parts.append(capability_enhancement)

        full_system_prompt = "\n\n".join(prompt_parts)

        missing_fields = self._registry.detect_missing_info(
            classification.intent, capability_context,
        )
        if missing_fields:
            followup_block = self._format_followup_instructions(missing_fields)
            prompt_parts.append(followup_block)
            full_system_prompt = "\n\n".join(prompt_parts)

        context_enrichment = self._registry.build_context_enrichment(
            classification.intent,
            capability_context,
        )

        logger.info(
            "Intent: %s (%.2f) | Context: vehicle=%s, budget=%s, usage=%s",
            classification.intent.value,
            classification.confidence,
            user_context.vehicles[0].brand if user_context.vehicles else "-",
            user_context.budget,
            user_context.usage,
        )

        return OrchestrationResult(
            intent=classification.intent,
            confidence=classification.confidence,
            matched_keywords=classification.matched_keywords,
            system_prompt=full_system_prompt,
            context_enrichment=context_enrichment,
            user_context=user_context,
        )

    @property
    def llm(self) -> LLMProvider:
        return self._llm

    @property
    def registry(self) -> CapabilityRegistry:
        return self._registry

    async def _fetch_automotive_data(
        self, intent: Intent, user_context: UserContext,
    ) -> str:
        """Fetch relevant automotive data blocks based on intent and context.

        Adapts queries to the detected intent:
        - RECOMMENDATION: search_vehicles() with budget/usage filters
        - COMPARISON: vehicle details + model stats for each vehicle
        - DIAGNOSIS: vehicle details + model stats for context
        - GENERAL: no automotive queries

        Returns concatenated formatted data blocks for prompt injection.
        Silently returns empty string if the tool is unavailable or on error.
        """
        if self._automotive_tool is None:
            return ""

        if intent == Intent.GENERAL:
            return ""

        try:
            blocks: list[str] = []
            fetched: set[str] = set()

            if intent == Intent.RECOMMENDATION:
                blocks = await self._fetch_recommendation_data(
                    user_context, fetched,
                )
            elif intent == Intent.COMPARISON:
                blocks = await self._fetch_comparison_data(
                    user_context, fetched,
                )
            elif intent == Intent.DIAGNOSIS:
                blocks = await self._fetch_diagnosis_data(
                    user_context, fetched,
                )

            return "\n\n".join(blocks)

        except Exception:
            logger.warning("Failed to fetch automotive data", exc_info=True)
            return ""

    async def _fetch_recommendation_data(
        self,
        user_context: UserContext,
        fetched: set[str],
    ) -> list[str]:
        """Fetch data for RECOMMENDATION intent.

        Uses search_vehicles() with budget/usage filters to find
        real vehicles matching the user's criteria.
        """
        blocks: list[str] = []

        max_price = None
        if user_context.budget:
            max_price = user_context.budget * 1.15

        vehicle_type = self._map_usage_to_vehicle_type(user_context.usage)

        fuel = None
        if user_context.engine_type:
            fuel = user_context.engine_type

        search_result = await self._automotive_tool.search_vehicles(
            max_price=max_price,
            vehicle_type=vehicle_type,
            fuel=fuel,
            limit=5,
        )
        if search_result:
            blocks.append(search_result.content)
            fetched.add("search")

        for vehicle in user_context.vehicles[:2]:
            brand = vehicle.brand.strip()
            model = vehicle.model.strip()
            if not brand:
                continue

            key = f"{brand.lower()}:{model.lower()}" if model else brand.lower()
            if key in fetched:
                continue

            if model:
                detail_block = await self._automotive_tool.get_vehicle_details(
                    brand, model, year=vehicle.year,
                )
                if detail_block:
                    blocks.append(detail_block.content)
                    fetched.add(key)

                model_block = await self._automotive_tool.get_model_info(
                    brand, model,
                )
                if model_block:
                    blocks.append(model_block.content)
            else:
                brand_block = await self._automotive_tool.get_brand_info(brand)
                if brand_block:
                    blocks.append(brand_block.content)
                    fetched.add(key)

        for brand_name in user_context.mentioned_brands[:3]:
            key = brand_name.lower()
            if key in fetched:
                continue
            brand_block = await self._automotive_tool.get_brand_info(brand_name)
            if brand_block:
                blocks.append(brand_block.content)
                fetched.add(key)

        return blocks

    async def _fetch_comparison_data(
        self,
        user_context: UserContext,
        fetched: set[str],
    ) -> list[str]:
        """Fetch data for COMPARISON intent.

        Queries detailed specs and market stats for each vehicle
        to enable accurate comparison.
        """
        blocks: list[str] = []

        for vehicle in user_context.vehicles[:2]:
            brand = vehicle.brand.strip()
            model = vehicle.model.strip()
            if not brand:
                continue

            key = f"{brand.lower()}:{model.lower()}"
            if key in fetched:
                continue

            if model:
                detail_block = await self._automotive_tool.get_vehicle_details(
                    brand, model, year=vehicle.year,
                )
                if detail_block:
                    blocks.append(detail_block.content)
                    fetched.add(key)

                model_block = await self._automotive_tool.get_model_info(
                    brand, model,
                )
                if model_block:
                    blocks.append(model_block.content)
            else:
                brand_block = await self._automotive_tool.get_brand_info(brand)
                if brand_block:
                    blocks.append(brand_block.content)
                    fetched.add(brand.lower())

        for brand_name in user_context.mentioned_brands[:3]:
            key = brand_name.lower()
            if key in fetched:
                continue
            brand_block = await self._automotive_tool.get_brand_info(brand_name)
            if brand_block:
                blocks.append(brand_block.content)
                fetched.add(key)

        return blocks

    async def _fetch_diagnosis_data(
        self,
        user_context: UserContext,
        fetched: set[str],
    ) -> list[str]:
        """Fetch data for DIAGNOSIS intent.

        Queries vehicle details and model stats to provide
        technical context for diagnosis.
        """
        blocks: list[str] = []

        for vehicle in user_context.vehicles[:1]:
            brand = vehicle.brand.strip()
            model = vehicle.model.strip()
            if not brand:
                continue

            key = f"{brand.lower()}:{model.lower()}"
            if key in fetched:
                continue

            if model:
                detail_block = await self._automotive_tool.get_vehicle_details(
                    brand, model, year=vehicle.year,
                )
                if detail_block:
                    blocks.append(detail_block.content)
                    fetched.add(key)

                model_block = await self._automotive_tool.get_model_info(
                    brand, model,
                )
                if model_block:
                    blocks.append(model_block.content)
            else:
                brand_block = await self._automotive_tool.get_brand_info(brand)
                if brand_block:
                    blocks.append(brand_block.content)
                    fetched.add(brand.lower())

        return blocks

    @staticmethod
    def _map_usage_to_vehicle_type(usage: str | None) -> str | None:
        """Map usage context to vehicle_type for search_vehicles()."""
        if not usage:
            return None
        mapping = {
            "urbano": "sedan",
            "familiar": "suv",
            "trabajo": "truck",
            "carga": "truck",
            "deportivo": "coupe",
            "offroad": "suv",
            "ruta": "sedan",
        }
        return mapping.get(usage.lower())

    @staticmethod
    def _format_followup_instructions(
        fields: list[FollowupField],
    ) -> str:
        """Format missing-field declarations into LLM follow-up instructions.

        The block is appended to the system prompt so the model knows
        exactly what to ask and in what order, without inventing data.
        """
        lines = [
            "INSTRUCCIONES DE SEGUIMIENTO:",
            "El contexto del usuario no contiene información suficiente "
            "para generar una respuesta completa y precisa.",
            "Antes de responder, formula preguntas de seguimiento para "
            "obtener la información marcada como faltante.",
            "NO inventes datos faltantes. Pregunta de forma natural y "
            "contextualizada, adaptando el tono a la conversación.",
            "Si el usuario ya proporcionó parte de la información en "
            "esta conversación, no la repitas.",
            "",
        ]
        priority_labels = {1: "CRÍTICO", 2: "IMPORTANTE", 3: "COMPLEMENTARIO"}
        for f in fields:
            label = priority_labels.get(f.priority, "RELEVANTE")
            lines.append(f"- [{label}] {f.question}")

        return "\n".join(lines)
