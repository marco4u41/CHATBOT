"""Optional API integration tests for automotive endpoints.

These tests run ONLY when RUN_DB_INTEGRATION_TESTS=true is set.
They test the full HTTP stack against the real autoexpert_db database.
All operations are read-only — no data is modified.
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_DB_INTEGRATION_TESTS", "").lower() != "true",
    reason="Set RUN_DB_INTEGRATION_TESTS=true to run",
)


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


class TestHealthEndpoint:
    def test_health_returns_200(self, client: TestClient) -> None:
        resp = client.get("/api/automotive/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["database"] == "autoexpert_db"
        assert isinstance(body["automotive_data_available"], bool)


class TestVehicleSearchEndpoint:
    def test_acura_search(self, client: TestClient) -> None:
        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"manufacturer": "Acura", "model": "3.0cl", "limit": 10},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] > 0
        assert all(v["manufacturer"] == "Acura" for v in body["data"])

    def test_no_results_returns_empty(self, client: TestClient) -> None:
        resp = client.get(
            "/api/automotive/vehicles/search",
            params={"manufacturer": "ZzzzzNonexistent"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] == 0
        assert body["data"] == []


class TestVehicleDetailsEndpoint:
    def test_acura_30cl_details(self, client: TestClient) -> None:
        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Acura", "model": "3.0cl"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] > 0
        years = sorted({v["year"] for v in body["data"]}, reverse=True)
        assert len(years) > 0

    def test_not_found_returns_404(self, client: TestClient) -> None:
        resp = client.get(
            "/api/automotive/vehicles/details",
            params={"manufacturer": "Zzzzz", "model": "Nonexistent"},
        )
        assert resp.status_code == 404
        assert resp.json()["success"] is False


class TestModelStatsEndpoint:
    def test_acura_30cl_stats(self, client: TestClient) -> None:
        resp = client.get(
            "/api/automotive/models/stats",
            params={"manufacturer": "Acura", "model": "3.0cl"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["manufacturer"] == "Acura"


class TestBrandEndpoints:
    def test_acura_brand(self, client: TestClient) -> None:
        resp = client.get("/api/automotive/brands/Acura")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["manufacturer"] == "Acura"
        assert body["data"]["total_listings"] is not None
        assert body["data"]["total_listings"] > 0

    def test_brand_list(self, client: TestClient) -> None:
        resp = client.get("/api/automotive/brands", params={"limit": 10})
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["count"] > 0
        assert body["count"] <= 10
