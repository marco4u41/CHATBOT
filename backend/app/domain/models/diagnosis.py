from dataclasses import dataclass, field
from enum import StrEnum


class SeverityLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class DiagnosisResult:
    diagnosis: str
    possible_causes: list[str] = field(default_factory=list)
    recommended_actions: list[str] = field(default_factory=list)
    severity: SeverityLevel = SeverityLevel.LOW
