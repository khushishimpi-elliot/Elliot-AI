from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.linear import LinearIssue, LinearTeam
from app.services.connectors.linear import LinearAPIError, LinearConnector

router = APIRouter(tags=["linear"])


async def _get_linear_connector(tenant_id: UUID, db: AsyncSession) -> LinearConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "linear")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Linear connector not found or not connected",
        )

    return LinearConnector(connector.oauth_token)


@router.get("/{tenant_id}/teams", response_model=list[LinearTeam])
async def list_linear_teams(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List Linear teams the connected account belongs to."""
    connector = await _get_linear_connector(tenant_id, db)
    try:
        return await connector.get_teams()
    except LinearAPIError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues", response_model=list[LinearIssue])
async def list_linear_issues(
    tenant_id: UUID,
    team_key: str | None = None,
    state: str | None = None,
    assignee_email: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List Linear issues with optional filters."""
    connector = await _get_linear_connector(tenant_id, db)
    try:
        return await connector.list_issues(
            team_key=team_key,
            state=state,
            assignee_email=assignee_email,
            limit=limit,
        )
    except LinearAPIError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues/{issue_id}", response_model=LinearIssue)
async def get_linear_issue(
    tenant_id: UUID,
    issue_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await _get_linear_connector(tenant_id, db)
    try:
        issue = await connector.get_issue(issue_id)
    except LinearAPIError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if issue is None:
        raise HTTPException(status_code=404, detail="issue not found")
    return issue
