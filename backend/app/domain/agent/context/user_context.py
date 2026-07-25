from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class VehicleInfo:
    brand: str
    model: str = ""
    year: int | None = None
    engine: str = ""
    mileage_km: int | None = None


@dataclass
class UserContext:
    vehicles: list[VehicleInfo] = field(default_factory=list)
    mentioned_brands: list[str] = field(default_factory=list)
    preferred_brands: list[str] = field(default_factory=list)
    budget: float | None = None
    terrain: str | None = None
    engine_type: str | None = None
    usage: str = ""
    preferences: list[str] = field(default_factory=list)
    has_diagnosed_issue: bool = False
    diagnosis_symptoms: list[str] = field(default_factory=list)
    fuel_preference: str | None = None
    family_size: int | None = None

    def is_empty(self) -> bool:
        return (
            not self.vehicles
            and not self.mentioned_brands
            and not self.preferred_brands
            and self.budget is None
            and not self.terrain
            and not self.engine_type
            and not self.usage
            and not self.preferences
            and not self.has_diagnosed_issue
            and self.fuel_preference is None
            and self.family_size is None
        )

    def to_compact_dict(self) -> dict[str, object]:
        result: dict[str, object] = {}
        if self.vehicles:
            result["vehicles"] = [
                {k: v for k, v in veh.__dict__.items() if v}
                for veh in self.vehicles
            ]
        if self.mentioned_brands:
            result["brands"] = list(set(self.mentioned_brands))
        if self.preferred_brands:
            result["preferred_brands"] = list(set(self.preferred_brands))
        if self.budget is not None:
            result["budget_usd"] = self.budget
        if self.terrain:
            result["terrain"] = self.terrain
        if self.engine_type:
            result["engine_type"] = self.engine_type
        if self.usage:
            result["usage"] = self.usage
        if self.preferences:
            result["preferences"] = list(set(self.preferences))
        if self.fuel_preference:
            result["fuel_preference"] = self.fuel_preference
        if self.family_size is not None:
            result["family_size"] = self.family_size
        if self.has_diagnosed_issue:
            result["has_diagnosed_issue"] = True
            if self.diagnosis_symptoms:
                result["symptoms"] = self.diagnosis_symptoms
        return result
