from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.notion import NotionDatabase, NotionPage
from app.services.connectors.notion import NotionConnector

router = APIRouter(tags=["notion"])


async def get_notion_connector(
    tenant_id: UUID, db: AsyncSession
) -> NotionConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "notion")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Notion connector not found or not connected",
        )

    return NotionConnector(connector.oauth_token)


@router.get("/{tenant_id}/pages", response_model=list[NotionPage])
async def get_notion_pages(
    tenant_id: UUID,
    query: str = "",
    db: AsyncSession = Depends(get_db),
):
    connector = await get_notion_connector(tenant_id, db)
    try:
        return await connector.get_pages(query=query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/databases", response_model=list[NotionDatabase])
async def get_notion_databases(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_notion_connector(tenant_id, db)
    try:
        return await connector.get_databases()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
