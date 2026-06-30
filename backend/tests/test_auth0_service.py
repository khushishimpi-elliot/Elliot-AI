"""Tests for Auth0 OAuth service"""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.auth0 import Auth0Service


@pytest.fixture
def auth0_service():
    return Auth0Service()


class TestAuth0TokenExchange:
    """Test Auth0 token exchange with form-encoded data"""

    @patch("app.services.auth0.httpx.AsyncClient")
    async def test_exchange_code_uses_form_encoded_data(self, mock_client_class):
        """Verify that token exchange uses form-encoded data, not JSON"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "test_access_token",
            "id_token": "test_id_token",
            "token_type": "Bearer",
        }
        mock_client.post.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client

        service = Auth0Service()
        result = await service.exchange_code_for_token("test_code")

        assert result["access_token"] == "test_access_token"
        assert "id_token" in result
        assert mock_client.post.called

    @patch("app.services.auth0.httpx.AsyncClient")
    async def test_exchange_code_error_handling(self, mock_client_class):
        """Verify proper error handling for token exchange failures"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "unauthorized"
        mock_client.post.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client

        service = Auth0Service()
        with pytest.raises(ValueError, match="Token exchange failed"):
            await service.exchange_code_for_token("invalid_code")


class TestAuth0UserInfo:
    """Test Auth0 user info retrieval"""

    @patch("app.services.auth0.httpx.AsyncClient")
    async def test_get_user_info_success(self, mock_client_class):
        """Verify user info retrieval with valid token"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "sub": "auth0|123",
            "email": "test@elliotsystems.com",
            "name": "Test User",
        }
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client

        service = Auth0Service()
        result = await service.get_user_info("valid_token")

        assert result["email"] == "test@elliotsystems.com"
        assert result["sub"] == "auth0|123"

    @patch("app.services.auth0.httpx.AsyncClient")
    async def test_get_user_info_error(self, mock_client_class):
        """Verify error handling when user info fetch fails"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "unauthorized"
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client

        service = Auth0Service()
        with pytest.raises(ValueError, match="User info fetch failed"):
            await service.get_user_info("invalid_token")


class TestAuth0CreateOrGetUser:
    """Test Auth0 user creation/retrieval from database"""

    @pytest.mark.asyncio
    async def test_create_new_user_from_auth0(self):
        """Verify new user creation from Auth0 info"""
        from unittest.mock import MagicMock

        from sqlalchemy.ext.asyncio import AsyncSession

        # Mock the database session
        mock_db = AsyncMock(spec=AsyncSession)
        mock_db.execute = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Mock the query result (no existing user)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        service = Auth0Service()
        tenant_id = uuid4()
        user_info = {
            "sub": "auth0|123",
            "email": "newuser@elliotsystems.com",
            "name": "New User",
        }

        user = await service.create_or_get_user(mock_db, tenant_id, user_info)

        assert user["email"] == "newuser@elliotsystems.com"
        assert user["tenant_id"] == str(tenant_id)
        assert user["role"] == "developer"
        assert user["sso_provider"] == "auth0"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
