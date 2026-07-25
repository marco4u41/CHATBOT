from datetime import datetime

from pydantic import BaseModel


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class MessageResponse(BaseModel):
    id: str
    content: str
    role: str
    conversation_id: str
    created_at: datetime
