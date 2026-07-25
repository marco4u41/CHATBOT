from abc import ABC, abstractmethod

from app.domain.models.automotive import (
    BrandSummary,
    VehicleMarketSummary,
    VehicleSummary,
)
from app.domain.models.conversation import Conversation
from app.domain.models.message import Message
from app.domain.models.user_profile import UserProfile


class ConversationRepository(ABC):
    @abstractmethod
    async def create(self, conversation: Conversation) -> Conversation: ...

    @abstractmethod
    async def update(self, conversation: Conversation) -> Conversation: ...

    @abstractmethod
    async def get_by_id(self, conversation_id: str) -> Conversation | None: ...

    @abstractmethod
    async def get_all(self) -> list[Conversation]: ...

    @abstractmethod
    async def get_recent(self, limit: int = 5) -> list[Conversation]: ...

    @abstractmethod
    async def delete(self, conversation_id: str) -> bool: ...


class MessageRepository(ABC):
    @abstractmethod
    async def create(self, message: Message) -> Message: ...

    @abstractmethod
    async def get_by_conversation(self, conversation_id: str) -> list[Message]: ...

    @abstractmethod
    async def get_last_n(self, conversation_id: str, n: int) -> list[Message]: ...


class UserProfileRepository(ABC):
    @abstractmethod
    async def get_by_id(self, profile_id: str) -> UserProfile | None: ...

    @abstractmethod
    async def get_or_create(self, profile_id: str) -> UserProfile: ...

    @abstractmethod
    async def update(self, profile: UserProfile) -> UserProfile: ...


class AutomotiveRepository(ABC):
    @abstractmethod
    async def search_vehicles(
        self,
        manufacturer: str | None = None,
        model: str | None = None,
        year: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        fuel: str | None = None,
        transmission: str | None = None,
        vehicle_type: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[VehicleSummary]: ...

    @abstractmethod
    async def get_vehicle_details(
        self,
        manufacturer: str,
        model: str,
        year: int | None = None,
    ) -> list[VehicleSummary]: ...

    @abstractmethod
    async def get_model_stats(
        self,
        manufacturer: str,
        model: str,
    ) -> VehicleMarketSummary | None: ...

    @abstractmethod
    async def get_brand_stats(
        self,
        manufacturer: str,
    ) -> BrandSummary | None: ...

    @abstractmethod
    async def list_brands(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[BrandSummary]: ...

    @abstractmethod
    async def health_check(self) -> bool: ...
