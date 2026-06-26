from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.sharepoint import SharePointDocument, SharePointSite
from app.services.connectors.sharepoint import SharePointConnector

router = APIRouter(tags=["sharepoint"])


async def get_sharepoint_connector(
    tenant_id: UUID, db: AsyncSession
) -> SharePointConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "sharepoint")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()
    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="SharePoint connector not found or not connected",
        )
    return SharePointConnector(connector.oauth_token)


@router.get("/{tenant_id}/sites", response_model=list[SharePointSite])
async def get_sharepoint_sites(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_sharepoint_connector(tenant_id, db)
    try:
        return await connector.get_sites()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/sites/{site_id}/documents",
    response_model=list[SharePointDocument],
)
async def get_sharepoint_documents(
    tenant_id: UUID,
    site_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_sharepoint_connector(tenant_id, db)
    try:
        return await connector.get_documents(site_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
