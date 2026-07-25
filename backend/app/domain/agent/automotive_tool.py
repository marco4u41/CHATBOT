from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class VehicleDataBlock:
    """Structured vehicle data formatted for LLM prompt injection."""
    title: str
    content: str


class AutomotiveAgentTool(ABC):
    """Domain interface for querying automotive data within the agent.

    This tool provides high-level query methods that return structured
    data blocks suitable for prompt injection. It abstracts the underlying
    repository and formats results as human-readable text for the LLM.
    """

    @abstractmethod
    async def search_vehicles(
        self,
        manufacturer: str | None = None,
        model: str | None = None,
        year: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        fuel: str | None = None,
        vehicle_type: str | None = None,
        limit: int = 5,
    ) -> VehicleDataBlock | None:
        """Search for vehicles matching the given criteria.

        Returns a formatted data block or None if no results found.
        """
        ...

    @abstractmethod
    async def get_vehicle_details(
        self,
        manufacturer: str,
        model: str,
        year: int | None = None,
    ) -> VehicleDataBlock | None:
        """Get detailed information about a specific vehicle model.

        Returns a formatted data block or None if not found.
        """
        ...

    @abstractmethod
    async def get_brand_info(
        self,
        manufacturer: str,
    ) -> VehicleDataBlock | None:
        """Get aggregate statistics for a brand.

        Returns a formatted data block or None if not found.
        """
        ...

    @abstractmethod
    async def get_model_info(
        self,
        manufacturer: str,
        model: str,
    ) -> VehicleDataBlock | None:
        """Get market statistics for a specific model.

        Returns a formatted data block or None if not found.
        """
        ...

    @abstractmethod
    async def list_brands(
        self,
        limit: int = 20,
    ) -> VehicleDataBlock | None:
        """List available brands with statistics.

        Returns a formatted data block.
        """
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if automotive data is available."""
        ...
