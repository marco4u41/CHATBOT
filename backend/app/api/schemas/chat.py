from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message content")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
    budget: Optional[float] = Field(None, gt=0, description="Physical panel: budget in USD")
    terrain: Optional[str] = Field(
        None,
        pattern="^(city|highway|offroad|mixed)$",
        description="Physical panel: terrain type",
    )
    engine_type: Optional[str] = Field(
        None,
        pattern="^(gasoline|diesel|electric|hybrid)$",
        description="Physical panel: engine type",
    )


class ChatStreamChunk(BaseModel):
    content: str = ""
    done: bool = False
    conversation_id: str = ""
