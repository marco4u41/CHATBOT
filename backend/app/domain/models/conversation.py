import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class Conversation:
    title: str
    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    summary: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    message_count: int = 0

    def touch(self) -> None:
        self.updated_at = datetime.now(UTC)

    def increment_message_count(self) -> None:
        self.message_count += 1
        self.touch()
