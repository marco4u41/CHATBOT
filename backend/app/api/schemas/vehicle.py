from pydantic import BaseModel, Field


class VehicleSchema(BaseModel):
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    engine: str = ""
    transmission: str | None = None
    fuel_type: str | None = None
    mileage_km: int | None = Field(None, ge=0)
    price_usd: float | None = Field(None, ge=0)


class VehicleComparisonRequest(BaseModel):
    vehicles: list[VehicleSchema] = Field(..., min_length=2, max_length=5)
    focus: str = Field("all", pattern="^(performance|economy|safety|value|all)$")
    profile_id: str | None = Field(None, description="User profile ID for context")


class DiagnosisRequest(BaseModel):
    vehicle: VehicleSchema
    symptoms: list[str] = Field(..., min_length=1, max_length=10)
    category: str | None = None
    profile_id: str | None = Field(None, description="User profile ID for context")


class RecommendationRequest(BaseModel):
    budget_usd: float = Field(..., gt=0)
    usage: str = Field(..., min_length=1, max_length=500)
    priorities: list[str] | None = None
    profile_id: str | None = Field(None, description="User profile ID for context")


class LLMResponse(BaseModel):
    response: str
