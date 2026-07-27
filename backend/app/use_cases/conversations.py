from app.domain.exceptions import ConversationNotFoundError
from app.domain.interfaces.repository import ConversationRepository, MessageRepository
from app.domain.models.conversation import Conversation
from app.domain.models.message import Message


class ConversationUseCase:
    def __init__(
        self,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
    ) -> None:
        self._conversation_repo = conversation_repo
        self._message_repo = message_repo

    async def list_all(self, user_id: str | None = None) -> list[Conversation]:
        return await self._conversation_repo.get_all(user_id=user_id)

    async def get_messages(self, conversation_id: str, user_id: str | None = None) -> list[Message]:
        await self._require_exists(conversation_id, user_id=user_id)
        return await self._message_repo.get_by_conversation(conversation_id)

    async def delete(self, conversation_id: str, user_id: str | None = None) -> None:
        deleted = await self._conversation_repo.delete(conversation_id, user_id=user_id)
        if not deleted:
            raise ConversationNotFoundError(conversation_id)

    async def _require_exists(self, conversation_id: str, user_id: str | None = None) -> Conversation:
        conversation = await self._conversation_repo.get_by_id(conversation_id, user_id=user_id)
        if not conversation:
            raise ConversationNotFoundError(conversation_id)
        return conversation
