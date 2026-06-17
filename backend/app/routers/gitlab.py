from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.gitlab import (
    GitLabFile,
    GitLabIndexResponse,
    GitLabMR,
    GitLabProject,
)
from app.services.connectors.gitlab import GitLabConnector

router = APIRouter(tags=["gitlab"])


async def _get_gitlab_connector(tenant_id: UUID, db: AsyncSession) -> GitLabConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "gitlab")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="GitLab connector not found or not connected",
        )

    return GitLabConnector(connector.oauth_token)


@router.get("/{tenant_id}/projects", response_model=list[GitLabProject])
async def list_gitlab_projects(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List GitLab projects the connected account is a member of."""
    connector = await _get_gitlab_connector(tenant_id, db)
    try:
        return await connector.get_projects()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/projects/{project_id}/files",
    response_model=list[GitLabFile],
)
async def list_gitlab_files(
    tenant_id: UUID,
    project_id: int,
    ref: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Return source files for a GitLab project (default branch unless `ref` given)."""
    connector = await _get_gitlab_connector(tenant_id, db)
    try:
        return await connector.get_all_files(project_id, ref)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/projects/{project_id}/mrs",
    response_model=list[GitLabMR],
)
async def list_gitlab_mrs(
    tenant_id: UUID,
    project_id: int,
    state: str = "opened",
    db: AsyncSession = Depends(get_db),
):
    """List merge requests for a GitLab project."""
    connector = await _get_gitlab_connector(tenant_id, db)
    try:
        return await connector.get_merge_requests(project_id, state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post(
    "/{tenant_id}/index/{project_id}",
    response_model=GitLabIndexResponse,
)
async def index_gitlab_project(
    tenant_id: UUID,
    project_id: int,
    ref: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Pull all supported source files for ingestion by the embeddings pipeline (#25)."""
    connector = await _get_gitlab_connector(tenant_id, db)
    try:
        files = await connector.get_all_files(project_id, ref)
        return GitLabIndexResponse(
            status="indexed",
            message=f"Indexed {len(files)} files from project {project_id}",
            files_indexed=len(files),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
