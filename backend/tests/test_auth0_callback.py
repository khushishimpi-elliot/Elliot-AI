"""Integration tests for Auth0 callback flow"""
from unittest.mock import MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.auth import oauth_state
from app.main import app

client = TestClient(app)


class TestAuth0CallbackIntegration:
    """Integration tests for Auth0 OAuth callback"""

    @patch("app.services.auth0.Auth0Service.exchange_code_for_token")
    @patch("app.services.auth0.Auth0Service.get_user_info")
    @patch("app.services.auth0.Auth0Service.create_or_get_user")
    def test_auth0_callback_success(
        self, mock_create_user, mock_get_user_info, mock_exchange_token
    ):
        """Test successful Auth0 callback flow"""
        # Setup mocks
        tenant_id = uuid4()
        mock_exchange_token.return_value = {
            "access_token": "test_access_token",
            "id_token": "test_id_token",
            "token_type": "Bearer",
        }
        mock_get_user_info.return_value = {
            "sub": "auth0|123",
            "email": "test@elliotsystems.com",
            "name": "Test User",
        }
        mock_create_user.return_value = {
            "id": str(uuid4()),
            "email": "test@elliotsystems.com",
            "role": "developer",
            "tenant_id": str(tenant_id),
            "sso_provider": "auth0",
        }

        # Create a valid state token
        state = oauth_state.issue()

        # Make callback request
        response = client.get(
            "/auth/auth0/callback",
            params={"code": "test_code", "state": state},
        )

        assert response.status_code == 200
        data = response.json()
        assert "jwt_token" in data
        assert data["user"]["email"] == "test@elliotsystems.com"
        assert data["user"]["role"] == "developer"
        assert "message" in data

    @patch("app.auth.oauth_state.consume")
    def test_auth0_callback_invalid_state(self, mock_consume):
        """Test callback with invalid state"""
        mock_consume.return_value = False

        response = client.get(
            "/auth/auth0/callback",
            params={"code": "test_code", "state": "invalid_state"},
        )

        assert response.status_code == 400
        assert "Invalid or expired state" in response.json()["detail"]

    @patch("app.services.auth0.Auth0Service.exchange_code_for_token")
    def test_auth0_callback_token_exchange_failure(self, mock_exchange_token):
        """Test callback with token exchange failure"""
        mock_exchange_token.side_effect = ValueError("Token exchange failed: 401")

        # Create a valid state token
        state = oauth_state.issue()

        response = client.get(
            "/auth/auth0/callback",
            params={"code": "invalid_code", "state": state},
        )

        assert response.status_code == 400
        assert "Token exchange failed" in response.json()["detail"]

    @patch("app.services.auth0.Auth0Service.exchange_code_for_token")
    @patch("app.services.auth0.Auth0Service.get_user_info")
    def test_auth0_callback_user_info_failure(
        self, mock_get_user_info, mock_exchange_token
    ):
        """Test callback with user info fetch failure"""
        mock_exchange_token.return_value = {
            "access_token": "test_access_token",
            "token_type": "Bearer",
        }
        mock_get_user_info.side_effect = ValueError("User info fetch failed: 401")

        # Create a valid state token
        state = oauth_state.issue()

        response = client.get(
            "/auth/auth0/callback",
            params={"code": "test_code", "state": state},
        )

        assert response.status_code == 400
        assert "User info fetch failed" in response.json()["detail"]

    def test_auth0_callback_not_configured(self):
        """Test callback when Auth0 is not configured"""
        with patch("app.auth.router.get_settings") as mock_get_settings:
            mock_settings = MagicMock()
            mock_settings.auth0_domain = ""
            mock_get_settings.return_value = mock_settings

            response = client.get(
                "/auth/auth0/callback",
                params={"code": "test_code", "state": "test_state"},
            )

            assert response.status_code == 503
            assert "Auth0 not configured" in response.json()["detail"]


