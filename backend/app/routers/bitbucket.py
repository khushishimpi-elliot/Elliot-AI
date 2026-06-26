from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.bitbucket import (
    BitbucketFile,
    BitbucketIndexResponse,
    BitbucketPR,
    BitbucketRepo,
)
from app.services.connectors.bitbucket import BitbucketConnector

router = APIRouter(tags=["bitbucket"])


async def get_bitbucket_connector(
    tenant_id: UUID, db: AsyncSession
) -> BitbucketConnector:
    """Get Bitbucket connector with decrypted token from DB"""
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "bitbucket")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Bitbucket connector not found or not connected",
        )

    return BitbucketConnector(connector.oauth_token)


@router.get("/{tenant_id}/repos", response_model=list[BitbucketRepo])
async def get_bitbucket_repos(
    tenant_id: UUID,
    workspace: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all Bitbucket repositories for a workspace"""
    connector = await get_bitbucket_connector(tenant_id, db)
    try:
        repos = await connector.get_repositories(workspace)
        return repos
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{workspace}/{repo_slug}/files",
    response_model=list[BitbucketFile],
)
async def get_bitbucket_repo_files(
    tenant_id: UUID,
    workspace: str,
    repo_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all files in a Bitbucket repository"""
    connector = await get_bitbucket_connector(tenant_id, db)
    try:
        files = await connector.get_all_files(workspace, repo_slug)
        return files
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{workspace}/{repo_slug}/prs",
    response_model=list[BitbucketPR],
)
async def get_bitbucket_repo_prs(
    tenant_id: UUID,
    workspace: str,
    repo_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get open pull requests in a Bitbucket repository"""
    connector = await get_bitbucket_connector(tenant_id, db)
    try:
        prs = await connector.get_pull_requests(workspace, repo_slug)
        return prs
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post(
    "/{tenant_id}/index/{workspace}/{repo_slug}",
    response_model=BitbucketIndexResponse,
)
async def index_bitbucket_repo(
    tenant_id: UUID,
    workspace: str,
    repo_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Index a Bitbucket repository for RAG"""
    connector = await get_bitbucket_connector(tenant_id, db)
    try:
        files = await connector.get_all_files(workspace, repo_slug)
        return BitbucketIndexResponse(
            status="indexed",
            message=f"Indexed {len(files)} files from {workspace}/{repo_slug}",
            files_indexed=len(files),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
