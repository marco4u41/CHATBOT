class ChatbotError(Exception):
    """Base exception for all chatbot errors."""

    def __init__(self, message: str = "An unexpected error occurred") -> None:
        self.message = message
        super().__init__(self.message)


class ConversationNotFoundError(ChatbotError):
    def __init__(self, conversation_id: str) -> None:
        super().__init__(f"Conversation not found: {conversation_id}")


class MessageValidationError(ChatbotError):
    def __init__(self, detail: str) -> None:
        super().__init__(f"Message validation error: {detail}")


class LLMProviderError(ChatbotError):
    def __init__(self, provider: str, detail: str = "") -> None:
        msg = f"LLM provider error ({provider})"
        if detail:
            msg += f": {detail}"
        super().__init__(msg)


class LLMRateLimitError(LLMProviderError):
    def __init__(self, provider: str, retry_after: int = 60) -> None:
        super().__init__(provider, f"Rate limited. Retry after {retry_after}s")
        self.retry_after = retry_after
