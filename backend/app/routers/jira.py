from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.jira import JiraIssue, JiraStatus
from app.services.connectors.jira import JiraConnector

router = APIRouter(tags=["jira"])


async def get_jira_connector(
    tenant_id: UUID, cloud_id: str, db: AsyncSession
) -> JiraConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "jira")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Jira connector not found or not connected",
        )

    return JiraConnector(connector.oauth_token, cloud_id)


@router.get("/{tenant_id}/search", response_model=list[JiraIssue])
async def search_jira_issues(
    tenant_id: UUID,
    cloud_id: str,
    jql: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        return await connector.search_issues(jql)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues/{issue_key}", response_model=JiraIssue)
async def get_jira_issue(
    tenant_id: UUID,
    issue_key: str,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        return await connector.get_issue(issue_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues/{issue_key}/status", response_model=JiraStatus)
async def get_jira_issue_status(
    tenant_id: UUID,
    issue_key: str,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        status = await connector.get_issue_status(issue_key)
        return JiraStatus(key=issue_key, status=status)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
