from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_usage import TokenUsageLog

# Model pricing via OpenRouter: (input_cost_per_1M, output_cost_per_1M)
MODEL_PRICING = {
    "anthropic/claude-sonnet-4-6": (3.0, 15.0),
    "anthropic/claude-opus-4-8": (15.0, 75.0),
    "anthropic/claude-haiku-4-5": (0.25, 1.25),
    "openai/gpt-4o": (5.0, 15.0),
    "openai/gpt-4o-mini": (0.15, 0.60),
    "openai/text-embedding-3-small": (0.02, 0.0),
    # Fallback for old format (for compatibility)
    "claude-sonnet-4-6": (3.0, 15.0),
    "gpt-4o": (5.0, 15.0),
}

DEFAULT_PRICING = (3.0, 15.0)  # anthropic/claude-sonnet-4-6


def calculate_cost(
    model: str, input_tokens: int, output_tokens: int
) -> float:
    """Calculate cost in USD based on model pricing.

    Args:
        model: Model identifier
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens

    Returns:
        Cost in USD rounded to 6 decimal places
    """
    input_price, output_price = MODEL_PRICING.get(model, DEFAULT_PRICING)

    input_cost = (input_tokens / 1_000_000) * input_price
    output_cost = (output_tokens / 1_000_000) * output_price

    return round(input_cost + output_cost, 6)


async def log_token_usage(
    db: AsyncSession,
    user_id: str,
    tenant_id: str,
    team_id: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    query_type: str,
) -> TokenUsageLog:
    """Log token usage for an LLM query.

    Args:
        db: Database session
        user_id: User UUID
        tenant_id: Tenant UUID
        team_id: Team UUID
        model: Model identifier
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        query_type: Query type (code, jira, docs, general)

    Returns:
        Created TokenUsageLog record
    """
    cost = calculate_cost(model, input_tokens, output_tokens)

    log = TokenUsageLog(
        user_id=UUID(user_id),
        tenant_id=UUID(tenant_id),
        team_id=UUID(team_id),
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
        query_type=query_type,
    )

    db.add(log)
    await db.flush()
    return log


async def get_user_usage(
    db: AsyncSession, user_id: str, days: int = 30
) -> dict:
    """Get token usage for a user over N days.

    Args:
        db: Database session
        user_id: User UUID
        days: Number of days to look back

    Returns:
        Dictionary with usage stats and daily breakdown
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get total usage
    result = await db.execute(
        select(
            func.sum(TokenUsageLog.input_tokens).label("total_input"),
            func.sum(TokenUsageLog.output_tokens).label("total_output"),
            func.sum(TokenUsageLog.cost_usd).label("total_cost"),
            func.count(TokenUsageLog.id).label("query_count"),
        ).where(
            (TokenUsageLog.user_id == UUID(user_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
    )
    row = result.scalar_one()

    total_input = row.total_input or 0
    total_output = row.total_output or 0
    total_cost = float(row.total_cost or 0)
    query_count = row.query_count or 0

    # Get daily breakdown
    daily_result = await db.execute(
        select(
            func.date(TokenUsageLog.timestamp).label("date"),
            func.sum(TokenUsageLog.input_tokens
                     + TokenUsageLog.output_tokens).label("tokens"),
            func.sum(TokenUsageLog.cost_usd).label("cost"),
        )
        .where(
            (TokenUsageLog.user_id == UUID(user_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
        .group_by(func.date(TokenUsageLog.timestamp))
        .order_by(func.date(TokenUsageLog.timestamp))
    )

    daily_breakdown = [
        {"date": str(row.date), "tokens": row.tokens or 0, "cost": float(row.cost or 0)}
        for row in daily_result.scalars()
    ]

    return {
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_cost_usd": total_cost,
        "query_count": query_count,
        "daily_breakdown": daily_breakdown,
    }


async def get_team_usage(
    db: AsyncSession, team_id: str, days: int = 30
) -> dict:
    """Get token usage for a team over N days.

    Args:
        db: Database session
        team_id: Team UUID
        days: Number of days to look back

    Returns:
        Dictionary with usage stats and members breakdown
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get total usage
    result = await db.execute(
        select(
            func.sum(TokenUsageLog.input_tokens).label("total_input"),
            func.sum(TokenUsageLog.output_tokens).label("total_output"),
            func.sum(TokenUsageLog.cost_usd).label("total_cost"),
            func.count(TokenUsageLog.id).label("query_count"),
        ).where(
            (TokenUsageLog.team_id == UUID(team_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
    )
    row = result.scalar_one()

    total_input = row.total_input or 0
    total_output = row.total_output or 0
    total_cost = float(row.total_cost or 0)
    query_count = row.query_count or 0

    # Get members breakdown
    members_result = await db.execute(
        select(
            TokenUsageLog.user_id,
            func.sum(TokenUsageLog.input_tokens
                     + TokenUsageLog.output_tokens).label("tokens"),
            func.sum(TokenUsageLog.cost_usd).label("cost"),
        )
        .where(
            (TokenUsageLog.team_id == UUID(team_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
        .group_by(TokenUsageLog.user_id)
        .order_by(func.sum(TokenUsageLog.cost_usd).desc())
    )

    members_breakdown = [
        {"user_id": str(row.user_id), "tokens": row.tokens or 0, "cost": float(row.cost or 0)}
        for row in members_result.scalars()
    ]

    return {
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_cost_usd": total_cost,
        "query_count": query_count,
        "members_breakdown": members_breakdown,
    }


async def get_tenant_usage(
    db: AsyncSession, tenant_id: str, days: int = 30
) -> dict:
    """Get token usage for a tenant over N days.

    Args:
        db: Database session
        tenant_id: Tenant UUID
        days: Number of days to look back

    Returns:
        Dictionary with usage stats and breakdown by teams, models, and days
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get total usage
    result = await db.execute(
        select(
            func.sum(TokenUsageLog.input_tokens).label("total_input"),
            func.sum(TokenUsageLog.output_tokens).label("total_output"),
            func.sum(TokenUsageLog.cost_usd).label("total_cost"),
            func.count(TokenUsageLog.id).label("query_count"),
        ).where(
            (TokenUsageLog.tenant_id == UUID(tenant_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
    )
    row = result.scalar_one()

    total_input = row.total_input or 0
    total_output = row.total_output or 0
    total_cost = float(row.total_cost or 0)
    query_count = row.query_count or 0
    total_tokens = total_input + total_output

    # Get teams breakdown
    teams_result = await db.execute(
        select(
            TokenUsageLog.team_id,
            func.sum(TokenUsageLog.input_tokens
                     + TokenUsageLog.output_tokens).label("tokens"),
            func.sum(TokenUsageLog.cost_usd).label("cost"),
        )
        .where(
            (TokenUsageLog.tenant_id == UUID(tenant_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
        .group_by(TokenUsageLog.team_id)
        .order_by(func.sum(TokenUsageLog.cost_usd).desc())
    )

    teams_breakdown = [
        {"team_id": str(row.team_id), "tokens": row.tokens or 0, "cost": float(row.cost or 0)}
        for row in teams_result.scalars()
    ]

    # Get models breakdown
    models_result = await db.execute(
        select(
            TokenUsageLog.model,
            func.sum(TokenUsageLog.input_tokens
                     + TokenUsageLog.output_tokens).label("tokens"),
            func.sum(TokenUsageLog.cost_usd).label("cost"),
        )
        .where(
            (TokenUsageLog.tenant_id == UUID(tenant_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
        .group_by(TokenUsageLog.model)
        .order_by(func.sum(TokenUsageLog.cost_usd).desc())
    )

    model_breakdown = [
        {"model": row.model, "tokens": row.tokens or 0, "cost": float(row.cost or 0)}
        for row in models_result.scalars()
    ]

    # Get daily breakdown
    daily_result = await db.execute(
        select(
            func.date(TokenUsageLog.timestamp).label("date"),
            func.sum(TokenUsageLog.input_tokens
                     + TokenUsageLog.output_tokens).label("tokens"),
            func.sum(TokenUsageLog.cost_usd).label("cost"),
        )
        .where(
            (TokenUsageLog.tenant_id == UUID(tenant_id))
            & (TokenUsageLog.timestamp >= cutoff_date)
        )
        .group_by(func.date(TokenUsageLog.timestamp))
        .order_by(func.date(TokenUsageLog.timestamp))
    )

    daily_breakdown = [
        {"date": str(row.date), "tokens": row.tokens or 0, "cost": float(row.cost or 0)}
        for row in daily_result.scalars()
    ]

    return {
        "total_cost_usd": total_cost,
        "total_tokens": total_tokens,
        "query_count": query_count,
        "teams_breakdown": teams_breakdown,
        "daily_breakdown": daily_breakdown,
        "model_breakdown": model_breakdown,
    }
