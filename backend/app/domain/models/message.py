import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


@dataclass(frozen=True)
class Message:
    content: str
    role: MessageRole
    conversation_id: str
    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def __post_init__(self) -> None:
        if not self.content.strip():
            raise ValueError("Message content cannot be empty")
        if len(self.content) > 100_000:
            raise ValueError("Message content exceeds maximum length")
