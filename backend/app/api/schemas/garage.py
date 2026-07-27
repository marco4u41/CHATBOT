"""Garage API schemas."""

from pydantic import BaseModel, Field


class GarageVehicleCreateRequest(BaseModel):
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    engine: str = Field("", max_length=100)
    transmission: str = Field("", max_length=50)
    fuel_type: str = Field("", max_length=50)
    mileage_km: int | None = Field(None, ge=0)
    price_usd: float | None = Field(None, ge=0)
    body_type: str = Field("", max_length=50)
    drive: str = Field("", max_length=50)
    condition: str = Field("", max_length=50)
    color: str = Field("", max_length=50)
    cylinders: int | None = Field(None, ge=1, le=16)
    passengers: int | None = Field(None, ge=1, le=50)
    consumption: str = Field("", max_length=50)
    notes: str = Field("", max_length=1000)


class GarageVehicleResponse(BaseModel):
    id: str
    brand: str
    model: str
    year: int
    engine: str = ""
    transmission: str = ""
    fuel_type: str = ""
    mileage_km: int | None = None
    price_usd: float | None = None
    body_type: str = ""
    drive: str = ""
    condition: str = ""
    color: str = ""
    cylinders: int | None = None
    passengers: int | None = None
    consumption: str = ""
    notes: str = ""
    added_at: str


class GarageListResponse(BaseModel):
    success: bool
    data: list[GarageVehicleResponse]


class GarageVehicleCreateResponse(BaseModel):
    success: bool
    data: GarageVehicleResponse


class GarageActionResponse(BaseModel):
    success: bool
    error: str | None = None
