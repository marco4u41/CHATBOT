from __future__ import annotations

from pydantic import BaseModel


class AnalyticsErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: str | None = None


class TypeDistributionResponse(BaseModel):
    vehicle_type: str | None
    count: int
    avg_price: float | None


class FuelDistributionResponse(BaseModel):
    fuel: str | None
    count: int
    avg_price: float | None


class TransmissionDistributionResponse(BaseModel):
    transmission: str | None
    count: int


class YearStatsResponse(BaseModel):
    year: int
    count: int
    avg_price: float | None


class PriceRangeCountResponse(BaseModel):
    price_range: str
    count: int


class VehicleOverviewResponse(BaseModel):
    success: bool = True
    total_vehicles: int
    avg_price: float | None
    total_brands: int
    total_models: int


class BrandRankingItemResponse(BaseModel):
    brand_id: int
    manufacturer: str
    model_count: int | None = None
    year_count: int | None = None
    total_listings: int | None = None
    average_price: float | None = None


class BrandRankingResponse(BaseModel):
    success: bool = True
    count: int
    limit: int
    data: list[BrandRankingItemResponse]


class VehicleTypeDistributionResponse(BaseModel):
    success: bool = True
    count: int
    data: list[TypeDistributionResponse]


class VehicleFuelDistributionResponse(BaseModel):
    success: bool = True
    count: int
    data: list[FuelDistributionResponse]


class VehicleTransmissionDistributionResponse(BaseModel):
    success: bool = True
    count: int
    data: list[TransmissionDistributionResponse]


class VehicleYearStatsResponse(BaseModel):
    success: bool = True
    count: int
    data: list[YearStatsResponse]


class VehiclePriceDistributionResponse(BaseModel):
    success: bool = True
    count: int
    data: list[PriceRangeCountResponse]


class ConversationOverviewResponse(BaseModel):
    success: bool = True
    total_conversations: int
    total_messages: int
    avg_messages_per_conversation: float


class AnalyticsOverviewResponse(BaseModel):
    success: bool = True
    vehicles: VehicleOverviewResponse
    conversations: ConversationOverviewResponse
