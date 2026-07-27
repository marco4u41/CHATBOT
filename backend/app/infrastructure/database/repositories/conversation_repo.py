import logging
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.interfaces.repository import (
    ConversationRepository,
    MessageRepository,
)
from app.domain.models.conversation import Conversation
from app.domain.models.message import Message, MessageRole
from app.infrastructure.database.models import ConversationModel, MessageModel

logger = logging.getLogger(__name__)


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

    async def create(self, conversation: Conversation, user_id: str | None = None) -> Conversation:
        model = ConversationModel(
            id=conversation.id,
            title=conversation.title,
            summary=conversation.summary or None,
            user_id=user_id,
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

    async def get_by_id(self, conversation_id: str, user_id: str | None = None) -> Conversation | None:
        stmt = (
            select(ConversationModel)
            .options(selectinload(ConversationModel.messages))
            .where(ConversationModel.id == conversation_id)
        )
        if user_id:
            stmt = stmt.where(ConversationModel.user_id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return None
        return _conversation_to_domain(model, message_count=len(model.messages))

    async def get_all(self, user_id: str | None = None) -> list[Conversation]:
        stmt = (
            select(ConversationModel)
            .options(selectinload(ConversationModel.messages))
            .order_by(ConversationModel.updated_at.desc())
        )
        if user_id:
            stmt = stmt.where(ConversationModel.user_id == user_id)
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

    async def delete(self, conversation_id: str, user_id: str | None = None) -> bool:
        stmt = select(ConversationModel).where(ConversationModel.id == conversation_id)
        if user_id:
            stmt = stmt.where(ConversationModel.user_id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return False
        await self._session.delete(model)
        await self._session.flush()
        return True

    async def conversation_overview(self) -> dict[str, object]:
        try:
            total_convs_stmt = select(
                func.count()
            ).select_from(ConversationModel)
            total_convs_result = await self._session.execute(
                total_convs_stmt
            )
            total_conversations = (
                total_convs_result.scalar() or 0
            )

            total_msgs_stmt = select(
                func.count()
            ).select_from(MessageModel)
            total_msgs_result = await self._session.execute(
                total_msgs_stmt
            )
            total_messages = total_msgs_result.scalar() or 0

            avg_msgs = (
                total_messages / total_conversations
                if total_conversations > 0
                else 0.0
            )

            return {
                "total_conversations": total_conversations,
                "total_messages": total_messages,
                "avg_messages_per_conversation": round(
                    avg_msgs, 2
                ),
            }
        except Exception:
            logger.exception("conversation_overview query failed")
            return {
                "total_conversations": 0,
                "total_messages": 0,
                "avg_messages_per_conversation": 0.0,
            }


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
