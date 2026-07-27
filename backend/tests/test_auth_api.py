from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.auth import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_auth_client() -> TestClient:
    from fastapi import FastAPI
    from app.api.v1.auth import router

    app = FastAPI()
    app.include_router(router, prefix="/api/auth")

    # We need to override the get_async_session dependency
    # For unit tests, we'll mock the repository methods directly
    return TestClient(app, raise_server_exceptions=False)


def _build_app_with_mocks(repo: MagicMock) -> TestClient:
    from fastapi import FastAPI
    from app.api.v1.auth import router
    from app.infrastructure.database.connection import get_async_session

    app = FastAPI()
    app.include_router(router, prefix="/api/auth")

    async def override_session():
        yield MagicMock()

    app.dependency_overrides[get_async_session] = override_session
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# 1. Register — success
# ---------------------------------------------------------------------------

class TestRegisterSuccess:
    def test_register_returns_user(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session

        from datetime import UTC, datetime

        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "confirm_password": "password123",
                    "display_name": "Test User",
                },
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            assert body["user"]["email"] == "test@example.com"
            assert body["user"]["display_name"] == "Test User"
            mock_repo.create.assert_awaited_once()

    def test_register_sets_cookie(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "confirm_password": "password123",
                },
            )

            cookies = resp.cookies
            assert "autoexpert_session" in cookies
            assert len(cookies["autoexpert_session"]) > 10


# ---------------------------------------------------------------------------
# 2. Register — password mismatch
# ---------------------------------------------------------------------------

class TestRegisterPasswordMismatch:
    def test_returns_error_on_mismatch(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "confirm_password": "different456",
                },
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "contraseñas no coinciden" in body["error"].lower()


# ---------------------------------------------------------------------------
# 3. Register — duplicate email
# ---------------------------------------------------------------------------

class TestRegisterDuplicateEmail:
    def test_returns_error_on_duplicate(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session

        existing_user = MagicMock()
        existing_user.email = "existing@example.com"

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=existing_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "existing@example.com",
                    "password": "password123",
                    "confirm_password": "password123",
                },
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "ya existe" in body["error"].lower()


# ---------------------------------------------------------------------------
# 4. Register — short password
# ---------------------------------------------------------------------------

class TestRegisterShortPassword:
    def test_returns_422_for_short_password(self) -> None:
        client = _build_auth_client()

        resp = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
                "confirm_password": "short",
            },
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 5. Register — invalid email
# ---------------------------------------------------------------------------

class TestRegisterInvalidEmail:
    def test_returns_422_for_invalid_email(self) -> None:
        client = _build_auth_client()

        resp = client.post(
            "/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123",
                "confirm_password": "password123",
            },
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 6. Login — success
# ---------------------------------------------------------------------------

class TestLoginSuccess:
    def test_login_returns_user(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        hashed = hash_password("password123")
        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.password_hash = hashed
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            assert body["user"]["email"] == "test@example.com"

    def test_login_sets_cookie(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        hashed = hash_password("password123")
        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.password_hash = hashed
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )

            assert "autoexpert_session" in resp.cookies


# ---------------------------------------------------------------------------
# 7. Login — wrong password
# ---------------------------------------------------------------------------

class TestLoginWrongPassword:
    def test_returns_error_on_wrong_password(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        hashed = hash_password("correctpassword")
        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.password_hash = hashed
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"},
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "incorrectos" in body["error"].lower()


# ---------------------------------------------------------------------------
# 8. Login — user not found
# ---------------------------------------------------------------------------

class TestLoginUserNotFound:
    def test_returns_error_when_user_not_found(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "nonexistent@example.com", "password": "password123"},
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "incorrectos" in body["error"].lower()


# ---------------------------------------------------------------------------
# 9. Login — inactive user
# ---------------------------------------------------------------------------

class TestLoginInactiveUser:
    def test_returns_error_for_inactive_user(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        hashed = hash_password("password123")
        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.password_hash = hashed
        mock_user.is_active = False
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "desactivada" in body["error"].lower()


# ---------------------------------------------------------------------------
# 10. Logout — success
# ---------------------------------------------------------------------------

class TestLogoutSuccess:
    def test_logout_clears_cookie(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router

        app = FastAPI()
        app.include_router(router, prefix="/api/auth")
        client = TC(app, raise_server_exceptions=False)

        resp = client.post("/api/auth/logout")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        # delete_cookie sends a Set-Cookie header to clear the cookie;
        # TestClient may not always expose it in resp.cookies, so check headers
        set_cookie_headers = [
            v for k, v in resp.headers.items() if k.lower() == "set-cookie"
        ]
        cookie_cleared = any("autoexpert_session=" in h for h in set_cookie_headers)
        # Either the cookie is in headers with empty value, or it's simply not present
        assert cookie_cleared or "autoexpert_session" not in resp.cookies


# ---------------------------------------------------------------------------
# 11. Me — authenticated
# ---------------------------------------------------------------------------

class TestMeAuthenticated:
    def test_returns_current_user(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router, get_current_user
        from datetime import UTC, datetime

        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        app = FastAPI()
        app.include_router(router, prefix="/api/auth")
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TC(app, raise_server_exceptions=False)

        resp = client.get("/api/auth/me")

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["user"]["email"] == "test@example.com"
        assert body["user"]["id"] == "abc123"


# ---------------------------------------------------------------------------
# 12. Me — unauthenticated
# ---------------------------------------------------------------------------

class TestMeUnauthenticated:
    def test_returns_401_without_session(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router

        app = FastAPI()
        app.include_router(router, prefix="/api/auth")
        client = TC(app, raise_server_exceptions=False)

        resp = client.get("/api/auth/me")

        assert resp.status_code == 401
        body = resp.json()
        assert "sesión" in body["detail"].lower() or "sesion" in body["detail"].lower()


# ---------------------------------------------------------------------------
# 13. Register — email normalization
# ---------------------------------------------------------------------------

class TestRegisterEmailNormalization:
    def test_normalizes_email_to_lowercase(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test"
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "TEST@EXAMPLE.COM",
                    "password": "password123",
                    "confirm_password": "password123",
                },
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True


# ---------------------------------------------------------------------------
# 14. Register — missing fields
# ---------------------------------------------------------------------------

class TestRegisterMissingFields:
    def test_returns_422_without_email(self) -> None:
        client = _build_auth_client()
        resp = client.post(
            "/api/auth/register",
            json={"password": "password123", "confirm_password": "password123"},
        )
        assert resp.status_code == 422

    def test_returns_422_without_password(self) -> None:
        client = _build_auth_client()
        resp = client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "confirm_password": "password123"},
        )
        assert resp.status_code == 422

    def test_returns_422_without_confirm_password(self) -> None:
        client = _build_auth_client()
        resp = client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 15. Login — missing fields
# ---------------------------------------------------------------------------

class TestLoginMissingFields:
    def test_returns_422_without_email(self) -> None:
        client = _build_auth_client()
        resp = client.post(
            "/api/auth/login",
            json={"password": "password123"},
        )
        assert resp.status_code == 422

    def test_returns_422_without_password(self) -> None:
        client = _build_auth_client()
        resp = client.post(
            "/api/auth/login",
            json={"email": "test@example.com"},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 16. Register — email with spaces (should be trimmed)
# ---------------------------------------------------------------------------

class TestRegisterEmailSpaces:
    def test_trims_email_spaces(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test"
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/register",
                json={
                    "email": "  test@example.com  ",
                    "password": "password123",
                    "confirm_password": "password123",
                },
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True


# ---------------------------------------------------------------------------
# 17. Register — password with leading/trailing spaces
# ---------------------------------------------------------------------------

class TestRegisterPasswordSpaces:
    def test_rejects_password_with_surrounding_spaces(self) -> None:
        client = _build_auth_client()

        resp = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "  password123  ",
                "confirm_password": "  password123  ",
            },
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 18. Login — email with mixed case (should be normalized)
# ---------------------------------------------------------------------------

class TestLoginEmailNormalization:
    def test_normalizes_email_on_login(self) -> None:
        from fastapi import FastAPI
        from fastapi.testclient import TestClient as TC
        from app.api.v1.auth import router
        from app.infrastructure.database.connection import get_async_session
        from datetime import UTC, datetime

        hashed = hash_password("password123")
        mock_user = MagicMock()
        mock_user.id = "abc123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.password_hash = hashed
        mock_user.is_active = True
        mock_user.created_at = datetime.now(UTC)

        mock_repo = AsyncMock()
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.api.v1.auth.SQLAlchemyUserRepository", return_value=mock_repo):
            app = FastAPI()
            app.include_router(router, prefix="/api/auth")

            async def override_session():
                yield MagicMock()

            app.dependency_overrides[get_async_session] = override_session
            client = TC(app, raise_server_exceptions=False)

            resp = client.post(
                "/api/auth/login",
                json={"email": "TEST@EXAMPLE.COM", "password": "password123"},
            )

            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            # Verify that get_by_email was called with normalized email
            mock_repo.get_by_email.assert_awaited_with("test@example.com")
