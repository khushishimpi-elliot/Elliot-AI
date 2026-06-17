import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Team
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate

router = APIRouter(tags=["teams"])
logger = logging.getLogger(__name__)


@router.post("/teams", response_model=TeamResponse)
async def create_team(
    request: TeamCreate,
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    """Create a new team"""
    try:
        team = Team(
            tenant_id=request.tenant_id,
            name=request.name,
            repos=request.repos or [],
            members=request.members or [],
        )

        db.add(team)
        await db.commit()
        await db.refresh(team)

        logger.info(f"Created team {team.id} for tenant {request.tenant_id}")
        return TeamResponse.model_validate(team)

    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating team: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create team: {str(e)}",
        ) from e


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    """Get a team by ID"""
    try:
        result = await db.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()

        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        return TeamResponse.model_validate(team)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch team",
        ) from e


@router.get("/teams", response_model=list[TeamResponse])
async def list_teams(
    tenant_id: UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[TeamResponse]:
    """List teams for a tenant"""
    try:
        result = await db.execute(
            select(Team)
            .where(Team.tenant_id == tenant_id)
            .order_by(desc(Team.created_at))
            .offset(skip)
            .limit(limit)
        )

        teams = result.scalars().all()
        return [TeamResponse.model_validate(t) for t in teams]

    except Exception as e:
        logger.error(f"Error listing teams: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list teams",
        ) from e


@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    request: TeamUpdate,
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    """Update a team"""
    try:
        result = await db.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()

        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        if request.name is not None:
            team.name = request.name
        if request.repos is not None:
            team.repos = request.repos
        if request.members is not None:
            team.members = request.members

        await db.commit()
        await db.refresh(team)

        logger.info(f"Updated team {team_id}")
        return TeamResponse.model_validate(team)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating team: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update team",
        ) from e


@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a team"""
    try:
        result = await db.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()

        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        await db.delete(team)
        await db.commit()

        logger.info(f"Deleted team {team_id}")
        return {"message": "Team deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting team: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete team",
        ) from e
