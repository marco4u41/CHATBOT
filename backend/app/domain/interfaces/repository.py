from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models.automotive import (
    BrandSummary,
    VehicleMarketSummary,
    VehicleSummary,
)
from app.domain.models.conversation import Conversation
from app.domain.models.garage_vehicle import GarageVehicle
from app.domain.models.message import Message
from app.domain.models.user import User
from app.domain.models.user_profile import UserProfile


class UserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User: ...

    @abstractmethod
    async def get_by_id(self, user_id: str) -> User | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def update(self, user: User) -> User: ...

    @abstractmethod
    async def delete(self, user_id: str) -> bool: ...


class ConversationRepository(ABC):
    @abstractmethod
    async def create(
        self, conversation: Conversation, user_id: str | None = None,
    ) -> Conversation: ...

    @abstractmethod
    async def update(
        self, conversation: Conversation
    ) -> Conversation: ...

    @abstractmethod
    async def get_by_id(
        self, conversation_id: str, user_id: str | None = None,
    ) -> Conversation | None: ...

    @abstractmethod
    async def get_all(self, user_id: str | None = None) -> list[Conversation]: ...

    @abstractmethod
    async def get_recent(
        self, limit: int = 5
    ) -> list[Conversation]: ...

    @abstractmethod
    async def delete(self, conversation_id: str, user_id: str | None = None) -> bool: ...

    @abstractmethod
    async def conversation_overview(self) -> dict[str, object]: ...


class MessageRepository(ABC):
    @abstractmethod
    async def create(self, message: Message) -> Message: ...

    @abstractmethod
    async def get_by_conversation(
        self, conversation_id: str
    ) -> list[Message]: ...

    @abstractmethod
    async def get_last_n(
        self, conversation_id: str, n: int
    ) -> list[Message]: ...


class UserProfileRepository(ABC):
    @abstractmethod
    async def get_by_id(
        self, profile_id: str
    ) -> UserProfile | None: ...

    @abstractmethod
    async def get_or_create(
        self, profile_id: str
    ) -> UserProfile: ...

    @abstractmethod
    async def update(
        self, profile: UserProfile
    ) -> UserProfile: ...


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
    async def count_by_type(self) -> list[dict[str, object]]: ...

    @abstractmethod
    async def count_by_fuel(self) -> list[dict[str, object]]: ...

    @abstractmethod
    async def count_by_transmission(
        self,
    ) -> list[dict[str, object]]: ...

    @abstractmethod
    async def avg_price_by_year(
        self,
    ) -> list[dict[str, object]]: ...

    @abstractmethod
    async def price_distribution(
        self,
    ) -> list[dict[str, object]]: ...

    @abstractmethod
    async def vehicle_overview(self) -> dict[str, object]: ...

    @abstractmethod
    async def brand_ranking(
        self, limit: int = 10
    ) -> list[BrandSummary]: ...

    @abstractmethod
    async def health_check(self) -> bool: ...


class GarageVehicleRepository(ABC):
    @abstractmethod
    async def get_by_user(self, user_id: str) -> list[GarageVehicle]: ...

    @abstractmethod
    async def get_by_id(self, vehicle_id: str, user_id: str) -> GarageVehicle | None: ...

    @abstractmethod
    async def add(self, vehicle: GarageVehicle) -> GarageVehicle: ...

    @abstractmethod
    async def delete(self, vehicle_id: str, user_id: str) -> bool: ...

    @abstractmethod
    async def count_by_user(self, user_id: str) -> int: ...
