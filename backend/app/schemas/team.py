from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TeamCreate(BaseModel):
    """Request to create a team"""

    tenant_id: UUID
    name: str
    repos: list | None = None
    members: list | None = None


class TeamUpdate(BaseModel):
    """Request to update a team"""

    name: str | None = None
    repos: list | None = None
    members: list | None = None


class TeamResponse(BaseModel):
    """Team response"""

    id: UUID
    tenant_id: UUID
    name: str
    repos: list
    members: list
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
