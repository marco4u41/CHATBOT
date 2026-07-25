from dataclasses import dataclass
from enum import StrEnum


class FuelType(StrEnum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    PLUGIN_HYBRID = "plugin_hybrid"


class TransmissionType(StrEnum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    CVT = "cvt"
    DCT = "dct"


@dataclass(frozen=True)
class Vehicle:
    brand: str
    model: str
    year: int
    engine: str = ""
    transmission: TransmissionType | None = None
    fuel_type: FuelType | None = None
    mileage_km: int | None = None
    price_usd: float | None = None

    def __post_init__(self) -> None:
        if not self.brand.strip():
            raise ValueError("Vehicle brand cannot be empty")
        if not self.model.strip():
            raise ValueError("Vehicle model cannot be empty")
        if self.year < 1900 or self.year > 2100:
            raise ValueError(f"Invalid vehicle year: {self.year}")
        if self.mileage_km is not None and self.mileage_km < 0:
            raise ValueError("Mileage cannot be negative")
        if self.price_usd is not None and self.price_usd < 0:
            raise ValueError("Price cannot be negative")

    @property
    def display_name(self) -> str:
        return f"{self.brand} {self.model} {self.year}"
