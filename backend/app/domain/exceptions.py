class ChatbotError(Exception):
    """Base exception for all chatbot errors."""

    def __init__(self, message: str = "Ocurrió un error inesperado") -> None:
        self.message = message
        super().__init__(self.message)


class ConversationNotFoundError(ChatbotError):
    def __init__(self, conversation_id: str) -> None:
        super().__init__(f"Conversación no encontrada: {conversation_id}")


class MessageValidationError(ChatbotError):
    def __init__(self, detail: str) -> None:
        super().__init__(f"Error de validación: {detail}")


class LLMProviderError(ChatbotError):
    def __init__(self, provider: str, detail: str = "") -> None:
        msg = f"Error del proveedor LLM ({provider})"
        if detail:
            msg += f": {detail}"
        super().__init__(msg)


class LLMRateLimitError(LLMProviderError):
    def __init__(self, provider: str, retry_after: int = 60) -> None:
        super().__init__(provider, f"Límite de solicitudes alcanzado. Reintentar en {retry_after}s")
        self.retry_after = retry_after


class UnauthorizedAccessError(ChatbotError):
    def __init__(self) -> None:
        super().__init__("No tienes permiso para acceder a este recurso")
