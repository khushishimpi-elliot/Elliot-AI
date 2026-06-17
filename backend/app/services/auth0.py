import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import issue_access_token
from app.config import get_settings
from app.models import User

logger = logging.getLogger(__name__)


class Auth0Service:
    """Auth0 OAuth service for SSO integration"""

    def __init__(self):
        self.settings = get_settings()

    def get_authorization_url(self, state: str) -> str | None:
        """Build Auth0 authorization URL"""
        if not self.settings.auth0_domain:
            return None

        params = {
            "response_type": "code",
            "client_id": self.settings.auth0_client_id,
            "redirect_uri": self.settings.auth0_callback_url,
            "scope": "openid profile email",
            "state": state,
        }

        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://{self.settings.auth0_domain}/authorize?{query_string}"

    async def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.settings.auth0_domain}/oauth/token",
                json={
                    "client_id": self.settings.auth0_client_id,
                    "client_secret": self.settings.auth0_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.settings.auth0_callback_url,
                },
            )

            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.status_code}")

            return response.json()

    async def get_user_info(self, access_token: str) -> dict:
        """Get user info from Auth0"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{self.settings.auth0_domain}/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code != 200:
                logger.error(f"User info fetch failed: {response.text}")
                raise ValueError(f"User info fetch failed: {response.status_code}")

            return response.json()

    async def create_or_get_user(
        self, db: AsyncSession, tenant_id: UUID, user_info: dict
    ) -> dict:
        """Create or get user from database"""
        email = user_info.get("email")

        if not email:
            raise ValueError("Email not provided in user info")

        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                tenant_id=tenant_id,
                email=email,
                role="developer",
                sso_provider="auth0",
                last_active=datetime.now(timezone.utc),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "tenant_id": str(user.tenant_id),
            "sso_provider": user.sso_provider,
        }

    def create_jwt(self, user: dict) -> str:
        """Create JWT token for user"""
        # Use the JWT issuing function from auth module
        token, _ = issue_access_token(user["email"])
        return token

    def get_logout_url(self, return_to: str | None = None) -> str:
        """Build Auth0 logout URL"""
        if not self.settings.auth0_domain:
            return "/"

        return_to = return_to or self.settings.terminal_url
        return (
            f"https://{self.settings.auth0_domain}/v2/logout?"
            f"client_id={self.settings.auth0_client_id}&"
            f"returnTo={return_to}"
        )
