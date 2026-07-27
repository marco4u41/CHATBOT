from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.domain.models.automotive import BrandSummary

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _brand(**overrides: object) -> BrandSummary:
    defaults: dict[str, object] = {
        "brand_id": 1,
        "manufacturer": "Toyota",
        "model_count": 15,
        "year_count": 10,
        "total_listings": 5000,
        "average_price": 32000.0,
    }
    defaults.update(overrides)
    return BrandSummary(**defaults)  # type: ignore[arg-type]


def _make_repo(**methods: object) -> MagicMock:
    repo = MagicMock()
    for name, impl in methods.items():
        if isinstance(impl, AsyncMock):
            setattr(repo, name, impl)
        else:
            setattr(repo, name, AsyncMock(return_value=impl))
    return repo


def _build_client(
    auto_repo: MagicMock | None = None,
    conv_repo: MagicMock | None = None,
) -> TestClient:
    from fastapi import FastAPI

    from app.api.v1.analytics import router
    from app.dependencies import get_automotive_repo, get_conversation_repo

    if auto_repo is None:
        auto_repo = _make_repo()
    if conv_repo is None:
        conv_repo = _make_repo()

    app = FastAPI()
    app.include_router(router, prefix="/api/analytics")
    app.dependency_overrides[get_automotive_repo] = (
        lambda: auto_repo
    )
    app.dependency_overrides[get_conversation_repo] = (
        lambda: conv_repo
    )
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# 1. Overview — success
# ---------------------------------------------------------------------------

class TestOverviewSuccess:
    def test_returns_combined_overview(self) -> None:
        auto_repo = _make_repo(
            vehicle_overview={
                "total_vehicles": 47030,
                "avg_price": 35000.0,
                "total_brands": 40,
                "total_models": 500,
            },
        )
        conv_repo = _make_repo(
            conversation_overview={
                "total_conversations": 120,
                "total_messages": 480,
                "avg_messages_per_conversation": 4.0,
            },
        )
        client = _build_client(auto_repo, conv_repo)

        resp = client.get("/api/analytics/overview")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["vehicles"]["total_vehicles"] == 47030
        assert body["vehicles"]["total_brands"] == 40
        assert body["conversations"]["total_conversations"] == 120
        assert body["conversations"]["avg_messages_per_conversation"] == 4.0


# ---------------------------------------------------------------------------
# 2. Overview — database error
# ---------------------------------------------------------------------------

class TestOverviewError:
    def test_returns_503_on_exception(self) -> None:
        auto_repo = _make_repo(
            vehicle_overview=AsyncMock(
                side_effect=RuntimeError("db down"),
            ),
        )
        conv_repo = _make_repo()
        client = _build_client(auto_repo, conv_repo)

        resp = client.get("/api/analytics/overview")

        assert resp.status_code == 503
        body = resp.json()
        assert body["success"] is False


# ---------------------------------------------------------------------------
# 3. By Type
# ---------------------------------------------------------------------------

class TestByType:
    def test_returns_type_distribution(self) -> None:
        data = [
            {
                "vehicle_type": "sedan",
                "count": 15000,
                "avg_price": 28000.0,
            },
            {
                "vehicle_type": "suv",
                "count": 12000,
                "avg_price": 42000.0,
            },
            {
                "vehicle_type": None,
                "count": 500,
                "avg_price": None,
            },
        ]
        auto_repo = _make_repo(count_by_type=data)
        client = _build_client(auto_repo)

        resp = client.get("/api/analytics/vehicles/by-type")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 3
        assert body["data"][0]["vehicle_type"] == "sedan"
        assert body["data"][0]["count"] == 15000
        assert body["data"][2]["vehicle_type"] is None

    def test_returns_503_on_error(self) -> None:
        auto_repo = _make_repo(
            count_by_type=AsyncMock(
                side_effect=RuntimeError("boom"),
            ),
        )
        client = _build_client(auto_repo)

        resp = client.get("/api/analytics/vehicles/by-type")

        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# 4. By Fuel
# ---------------------------------------------------------------------------

class TestByFuel:
    def test_returns_fuel_distribution(self) -> None:
        data = [
            {
                "fuel": "gasoline",
                "count": 30000,
                "avg_price": 30000.0,
            },
            {
                "fuel": "electric",
                "count": 3000,
                "avg_price": 55000.0,
            },
        ]
        auto_repo = _make_repo(count_by_fuel=data)
        client = _build_client(auto_repo)

        resp = client.get("/api/analytics/vehicles/by-fuel")

        assert resp.status_code == 200
        body = resp.json()
        assert body["count"] == 2
        assert body["data"][0]["fuel"] == "gasoline"


# ---------------------------------------------------------------------------
# 5. By Transmission
# ---------------------------------------------------------------------------

class TestByTransmission:
    def test_returns_transmission_distribution(
        self,
    ) -> None:
        data = [
            {"transmission": "automatic", "count": 35000},
            {"transmission": "manual", "count": 8000},
        ]
        auto_repo = _make_repo(count_by_transmission=data)
        client = _build_client(auto_repo)

        resp = client.get(
            "/api/analytics/vehicles/by-transmission",
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["count"] == 2
        assert body["data"][0]["transmission"] == "automatic"
        assert body["data"][0]["count"] == 35000


# ---------------------------------------------------------------------------
# 6. By Year
# ---------------------------------------------------------------------------

class TestByYear:
    def test_returns_year_stats(self) -> None:
        data = [
            {"year": 2020, "count": 8000, "avg_price": 32000.0},
            {"year": 2023, "count": 12000, "avg_price": 38000.0},
        ]
        auto_repo = _make_repo(avg_price_by_year=data)
        client = _build_client(auto_repo)

        resp = client.get("/api/analytics/vehicles/by-year")

        assert resp.status_code == 200
        body = resp.json()
        assert body["count"] == 2
        assert body["data"][0]["year"] == 2020
        assert body["data"][1]["avg_price"] == 38000.0


# ---------------------------------------------------------------------------
# 7. Price Distribution
# ---------------------------------------------------------------------------

class TestPriceDistribution:
    def test_returns_price_ranges(self) -> None:
        data = [
            {"price_range": "0-10000", "count": 500},
            {"price_range": "10000-20000", "count": 8000},
            {"price_range": "20000-30000", "count": 12000},
            {"price_range": "30000-50000", "count": 15000},
            {"price_range": "50000-75000", "count": 7000},
            {"price_range": "75000-100000", "count": 3000},
            {"price_range": "100000+", "count": 1530},
        ]
        auto_repo = _make_repo(price_distribution=data)
        client = _build_client(auto_repo)

        resp = client.get(
            "/api/analytics/vehicles/price-distribution",
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["count"] == 7
        assert body["data"][0]["price_range"] == "0-10000"
        assert body["data"][6]["count"] == 1530


# ---------------------------------------------------------------------------
# 8. Brands Top
# ---------------------------------------------------------------------------

class TestBrandsTop:
    def test_returns_top_brands(self) -> None:
        data = [
            _brand(),
            _brand(
                brand_id=2,
                manufacturer="Honda",
                total_listings=4000,
            ),
        ]
        auto_repo = _make_repo(brand_ranking=data)
        client = _build_client(auto_repo)

        resp = client.get("/api/analytics/brands/top")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 2
        assert body["limit"] == 10
        assert body["data"][0]["manufacturer"] == "Toyota"

    def test_passes_limit_param(self) -> None:
        auto_repo = _make_repo(brand_ranking=[])
        client = _build_client(auto_repo)

        client.get(
            "/api/analytics/brands/top",
            params={"limit": 25},
        )

        auto_repo.brand_ranking.assert_awaited_once_with(
            limit=25,
        )

    def test_limit_min_validation(self) -> None:
        auto_repo = _make_repo()
        client = _build_client(auto_repo)

        resp = client.get(
            "/api/analytics/brands/top",
            params={"limit": 0},
        )
        assert resp.status_code == 422

    def test_limit_max_validation(self) -> None:
        auto_repo = _make_repo()
        client = _build_client(auto_repo)

        resp = client.get(
            "/api/analytics/brands/top",
            params={"limit": 51},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 9. Conversations Overview
# ---------------------------------------------------------------------------

class TestConversationsOverview:
    def test_returns_conversation_stats(self) -> None:
        conv_repo = _make_repo(
            conversation_overview={
                "total_conversations": 200,
                "total_messages": 1000,
                "avg_messages_per_conversation": 5.0,
            },
        )
        client = _build_client(conv_repo=conv_repo)

        resp = client.get(
            "/api/analytics/conversations/overview",
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["total_conversations"] == 200
        assert body["total_messages"] == 1000
        assert body["avg_messages_per_conversation"] == 5.0

    def test_empty_database(self) -> None:
        conv_repo = _make_repo(
            conversation_overview={
                "total_conversations": 0,
                "total_messages": 0,
                "avg_messages_per_conversation": 0.0,
            },
        )
        client = _build_client(conv_repo=conv_repo)

        resp = client.get(
            "/api/analytics/conversations/overview",
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total_conversations"] == 0

    def test_returns_503_on_error(self) -> None:
        conv_repo = _make_repo(
            conversation_overview=AsyncMock(
                side_effect=RuntimeError("boom"),
            ),
        )
        client = _build_client(conv_repo=conv_repo)

        resp = client.get(
            "/api/analytics/conversations/overview",
        )

        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# 10. Error handling across endpoints
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_by_type_error(self) -> None:
        repo = _make_repo(
            count_by_type=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get("/api/analytics/vehicles/by-type")
        assert resp.status_code == 503

    def test_by_fuel_error(self) -> None:
        repo = _make_repo(
            count_by_fuel=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get("/api/analytics/vehicles/by-fuel")
        assert resp.status_code == 503

    def test_by_transmission_error(self) -> None:
        repo = _make_repo(
            count_by_transmission=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get(
            "/api/analytics/vehicles/by-transmission",
        )
        assert resp.status_code == 503

    def test_by_year_error(self) -> None:
        repo = _make_repo(
            avg_price_by_year=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get("/api/analytics/vehicles/by-year")
        assert resp.status_code == 503

    def test_price_distribution_error(self) -> None:
        repo = _make_repo(
            price_distribution=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get(
            "/api/analytics/vehicles/price-distribution",
        )
        assert resp.status_code == 503

    def test_brands_top_error(self) -> None:
        repo = _make_repo(
            brand_ranking=AsyncMock(
                side_effect=RuntimeError("fail"),
            ),
        )
        client = _build_client(repo)
        resp = client.get("/api/analytics/brands/top")
        assert resp.status_code == 503
