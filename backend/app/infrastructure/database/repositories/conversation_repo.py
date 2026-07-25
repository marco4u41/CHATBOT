from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.interfaces.repository import ConversationRepository, MessageRepository
from app.domain.models.conversation import Conversation
from app.domain.models.message import Message, MessageRole
from app.infrastructure.database.models import ConversationModel, MessageModel


def _conversation_to_domain(model: ConversationModel, message_count: int = 0) -> Conversation:
    return Conversation(
        id=model.id,
        title=model.title,
        summary=model.summary or "",
        created_at=model.created_at,
        updated_at=model.updated_at,
        message_count=message_count,
    )


def _message_to_domain(model: MessageModel) -> Message:
    return Message(
        id=model.id,
        content=model.content,
        role=MessageRole(model.role),
        conversation_id=model.conversation_id,
        created_at=model.created_at,
    )


class SQLAlchemyConversationRepository(ConversationRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, conversation: Conversation) -> Conversation:
        model = ConversationModel(
            id=conversation.id,
            title=conversation.title,
            summary=conversation.summary or None,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )
        self._session.add(model)
        await self._session.flush()
        return _conversation_to_domain(model, message_count=0)

    async def update(self, conversation: Conversation) -> Conversation:
        stmt = select(ConversationModel).where(ConversationModel.id == conversation.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            from app.domain.exceptions import ConversationNotFoundError
            raise ConversationNotFoundError(conversation.id)
        model.title = conversation.title
        model.summary = conversation.summary or None
        model.updated_at = datetime.now(UTC)
        await self._session.flush()
        return _conversation_to_domain(model, message_count=conversation.message_count)

    async def get_by_id(self, conversation_id: str) -> Conversation | None:
        stmt = (
            select(ConversationModel)
            .options(selectinload(ConversationModel.messages))
            .where(ConversationModel.id == conversation_id)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return None
        return _conversation_to_domain(model, message_count=len(model.messages))

    async def get_all(self) -> list[Conversation]:
        stmt = (
            select(ConversationModel)
            .options(selectinload(ConversationModel.messages))
            .order_by(ConversationModel.updated_at.desc())
        )
        result = await self._session.execute(stmt)
        return [
            _conversation_to_domain(m, message_count=len(m.messages))
            for m in result.scalars().all()
        ]

    async def get_recent(self, limit: int = 5) -> list[Conversation]:
        stmt = (
            select(ConversationModel)
            .order_by(ConversationModel.updated_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [
            _conversation_to_domain(m)
            for m in result.scalars().all()
        ]

    async def delete(self, conversation_id: str) -> bool:
        stmt = select(ConversationModel).where(ConversationModel.id == conversation_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return False
        await self._session.delete(model)
        await self._session.flush()
        return True


class SQLAlchemyMessageRepository(MessageRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, message: Message) -> Message:
        model = MessageModel(
            id=message.id,
            content=message.content,
            role=message.role.value,
            conversation_id=message.conversation_id,
            created_at=message.created_at,
        )
        self._session.add(model)

        update_stmt = (
            select(ConversationModel)
            .where(ConversationModel.id == message.conversation_id)
        )
        conv_result = await self._session.execute(update_stmt)
        conv = conv_result.scalar_one_or_none()
        if conv:
            conv.updated_at = datetime.now(UTC)

        await self._session.flush()
        return _message_to_domain(model)

    async def get_by_conversation(self, conversation_id: str) -> list[Message]:
        stmt = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at)
        )
        result = await self._session.execute(stmt)
        return [_message_to_domain(m) for m in result.scalars().all()]

    async def get_last_n(self, conversation_id: str, n: int) -> list[Message]:
        stmt = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at.desc())
            .limit(n)
        )
        result = await self._session.execute(stmt)
        messages = [_message_to_domain(m) for m in result.scalars().all()]
        messages.reverse()
        return messages
