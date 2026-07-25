from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.domain.models.message import Message


class LLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: list[Message],
        system_prompt: str = "",
    ) -> AsyncIterator[str]:
        """Stream response tokens from the LLM."""
        ...

    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        system_prompt: str = "",
    ) -> str:
        """Get a complete response from the LLM."""
        ...
