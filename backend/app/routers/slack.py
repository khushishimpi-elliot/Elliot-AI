from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.slack import (
    SlackChannel,
    SlackIndexResponse,
    SlackMessage,
    SlackSearchResult,
)
from app.services.connectors.slack import SlackConnector

router = APIRouter(tags=["slack"])


async def get_slack_connector(
    tenant_id: UUID, db: AsyncSession
) -> SlackConnector:
    """Get Slack connector with decrypted token from DB"""
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "slack")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Slack connector not found or not connected",
        )

    return SlackConnector(connector.oauth_token)


@router.get("/{tenant_id}/channels", response_model=list[SlackChannel])
async def get_slack_channels(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all Slack channels"""
    connector = await get_slack_connector(tenant_id, db)
    try:
        channels = await connector.get_channels()
        return channels
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/channels/{channel_id}/messages",
    response_model=list[SlackMessage],
)
async def get_channel_messages(
    tenant_id: UUID,
    channel_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Get recent messages from a Slack channel"""
    connector = await get_slack_connector(tenant_id, db)
    try:
        messages = await connector.get_channel_messages(channel_id, limit)
        return messages
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/search",
    response_model=list[SlackSearchResult],
)
async def search_slack_messages(
    tenant_id: UUID,
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    """Search Slack messages by keyword"""
    connector = await get_slack_connector(tenant_id, db)
    try:
        results = await connector.search_messages(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post(
    "/{tenant_id}/index",
    response_model=SlackIndexResponse,
)
async def index_slack_messages(
    tenant_id: UUID,
    days_back: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Index Slack messages for RAG"""
    connector = await get_slack_connector(tenant_id, db)
    try:
        messages = await connector.get_all_messages_for_indexing(days_back)
        return SlackIndexResponse(
            status="indexed",
            message=f"Indexed {len(messages)} messages from last {days_back} days",
            messages_indexed=len(messages),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
