import hashlib
import hmac
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.github import (
    GitHubFile,
    GitHubPR,
    GitHubRepo,
    GitHubWebhookResponse,
)
from app.services.connectors.github import GitHubConnector

router = APIRouter(tags=["github"])


async def get_github_connector(
    tenant_id: UUID, db: AsyncSession
) -> GitHubConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "github")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="GitHub connector not found or not connected",
        )

    return GitHubConnector(connector.oauth_token)


@router.get("/{tenant_id}/repos", response_model=list[GitHubRepo])
async def get_github_repos(
    tenant_id: UUID,
    owner: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_repositories(owner)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{owner}/{repo}/files",
    response_model=list[GitHubFile],
)
async def get_github_repo_files(
    tenant_id: UUID,
    owner: str,
    repo: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_all_files(owner, repo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{owner}/{repo}/prs",
    response_model=list[GitHubPR],
)
async def get_github_repo_prs(
    tenant_id: UUID,
    owner: str,
    repo: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_pull_requests(owner, repo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/{tenant_id}/webhook", response_model=GitHubWebhookResponse)
async def github_webhook(
    tenant_id: UUID,
    request: Request,
) -> GitHubWebhookResponse:
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="missing signature header")

    body = await request.body()
    secret = get_settings().github_webhook_secret
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()  # hmac.new(key, msg, digestmod)

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=400, detail="invalid signature")

    return GitHubWebhookResponse(status="received")
