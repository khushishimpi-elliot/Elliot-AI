from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TeamCreate(BaseModel):
    """Request to create a team"""

    tenant_id: UUID
    name: str
    repos: list[str] | None = None
    members: list[UUID] | None = None


class TeamUpdate(BaseModel):
    """Request to update a team"""

    name: str | None = None
    repos: list[str] | None = None
    members: list[UUID] | None = None


class TeamResponse(BaseModel):
    """Team response"""

    id: UUID
    tenant_id: UUID
    name: str
    repos: list[str] | None
    members: list[UUID] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
