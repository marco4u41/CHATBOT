"""Tests for garage CRUD endpoints and cross-user authorization."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.domain.models.user import User
from datetime import UTC, datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_token(user_id: str, email: str = "user@test.com") -> str:
    return create_access_token(user_id, email)


def _make_user(user_id: str, email: str | None = None) -> User:
    return User(
        id=user_id,
        email=email or f"{user_id}@test.com",
        password_hash="fake",
        display_name=user_id,
        is_active=True,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _build_garage_app(
    repo_mock: MagicMock | None = None,
    user: User | None = None,
) -> TestClient:
    from app.api.v1.garage import router, _get_garage_repo
    from app.infrastructure.database.connection import get_async_session
    from app.api.v1.auth import get_current_user

    app = FastAPI()
    app.include_router(router, prefix="/api")

    mock_repo = repo_mock or AsyncMock()

    async def override_session():
        yield MagicMock()

    async def override_current_user():
        return user or _make_user("user1")

    async def override_repo():
        return mock_repo

    app.dependency_overrides[get_async_session] = override_session
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[_get_garage_repo] = override_repo

    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# 1. Garage — Add vehicle
# ---------------------------------------------------------------------------

class TestGarageAddVehicle:
    def test_add_vehicle_success(self) -> None:
        mock_repo = AsyncMock()
        mock_repo.count_by_user = AsyncMock(return_value=0)

        created = MagicMock()
        created.id = "veh123"
        created.user_id = "user1"
        created.brand = "Toyota"
        created.model = "Corolla"
        created.year = 2023
        created.engine = "1.8L"
        created.transmission = ""
        created.fuel_type = ""
        created.mileage_km = None
        created.price_usd = None
        created.body_type = ""
        created.drive = ""
        created.condition = ""
        created.color = ""
        created.cylinders = None
        created.passengers = None
        created.consumption = ""
        created.notes = ""
        created.added_at = datetime.now(UTC)
        mock_repo.add = AsyncMock(return_value=created)

        client = _build_garage_app(mock_repo)

        resp = client.post(
            "/api/users/me/garage",
            json={
                "brand": "Toyota",
                "model": "Corolla",
                "year": 2023,
                "engine": "1.8L",
            },
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["brand"] == "Toyota"
        assert body["data"]["model"] == "Corolla"
        assert body["data"]["year"] == 2023
        mock_repo.add.assert_awaited_once()

    def test_add_vehicle_unauthorized(self) -> None:
        from app.api.v1.garage import router
        from app.api.v1.auth import get_current_user

        app = FastAPI()
        app.include_router(router, prefix="/api")

        # No override for get_current_user -> should fail
        client = TestClient(app, raise_server_exceptions=False)

        resp = client.post(
            "/api/users/me/garage",
            json={"brand": "Toyota", "model": "Corolla", "year": 2023},
        )

        assert resp.status_code in (401, 422)

    def test_add_vehicle_garage_full(self) -> None:
        mock_repo = AsyncMock()
        mock_repo.count_by_user = AsyncMock(return_value=20)

        client = _build_garage_app(mock_repo)

        resp = client.post(
            "/api/users/me/garage",
            json={"brand": "Toyota", "model": "Corolla", "year": 2023},
        )

        assert resp.status_code == 400
        assert "Garage lleno" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# 2. Garage — List vehicles
# ---------------------------------------------------------------------------

class TestGarageListVehicles:
    def test_list_empty_garage(self) -> None:
        mock_repo = AsyncMock()
        mock_repo.get_by_user = AsyncMock(return_value=[])

        client = _build_garage_app(mock_repo)

        resp = client.get("/api/users/me/garage")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"] == []

    def test_list_returns_vehicles(self) -> None:
        mock_repo = AsyncMock()
        v = MagicMock()
        v.id = "v1"
        v.user_id = "user1"
        v.brand = "Honda"
        v.model = "Civic"
        v.year = 2022
        v.engine = ""
        v.transmission = ""
        v.fuel_type = ""
        v.mileage_km = None
        v.price_usd = None
        v.body_type = ""
        v.drive = ""
        v.condition = ""
        v.color = ""
        v.cylinders = None
        v.passengers = None
        v.consumption = ""
        v.notes = ""
        v.added_at = datetime.now(UTC)
        mock_repo.get_by_user = AsyncMock(return_value=[v])

        client = _build_garage_app(mock_repo)

        resp = client.get("/api/users/me/garage")

        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 1
        assert resp.json()["data"][0]["brand"] == "Honda"


# ---------------------------------------------------------------------------
# 3. Garage — Delete vehicle
# ---------------------------------------------------------------------------

class TestGarageDeleteVehicle:
    def test_delete_success(self) -> None:
        mock_repo = AsyncMock()
        mock_repo.delete = AsyncMock(return_value=True)

        client = _build_garage_app(mock_repo)

        resp = client.delete("/api/users/me/garage/veh123")

        assert resp.status_code == 200
        assert resp.json()["success"] is True
        mock_repo.delete.assert_awaited_once_with("veh123", "user1")

    def test_delete_not_found(self) -> None:
        mock_repo = AsyncMock()
        mock_repo.delete = AsyncMock(return_value=False)

        client = _build_garage_app(mock_repo)

        resp = client.delete("/api/users/me/garage/nonexistent")

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 4. Cross-user authorization — Garage
# ---------------------------------------------------------------------------

class TestGarageAuthorization:
    def test_user_cannot_see_other_user_garage(self) -> None:
        mock_repo = AsyncMock()

        v_user_a = MagicMock()
        v_user_a.id = "v_a"
        v_user_a.user_id = "user_a"
        v_user_a.brand = "Toyota"
        v_user_a.model = "Corolla"
        v_user_a.year = 2023
        v_user_a.engine = ""
        v_user_a.transmission = ""
        v_user_a.fuel_type = ""
        v_user_a.mileage_km = None
        v_user_a.price_usd = None
        v_user_a.body_type = ""
        v_user_a.drive = ""
        v_user_a.condition = ""
        v_user_a.color = ""
        v_user_a.cylinders = None
        v_user_a.passengers = None
        v_user_a.consumption = ""
        v_user_a.notes = ""
        v_user_a.added_at = datetime.now(UTC)

        async def mock_get_by_user(user_id: str):
            if user_id == "user_a":
                return [v_user_a]
            return []

        mock_repo.get_by_user = AsyncMock(side_effect=mock_get_by_user)

        # User A sees their vehicle
        user_a = _make_user("user_a", "a@test.com")
        client_a = _build_garage_app(mock_repo, user_a)
        resp_a = client_a.get("/api/users/me/garage")
        assert resp_a.status_code == 200
        assert len(resp_a.json()["data"]) == 1

        # User B sees empty garage
        user_b = _make_user("user_b", "b@test.com")
        client_b = _build_garage_app(mock_repo, user_b)
        resp_b = client_b.get("/api/users/me/garage")
        assert resp_b.status_code == 200
        assert len(resp_b.json()["data"]) == 0

    def test_user_cannot_delete_other_user_vehicle(self) -> None:
        mock_repo = AsyncMock()

        async def mock_delete(vehicle_id: str, user_id: str):
            return user_id == "user_a" and vehicle_id == "v_a"

        mock_repo.delete = AsyncMock(side_effect=mock_delete)

        # User A can delete their own
        user_a = _make_user("user_a", "a@test.com")
        client_a = _build_garage_app(mock_repo, user_a)
        resp = client_a.delete("/api/users/me/garage/v_a")
        assert resp.status_code == 200

        # User B cannot delete user A's vehicle
        user_b = _make_user("user_b", "b@test.com")
        client_b = _build_garage_app(mock_repo, user_b)
        resp = client_b.delete("/api/users/me/garage/v_a")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 5. Cross-user authorization — Conversations
# ---------------------------------------------------------------------------

class TestConversationAuthorization:
    def test_unauthenticated_cannot_list_conversations(self) -> None:
        from app.main import create_app

        app = create_app()
        client = TestClient(app, raise_server_exceptions=False)

        resp = client.get("/api/conversations")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_delete_conversation(self) -> None:
        from app.main import create_app

        app = create_app()
        client = TestClient(app, raise_server_exceptions=False)

        resp = client.delete("/api/conversations/some_id")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_get_messages(self) -> None:
        from app.main import create_app

        app = create_app()
        client = TestClient(app, raise_server_exceptions=False)

        resp = client.get("/api/conversations/some_id/messages")
        assert resp.status_code == 401
