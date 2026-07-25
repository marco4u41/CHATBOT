from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.domain.models.automotive import BrandSummary, VehicleMarketSummary, VehicleSummary

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _vehicle(**overrides: object) -> VehicleSummary:
    defaults: dict[str, object] = {
        "vehicle_id": 1,
        "vehicle_name": "Acura MDX 2023",
        "manufacturer": "Acura",
        "model": "mdx",
        "year": 2023,
        "listing_count": 50,
        "price_mean": 45000.0,
        "price_median": 43000.0,
        "price_min": 35000.0,
        "price_max": 55000.0,
        "odometer_mean": 30000.0,
        "fuel": "gasoline",
        "transmission": "automatic",
        "condition": "excellent",
        "vehicle_type": "suv",
    }
    defaults.update(overrides)
    return VehicleSummary(**defaults)  # type: ignore[arg-type]


def _brand(**overrides: object) -> BrandSummary:
    defaults: dict[str, object] = {
        "brand_id": 1,
        "manufacturer": "Acura",
        "model_count": 5,
        "year_count": 10,
        "total_listings": 1200,
        "average_price": 42000.0,
    }
    defaults.update(overrides)
    return BrandSummary(**defaults)  # type: ignore[arg-type]


def _market_stats(**overrides: object) -> VehicleMarketSummary:
    defaults: dict[str, object] = {
        "id": 1,
        "manufacturer": "Acura",
        "model": "mdx",
        "years_available": 5,
        "oldest_year": 2019,
        "newest_year": 2023,
        "total_listings": 800,
        "overall_price_mean": 44000.0,
        "overall_price_median": 42500.0,
        "fuel": "gasoline",
        "transmission": "automatic",
        "drive": "awd",
        "vehicle_type": "suv",
    }
    defaults.update(overrides)
    return VehicleMarketSummary(**defaults)  # type: ignore[arg-type]


def _make_repo(**methods: object) -> MagicMock:
    repo = MagicMock()
    for name, impl in methods.items():
        if isinstance(impl, AsyncMock):
            setattr(repo, name, impl)
        else:
            setattr(repo, name, AsyncMock(return_value=impl))
    return repo


def _build_client(repo: MagicMock) -> TestClient:
    from fastapi import FastAPI

    from app.api.v1.automotive import router
    from app.dependencies import get_automotive_repo

    app = FastAPI()
    app.include_router(router, prefix="/api/automotive")
    app.dependency_overrides[get_automotive_repo] = lambda: repo
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# 1. Health — success
# ---------------------------------------------------------------------------

class TestHealthSuccess:
    def test_returns_200_with_available_data(self) -> None:
        repo = _make_repo(health_check=True)
        client = _build_client(repo)

        resp = client.get("/api/automotive/health")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["database"] == "autoexpert_db"
        assert body["automotive_data_available"] is True


# ---------------------------------------------------------------------------
# 2. Health — database unavailable
# ---------------------------------------------------------------------------

class TestHealthUnavailable:
    def test_returns_503_on_exception(self) -> None:
        repo = _make_repo(health_check=AsyncMock(side_effect=RuntimeError("db down")))
        client = _build_client(repo)

        resp = client.get("/api/automotive/health")

        assert resp.status_code == 503
        body = resp.json()
        assert body["success"] is False
        assert "unavailable" in body["error"].lower()


# ---------------------------------------------------------------------------
# 3. Search — no filters
# ---------------------------------------------------------------------------

class TestSearchNoFilters:
    def test_returns_results(self) -> None:
        repo = _make_repo(search_vehicles=[_vehicle()])
        client = _build_client(repo)

        resp = client.get("/api/automotive/vehicles/search")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 1
        assert len(body["data"]) == 1
        assert body["data"][0]["manufacturer"] == "Acura"


# ---------------------------------------------------------------------------
# 4. Search — with manufacturer and model
# ---------------------------------------------------------------------------

class TestSearchWithFilters:
    def test_passes_filters_to_repo(self) -> None:
        repo = _make_repo(search_vehicles=[_vehicle()])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"manufacturer": "Acura", "model": "mdx", "limit": 5},
        )

        assert resp.status_code == 200
        repo.search_vehicles.assert_awaited_once_with(
            manufacturer="Acura",
            model="mdx",
            year=None,
            min_price=None,
            max_price=None,
            fuel=None,
            transmission=None,
            vehicle_type=None,
            limit=5,
            offset=0,
        )


# ---------------------------------------------------------------------------
# 5. Search — empty results
# ---------------------------------------------------------------------------

class TestSearchEmpty:
    def test_returns_empty_list_not_error(self) -> None:
        repo = _make_repo(search_vehicles=[])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"manufacturer": "Zzzz"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 0
        assert body["data"] == []


# ---------------------------------------------------------------------------
# 6. Search — min_price > max_price
# ---------------------------------------------------------------------------

class TestSearchInvalidPriceRange:
    def test_returns_422(self) -> None:
        repo = _make_repo()
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"min_price": 50000, "max_price": 20000},
        )

        assert resp.status_code == 422
        body = resp.json()
        assert body["success"] is False
        assert "min_price" in body["detail"]
        assert "max_price" in body["detail"]


# ---------------------------------------------------------------------------
# 7. Search — invalid limit
# ---------------------------------------------------------------------------

class TestSearchInvalidLimit:
    def test_limit_zero_returns_422(self) -> None:
        repo = _make_repo()
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"limit": 0},
        )

        assert resp.status_code == 422

    def test_limit_above_max_returns_422(self) -> None:
        repo = _make_repo()
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"limit": 100},
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 8. Search — invalid offset
# ---------------------------------------------------------------------------

class TestSearchInvalidOffset:
    def test_negative_offset_returns_422(self) -> None:
        repo = _make_repo()
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"offset": -1},
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 9. Details — found
# ---------------------------------------------------------------------------

class TestDetailsFound:
    def test_returns_vehicle_details(self) -> None:
        details = [_vehicle(year=2023), _vehicle(year=2022)]
        repo = _make_repo(get_vehicle_details=details)
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Acura", "model": "mdx"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 2
        assert body["manufacturer"] == "Acura"
        assert body["model"] == "mdx"


# ---------------------------------------------------------------------------
# 10. Details — not found
# ---------------------------------------------------------------------------

class TestDetailsNotFound:
    def test_returns_404(self) -> None:
        repo = _make_repo(get_vehicle_details=[])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Zzzz", "model": "nonexistent"},
        )

        assert resp.status_code == 404
        body = resp.json()
        assert body["success"] is False
        assert "zzzz nonexistent" in body["detail"].lower()


# ---------------------------------------------------------------------------
# 11. Model stats — found
# ---------------------------------------------------------------------------

class TestModelStatsFound:
    def test_returns_stats(self) -> None:
        repo = _make_repo(get_model_stats=_market_stats())
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/models/stats",
            params={"manufacturer": "Acura", "model": "mdx"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["manufacturer"] == "Acura"
        assert body["data"]["model"] == "mdx"


# ---------------------------------------------------------------------------
# 12. Model stats — not found
# ---------------------------------------------------------------------------

class TestModelStatsNotFound:
    def test_returns_404(self) -> None:
        repo = _make_repo(get_model_stats=None)
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/models/stats",
            params={"manufacturer": "Zzzz", "model": "nonexistent"},
        )

        assert resp.status_code == 404
        body = resp.json()
        assert body["success"] is False


# ---------------------------------------------------------------------------
# 13. Brand detail — found
# ---------------------------------------------------------------------------

class TestBrandDetailFound:
    def test_returns_brand(self) -> None:
        repo = _make_repo(get_brand_stats=_brand())
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands/Acura")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["manufacturer"] == "Acura"
        assert body["data"]["total_listings"] == 1200


# ---------------------------------------------------------------------------
# 14. Brand detail — not found
# ---------------------------------------------------------------------------

class TestBrandDetailNotFound:
    def test_returns_404(self) -> None:
        repo = _make_repo(get_brand_stats=None)
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands/ZzzzNonexistent")

        assert resp.status_code == 404
        body = resp.json()
        assert body["success"] is False
        assert "ZzzzNonexistent" in body["detail"]


# ---------------------------------------------------------------------------
# 15. Brand list
# ---------------------------------------------------------------------------

class TestBrandList:
    def test_returns_brands(self) -> None:
        brands = [_brand(), _brand(brand_id=2, manufacturer="Toyota")]
        repo = _make_repo(list_brands=brands)
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 2
        assert len(body["data"]) == 2

    def test_passes_limit_and_offset(self) -> None:
        repo = _make_repo(list_brands=[])
        client = _build_client(repo)

        client.get(
            "/api/automotive/brands",
            params={"limit": 10, "offset": 5},
        )

        repo.list_brands.assert_awaited_once_with(limit=10, offset=5)


# ---------------------------------------------------------------------------
# 16. Unexpected error — controlled
# ---------------------------------------------------------------------------

class TestUnexpectedError:
    def test_search_repo_exception_returns_503(self) -> None:
        repo = _make_repo(
            search_vehicles=AsyncMock(side_effect=RuntimeError("boom")),
        )
        client = _build_client(repo)

        resp = client.get("/api/automotive/vehicles/search")

        assert resp.status_code == 503
        body = resp.json()
        assert body["success"] is False
        assert "unavailable" in body["error"].lower()

    def test_details_repo_exception_returns_503(self) -> None:
        repo = _make_repo(
            get_vehicle_details=AsyncMock(side_effect=RuntimeError("boom")),
        )
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Acura", "model": "mdx"},
        )

        assert resp.status_code == 503

    def test_brand_repo_exception_returns_503(self) -> None:
        repo = _make_repo(
            get_brand_stats=AsyncMock(side_effect=RuntimeError("boom")),
        )
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands/Acura")

        assert resp.status_code == 503

    def test_model_stats_repo_exception_returns_503(self) -> None:
        repo = _make_repo(
            get_model_stats=AsyncMock(side_effect=RuntimeError("boom")),
        )
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/models/stats",
            params={"manufacturer": "Acura", "model": "mdx"},
        )

        assert resp.status_code == 503

    def test_brand_list_repo_exception_returns_503(self) -> None:
        repo = _make_repo(
            list_brands=AsyncMock(side_effect=RuntimeError("boom")),
        )
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands")

        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_details_with_year_filter(self) -> None:
        repo = _make_repo(get_vehicle_details=[_vehicle(year=2023)])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Acura", "model": "mdx", "year": 2023},
        )

        assert resp.status_code == 200
        repo.get_vehicle_details.assert_awaited_once_with("Acura", "mdx", 2023)

    def test_search_with_all_filters(self) -> None:
        repo = _make_repo(search_vehicles=[_vehicle()])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/search",
            params={
                "manufacturer": "Toyota",
                "model": "camry",
                "year": 2023,
                "min_price": 20000,
                "max_price": 30000,
                "fuel": "gasoline",
                "transmission": "automatic",
                "vehicle_type": "sedan",
                "limit": 3,
                "offset": 0,
            },
        )

        assert resp.status_code == 200
        repo.search_vehicles.assert_awaited_once_with(
            manufacturer="Toyota",
            model="camry",
            year=2023,
            min_price=20000,
            max_price=30000,
            fuel="gasoline",
            transmission="automatic",
            vehicle_type="sedan",
            limit=3,
            offset=0,
        )

    def test_brand_with_special_characters(self) -> None:
        repo = _make_repo(get_brand_stats=_brand(manufacturer="Alfa Romeo"))
        client = _build_client(repo)

        resp = client.get("/api/automotive/brands/Alfa%20Romeo")

        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["manufacturer"] == "Alfa Romeo"

    def test_details_with_year_not_found(self) -> None:
        repo = _make_repo(get_vehicle_details=[])
        client = _build_client(repo)

        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Acura", "model": "mdx", "year": 1990},
        )

        assert resp.status_code == 404

    def test_response_fields_no_extra_data(self) -> None:
        repo = _make_repo(search_vehicles=[_vehicle()])
        client = _build_client(repo)

        resp = client.get("/api/automotive/vehicles/search", params={"limit": 1})

        body = resp.json()
        vehicle = body["data"][0]
        assert "vehicle_id" in vehicle
        assert "manufacturer" in vehicle
        assert "price_mean" in vehicle
        assert "id" not in vehicle
        assert "created_at" not in vehicle

    def test_health_data_not_available(self) -> None:
        repo = _make_repo(health_check=False)
        client = _build_client(repo)

        resp = client.get("/api/automotive/health")

        assert resp.status_code == 200
        body = resp.json()
        assert body["automotive_data_available"] is False
