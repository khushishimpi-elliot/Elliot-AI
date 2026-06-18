from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.confluence import ConfluencePage, ConfluenceSpace
from app.services.connectors.confluence import ConfluenceConnector

router = APIRouter(tags=["confluence"])


async def get_confluence_connector(
    tenant_id: UUID, cloud_id: str, db: AsyncSession
) -> ConfluenceConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "confluence")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()
    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Confluence connector not found or not connected",
        )
    return ConfluenceConnector(connector.oauth_token, cloud_id)


@router.get("/{tenant_id}/spaces", response_model=list[ConfluenceSpace])
async def get_confluence_spaces(
    tenant_id: UUID,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_confluence_connector(tenant_id, cloud_id, db)
    try:
        return await connector.get_spaces()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/spaces/{space_key}/pages",
    response_model=list[ConfluencePage],
)
async def get_confluence_pages(
    tenant_id: UUID,
    space_key: str,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_confluence_connector(tenant_id, cloud_id, db)
    try:
        return await connector.get_pages(space_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
