from collections.abc import AsyncIterator

from app.domain.agent.orchestrator import AgentOrchestrator
from app.domain.exceptions import MessageValidationError
from app.domain.interfaces.repository import ConversationRepository, MessageRepository
from app.domain.models.conversation import Conversation
from app.domain.models.message import Message, MessageRole

_DEFAULT_PROFILE_ID = "default"


class ChatUseCase:
    def __init__(
        self,
        orchestrator: AgentOrchestrator,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
    ) -> None:
        self._orchestrator = orchestrator
        self._conversation_repo = conversation_repo
        self._message_repo = message_repo

    async def stream_response(
        self,
        content: str,
        conversation_id: str | None = None,
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
    ) -> AsyncIterator[tuple[str, bool, str]]:
        """Yields (token_chunk, done, conversation_id) tuples."""
        if not content.strip():
            raise MessageValidationError("Message content cannot be empty")

        conversation = await self._ensure_conversation(conversation_id)

        user_message = Message(
            content=content.strip(),
            role=MessageRole.USER,
            conversation_id=conversation.id,
        )
        await self._message_repo.create(user_message)
        conversation.increment_message_count()

        history = await self._message_repo.get_last_n(conversation.id, 20)

        result = await self._orchestrator.orchestrate(
            content.strip(),
            history,
            budget=budget,
            terrain=terrain,
            engine_type=engine_type,
            profile_id=_DEFAULT_PROFILE_ID,
        )

        system_prompt = result.system_prompt
        if result.context_enrichment:
            system_prompt = f"{system_prompt}\n\n{result.context_enrichment}"

        full_response = ""
        async for chunk in self._orchestrator.llm.stream_chat(history, system_prompt):
            full_response += chunk
            yield chunk, False, conversation.id

        if full_response:
            assistant_message = Message(
                content=full_response,
                role=MessageRole.ASSISTANT,
                conversation_id=conversation.id,
            )
            await self._message_repo.create(assistant_message)
            conversation.increment_message_count()

            if conversation.message_count <= 2:
                title = content[:80] + ("..." if len(content) > 80 else "")
                conversation.title = title
                await self._conversation_repo.update(conversation)

        yield "", True, conversation.id

    async def _ensure_conversation(self, conversation_id: str | None) -> Conversation:
        if conversation_id:
            conversation = await self._conversation_repo.get_by_id(conversation_id)
            if conversation:
                return conversation

        conversation = Conversation(title="Nueva conversación")
        return await self._conversation_repo.create(conversation)
