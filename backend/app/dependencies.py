from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.agent.capabilities.comparison import ComparisonCapability
from app.domain.agent.capabilities.diagnosis import DiagnosisCapability
from app.domain.agent.capabilities.recommendation import RecommendationCapability
from app.domain.agent.context.extractor import ContextExtractor
from app.domain.agent.context.manager import ContextManager
from app.domain.agent.intent_classifier import IntentClassifier
from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.agent.profile.manager import UserProfileManager
from app.domain.agent.profile.updater import ProfileUpdater
from app.domain.agent.registry import CapabilityRegistry
from app.domain.interfaces.llm_provider import LLMProvider
from app.domain.interfaces.repository import (
    AutomotiveRepository,
    ConversationRepository,
    MessageRepository,
    UserProfileRepository,
)
from app.infrastructure.agent.automotive_tool_impl import SqlAlchemyAutomotiveAgentTool
from app.infrastructure.database.connection import get_async_session
from app.infrastructure.database.repositories.automotive_repo import (
    SqlAlchemyAutomotiveRepository,
)
from app.infrastructure.database.repositories.conversation_repo import (
    SQLAlchemyConversationRepository,
    SQLAlchemyMessageRepository,
)
from app.infrastructure.database.repositories.user_profile_repo import (
    SQLAlchemyUserProfileRepository,
)
from app.infrastructure.llm.openrouter import OpenRouterProvider
from app.use_cases.chat import ChatUseCase
from app.use_cases.conversations import ConversationUseCase
from app.use_cases.diagnosis import DiagnosisUseCase
from app.use_cases.recommendation import RecommendationUseCase
from app.use_cases.vehicle_comparison import VehicleComparisonUseCase


def get_llm_provider() -> LLMProvider:
    return OpenRouterProvider()


def get_conversation_repo(
    session: AsyncSession = Depends(get_async_session),
) -> ConversationRepository:
    return SQLAlchemyConversationRepository(session)


def get_message_repo(
    session: AsyncSession = Depends(get_async_session),
) -> MessageRepository:
    return SQLAlchemyMessageRepository(session)


def get_user_profile_repo(
    session: AsyncSession = Depends(get_async_session),
) -> UserProfileRepository:
    return SQLAlchemyUserProfileRepository(session)


def get_automotive_repo(
    session: AsyncSession = Depends(get_async_session),
) -> AutomotiveRepository:
    return SqlAlchemyAutomotiveRepository(session)


def get_intent_classifier() -> IntentClassifier:
    return IntentClassifier()


def get_context_extractor() -> ContextExtractor:
    return ContextExtractor()


def get_profile_updater() -> ProfileUpdater:
    return ProfileUpdater()


def get_user_profile_manager(
    repo: UserProfileRepository = Depends(get_user_profile_repo),
    updater: ProfileUpdater = Depends(get_profile_updater),
) -> UserProfileManager:
    return UserProfileManager(repo, updater)


def get_context_manager(
    extractor: ContextExtractor = Depends(get_context_extractor),
    profile_manager: UserProfileManager = Depends(get_user_profile_manager),
    conversation_repo: ConversationRepository = Depends(get_conversation_repo),
) -> ContextManager:
    return ContextManager(profile_manager, extractor, conversation_repo)


def get_automotive_tool(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> SqlAlchemyAutomotiveAgentTool:
    return SqlAlchemyAutomotiveAgentTool(repo)


def get_capability_registry() -> CapabilityRegistry:
    registry = CapabilityRegistry()
    registry.register(ComparisonCapability())
    registry.register(DiagnosisCapability())
    registry.register(RecommendationCapability())
    return registry


def get_agent_orchestrator(
    llm: LLMProvider = Depends(get_llm_provider),
    registry: CapabilityRegistry = Depends(get_capability_registry),
    context_manager: ContextManager = Depends(get_context_manager),
    classifier: IntentClassifier = Depends(get_intent_classifier),
    automotive_tool: SqlAlchemyAutomotiveAgentTool = Depends(get_automotive_tool),
) -> AgentOrchestrator:
    return AgentOrchestrator(
        llm, registry, context_manager, classifier, automotive_tool,
    )


def get_chat_use_case(
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
    conversation_repo: ConversationRepository = Depends(get_conversation_repo),
    message_repo: MessageRepository = Depends(get_message_repo),
) -> ChatUseCase:
    return ChatUseCase(orchestrator, conversation_repo, message_repo)


def get_conversation_use_case(
    conversation_repo: ConversationRepository = Depends(get_conversation_repo),
    message_repo: MessageRepository = Depends(get_message_repo),
) -> ConversationUseCase:
    return ConversationUseCase(conversation_repo, message_repo)


def get_vehicle_comparison_use_case(
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
) -> VehicleComparisonUseCase:
    return VehicleComparisonUseCase(orchestrator)


def get_diagnosis_use_case(
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
) -> DiagnosisUseCase:
    return DiagnosisUseCase(orchestrator)


def get_recommendation_use_case(
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
) -> RecommendationUseCase:
    return RecommendationUseCase(orchestrator)
