from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TokenUsageLogResponse(BaseModel):
    """Response model for a single token usage log entry"""

    id: int
    user_id: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    query_type: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyUsage(BaseModel):
    """Daily usage breakdown"""

    date: str
    tokens: int
    cost: float


class UserUsageResponse(BaseModel):
    """User-level usage statistics"""

    total_input_tokens: int
    total_output_tokens: int
    total_cost_usd: float
    query_count: int
    daily_breakdown: list[DailyUsage]


class TeamUsageMember(BaseModel):
    """Team member usage breakdown"""

    user_id: str
    tokens: int
    cost: float


class TeamUsageResponse(BaseModel):
    """Team-level usage statistics"""

    total_input_tokens: int
    total_output_tokens: int
    total_cost_usd: float
    query_count: int
    members_breakdown: list[TeamUsageMember]


class TeamBreakdown(BaseModel):
    """Team usage breakdown"""

    team_id: str
    tokens: int
    cost: float


class ModelBreakdown(BaseModel):
    """Model usage breakdown"""

    model: str
    tokens: int
    cost: float


class TenantUsageResponse(BaseModel):
    """Tenant-level usage statistics"""

    total_cost_usd: float
    total_tokens: int
    query_count: int
    teams_breakdown: list[TeamBreakdown]
    daily_breakdown: list[DailyUsage]
    model_breakdown: list[ModelBreakdown]


class DashboardSummary(BaseModel):
    """Quick summary for management dashboard header"""

    total_tokens_this_month: int
    total_cost_this_month: float
    active_developers: int
    most_used_model: str
    cost_vs_last_month_percent: float
