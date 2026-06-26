import secrets
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.connector import ConnectorAuthorizeResponse, ConnectorResponse
from app.services.connector_registry import get_connector_config
from app.services.oauth import (
    encrypt_token,
    exchange_code_for_token,
    get_authorization_url,
)

router = APIRouter(prefix="/connectors", tags=["connectors"])

# Simple in-memory state storage for OAuth flow
# In production, use Redis or DB
oauth_states = {}


@router.get("/{tenant_id}", response_model=list[ConnectorResponse])
async def list_connectors(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all connectors for a tenant"""
    result = await db.execute(
        select(Connector).where(Connector.tenant_id == tenant_id)
    )
    return result.scalars().all()


@router.get(
    "/{tenant_id}/{provider}/authorize",
    response_model=ConnectorAuthorizeResponse,
)
async def authorize_connector(
    tenant_id: uuid.UUID,
    provider: str,
):
    """Get OAuth authorization URL for a provider"""
    try:
        config = get_connector_config(provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    state = secrets.token_urlsafe(32)
    oauth_states[state] = {"tenant_id": str(tenant_id), "provider": provider}

    auth_url = get_authorization_url(config, state)
    return ConnectorAuthorizeResponse(authorization_url=auth_url)


@router.get("/callback/{provider}")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback from provider"""
    if state not in oauth_states:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    state_data = oauth_states.pop(state)
    tenant_id = uuid.UUID(state_data["tenant_id"])

    try:
        config = get_connector_config(provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        token_response = await exchange_code_for_token(config, code)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Token exchange failed: {str(e)}"
        ) from e

    access_token = token_response.get("access_token")
    refresh_token = token_response.get("refresh_token")

    if not access_token:
        raise HTTPException(
            status_code=400, detail="No access token in response"
        )

    encrypted_token = encrypt_token(access_token)
    encrypted_refresh = (
        encrypt_token(refresh_token) if refresh_token else None
    )

    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id) & (Connector.provider == provider)
        )
    )
    connector = result.scalar_one_or_none()

    if connector:
        connector.oauth_token = encrypted_token
        connector.oauth_refresh_token = encrypted_refresh
        connector.status = "connected"
        connector.scopes = config.scopes
    else:
        connector = Connector(
            tenant_id=tenant_id,
            provider=provider,
            status="connected",
            oauth_token=encrypted_token,
            oauth_refresh_token=encrypted_refresh,
            scopes=config.scopes,
        )
        db.add(connector)

    await db.commit()

    settings = get_settings()
    redirect_url = (
        f"{settings.terminal_url}/connectors/callback?"
        f"{urlencode({'provider': provider, 'status': 'success'})}"
    )
    return RedirectResponse(url=redirect_url)


@router.delete("/{tenant_id}/{provider}")
async def disconnect_connector(
    tenant_id: uuid.UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a connector"""
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id) & (Connector.provider == provider)
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    connector.status = "not_connected"
    connector.oauth_token = None
    connector.oauth_refresh_token = None
    await db.commit()

    return {"status": "disconnected"}
