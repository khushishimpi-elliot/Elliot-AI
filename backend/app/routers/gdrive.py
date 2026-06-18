from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.gdrive import GDriveFile
from app.services.connectors.gdrive import GDriveConnector

router = APIRouter(tags=["gdrive"])


async def get_gdrive_connector(
    tenant_id: UUID, db: AsyncSession
) -> GDriveConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "gdrive")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()
    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Google Drive connector not found or not connected",
        )
    return GDriveConnector(connector.oauth_token)


@router.get("/{tenant_id}/files", response_model=list[GDriveFile])
async def list_gdrive_files(
    tenant_id: UUID,
    query: str = "",
    db: AsyncSession = Depends(get_db),
):
    connector = await get_gdrive_connector(tenant_id, db)
    try:
        return await connector.get_files(query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/files/{file_id}", response_model=GDriveFile)
async def get_gdrive_file(
    tenant_id: UUID,
    file_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_gdrive_connector(tenant_id, db)
    try:
        return await connector.get_file(file_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
