from __future__ import annotations

from app.domain.agent.capabilities.comparison import ComparisonCapability
from app.domain.agent.capabilities.recommendation import RecommendationCapability
from app.domain.agent.capability import CapabilityContext


class TestRecommendationCapabilityAutomotive:
    def test_includes_automotive_data_when_present(self) -> None:
        cap = RecommendationCapability()
        ctx = CapabilityContext(
            user_message="recomiéndame un auto",
            automotive_data="[VEHICLE_SEARCH_RESULTS]\nResultados: 2",
        )

        result = cap.get_system_prompt_enhancement(ctx)

        assert "DATOS AUTOMOTRICES" in result
        assert "[VEHICLE_SEARCH_RESULTS]" in result

    def test_no_automotive_data_returns_base_only(self) -> None:
        cap = RecommendationCapability()
        ctx = CapabilityContext(user_message="recomiéndame un auto")

        result = cap.get_system_prompt_enhancement(ctx)

        assert "DATOS AUTOMOTRICES" not in result


class TestComparisonCapabilityAutomotive:
    def test_includes_automotive_data_when_present(self) -> None:
        cap = ComparisonCapability()
        ctx = CapabilityContext(
            user_message="compara Honda y Toyota",
            automotive_data="[VEHICLE_DETAILS]\nHonda Civic",
        )

        result = cap.get_system_prompt_enhancement(ctx)

        assert "DATOS AUTOMOTRICES" in result
        assert "[VEHICLE_DETAILS]" in result

    def test_no_automotive_data_returns_base_only(self) -> None:
        cap = ComparisonCapability()
        ctx = CapabilityContext(user_message="compara Honda y Toyota")

        result = cap.get_system_prompt_enhancement(ctx)

        assert "DATOS AUTOMOTRICES" not in result
