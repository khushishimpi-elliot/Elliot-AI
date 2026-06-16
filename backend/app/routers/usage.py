from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.token_usage import TokenUsageLog
from app.schemas.usage import (
    DashboardSummary,
    TeamUsageResponse,
    TenantUsageResponse,
    UserUsageResponse,
)
from app.services.token_logger import (
    get_team_usage,
    get_tenant_usage,
    get_user_usage,
)

router = APIRouter(tags=["usage"])


@router.get("/me", response_model=UserUsageResponse)
async def get_user_usage_endpoint(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserUsageResponse:
    """Get token usage for current user"""
    try:
        usage = await get_user_usage(
            db, str(current_user["sub"]), days=days
        )
        return UserUsageResponse(**usage)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch user usage: {str(e)}"
        ) from e


@router.get("/team/{team_id}", response_model=TeamUsageResponse)
async def get_team_usage_endpoint(
    team_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> TeamUsageResponse:
    """Get token usage for a specific team"""
    try:
        usage = await get_team_usage(db, str(team_id), days=days)
        return TeamUsageResponse(**usage)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch team usage: {str(e)}",
        ) from e


@router.get("/tenant/{tenant_id}", response_model=TenantUsageResponse)
async def get_tenant_usage_endpoint(
    tenant_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> TenantUsageResponse:
    """Get token usage for a tenant"""
    try:
        usage = await get_tenant_usage(db, str(tenant_id), days=days)
        return TenantUsageResponse(**usage)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch tenant usage: {str(e)}",
        ) from e


@router.get("/summary/{tenant_id}", response_model=DashboardSummary)
async def get_dashboard_summary(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> DashboardSummary:
    """Get quick summary for management dashboard header"""
    try:
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        last_month_end = month_start - timedelta(seconds=1)

        # Get current month usage
        current_result = await db.execute(
            select(
                func.sum(TokenUsageLog.input_tokens
                         + TokenUsageLog.output_tokens).label("tokens"),
                func.sum(TokenUsageLog.cost_usd).label("cost"),
                func.count(func.distinct(TokenUsageLog.user_id)).label(
                    "active_devs"
                ),
            ).where(
                (TokenUsageLog.tenant_id == tenant_id)
                & (TokenUsageLog.timestamp >= month_start)
            )
        )
        current = current_result.scalar_one()

        # Get last month usage for comparison
        last_month_result = await db.execute(
            select(
                func.sum(TokenUsageLog.cost_usd).label("cost"),
            ).where(
                (TokenUsageLog.tenant_id == tenant_id)
                & (TokenUsageLog.timestamp >= last_month_start)
                & (TokenUsageLog.timestamp <= last_month_end)
            )
        )
        last_month = last_month_result.scalar_one()

        # Get most used model
        model_result = await db.execute(
            select(TokenUsageLog.model)
            .where(TokenUsageLog.tenant_id == tenant_id)
            .order_by(func.count(TokenUsageLog.id).desc())
            .group_by(TokenUsageLog.model)
            .limit(1)
        )
        most_used_model = model_result.scalar_one_or_none() or "unknown"

        total_tokens = current.tokens or 0
        total_cost = float(current.cost or 0)
        active_devs = current.active_devs or 0

        last_month_cost = float(last_month.cost or 0)
        cost_diff = (
            ((total_cost - last_month_cost) / last_month_cost * 100)
            if last_month_cost > 0
            else 0
        )

        return DashboardSummary(
            total_tokens_this_month=total_tokens,
            total_cost_this_month=total_cost,
            active_developers=active_devs,
            most_used_model=most_used_model,
            cost_vs_last_month_percent=round(cost_diff, 2),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard summary: {str(e)}",
        ) from e
