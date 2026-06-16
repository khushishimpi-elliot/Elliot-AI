from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.clickup import ClickUpComment, ClickUpTask
from app.services.connectors.clickup import ClickUpConnector

router = APIRouter(tags=["clickup"])


async def get_clickup_connector(
    tenant_id: UUID, db: AsyncSession
) -> ClickUpConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "clickup")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="ClickUp connector not found or not connected",
        )

    return ClickUpConnector(connector.oauth_token)


@router.get("/{tenant_id}/lists/{list_id}/tasks", response_model=list[ClickUpTask])
async def get_clickup_tasks(
    tenant_id: UUID,
    list_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_clickup_connector(tenant_id, db)
    try:
        return await connector.get_tasks(list_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/tasks/{task_id}", response_model=ClickUpTask)
async def get_clickup_task(
    tenant_id: UUID,
    task_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_clickup_connector(tenant_id, db)
    try:
        return await connector.get_task(task_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/tasks/{task_id}/comments",
    response_model=list[ClickUpComment],
)
async def get_clickup_task_comments(
    tenant_id: UUID,
    task_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_clickup_connector(tenant_id, db)
    try:
        return await connector.get_task_comments(task_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
