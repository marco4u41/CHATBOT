from enum import StrEnum


class Intent(StrEnum):
    GENERAL = "general"
    COMPARISON = "comparison"
    DIAGNOSIS = "diagnosis"
    RECOMMENDATION = "recommendation"
