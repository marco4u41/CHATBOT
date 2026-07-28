from enum import StrEnum


class Intent(StrEnum):
    GENERAL = "general"
    COMPARISON = "comparison"
    DIAGNOSIS = "diagnosis"
    RECOMMENDATION = "recommendation"
    OUT_OF_SCOPE = "out_of_scope"
