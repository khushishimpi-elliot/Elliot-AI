import logging
import secrets
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
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

logger = logging.getLogger(__name__)

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
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Handle OAuth callback from provider"""
    settings = get_settings()

    try:
        if state not in oauth_states:
            raise ValueError("Invalid or expired state")

        state_data = oauth_states.pop(state)
        tenant_id = uuid.UUID(state_data["tenant_id"])

        try:
            config = get_connector_config(provider)
        except ValueError as e:
            raise ValueError(f"Unknown provider: {str(e)}") from e

        try:
            token_response = await exchange_code_for_token(config, code)
        except Exception as e:
            raise ValueError(f"Token exchange failed: {str(e)}") from e

        access_token = token_response.get("access_token")
        refresh_token = token_response.get("refresh_token")

        if not access_token:
            raise ValueError("No access token in response")

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
        await db.refresh(connector)

        logger.info(f"Connected {provider} for tenant {tenant_id}, queuing indexing")
        if provider == "github":
            background_tasks.add_task(
                _index_github_background,
                tenant_id=tenant_id,
                connector_id=connector.id,
            )
        else:
            background_tasks.add_task(
                _index_connector_background,
                tenant_id=tenant_id,
                provider=provider,
                encrypted_token=encrypted_token,
            )

        # Success: redirect to callback page
        redirect_url = (
            f"{settings.terminal_url}/connectors/callback?"
            f"{urlencode({'provider': provider, 'status': 'success'})}"
        )
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"OAuth callback failed for {provider}: {str(e)}")
        # Failure: redirect with error
        redirect_url = (
            f"{settings.terminal_url}/connectors/callback?"
            f"{urlencode({'provider': provider, 'status': 'error', 'message': str(e)[:100]})}"
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


@router.post("/{tenant_id}/{provider}/manual")
async def manual_connect_connector(
    tenant_id: uuid.UUID,
    provider: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Manually connect a connector with an existing token (bypasses OAuth)"""
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    try:
        config = get_connector_config(provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    encrypted_token = encrypt_token(token)

    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id) & (Connector.provider == provider)
        )
    )
    connector = result.scalar_one_or_none()

    if connector:
        connector.oauth_token = encrypted_token
        connector.status = "connected"
    else:
        connector = Connector(
            tenant_id=tenant_id,
            provider=provider,
            status="connected",
            oauth_token=encrypted_token,
            scopes=config.scopes,
        )
        db.add(connector)

    await db.commit()

    logger.info(f"Manually connected {provider} for tenant {tenant_id}")

    # Trigger indexing
    if provider == "github":
        background_tasks.add_task(
            _index_github_background,
            tenant_id=tenant_id,
            connector_id=connector.id,
        )
    else:
        background_tasks.add_task(
            _index_connector_background,
            tenant_id=tenant_id,
            provider=provider,
            encrypted_token=encrypted_token,
        )

    return {
        "provider": provider,
        "status": "connected",
        "tenant_id": str(tenant_id),
        "message": f"{provider} connected successfully. Indexing started.",
    }


async def _index_github_background(
    tenant_id: uuid.UUID,
    connector_id: int,
):
    """Background task: Index GitHub repositories after OAuth connection."""
    from app.db.session import AsyncSessionLocal
    from app.services.initial_indexing import index_github_repositories

    async with AsyncSessionLocal() as db:
        try:
            result = await index_github_repositories(db, tenant_id, connector_id)
            logger.info(f"GitHub indexing complete: {result}")
        except Exception as e:
            logger.error(f"GitHub indexing failed: {type(e).__name__}: {e}")


async def _index_connector_background(
    tenant_id: uuid.UUID,
    provider: str,
    encrypted_token: str,
):
    """Background task: Index connector content after OAuth connection."""
    from app.db.session import AsyncSessionLocal
    from app.services.initial_indexing import (
        index_bitbucket_repos,
        index_clickup_tasks,
        index_confluence_pages,
        index_gitlab_projects,
        index_google_drive_docs,
        index_jira_tickets,
        index_linear_issues,
        index_notion_pages,
        index_slack_messages,
    )

    indexers = {
        "slack": index_slack_messages,
        "jira": index_jira_tickets,
        "confluence": index_confluence_pages,
        "notion": index_notion_pages,
        "google_drive": index_google_drive_docs,
        "clickup": index_clickup_tasks,
        "linear": index_linear_issues,
        "gitlab": index_gitlab_projects,
        "bitbucket": index_bitbucket_repos,
    }

    indexer_fn = indexers.get(provider)
    if not indexer_fn:
        logger.warning(f"No indexer for provider {provider}")
        return

    async with AsyncSessionLocal() as db:
        try:
            result = await indexer_fn(db, tenant_id, encrypted_token)
            logger.info(f"{provider} indexing complete: {result}")
        except Exception as e:
            logger.error(f"{provider} indexing failed: {type(e).__name__}: {e}")
