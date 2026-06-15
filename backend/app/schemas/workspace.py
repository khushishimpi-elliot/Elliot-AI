from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    domain: str
    team_size: str | None = None
    residency: Literal["US", "EU", "UK", "APAC"] = "US"


class WorkspaceResponse(BaseModel):
    tenant_id: UUID
    name: str
    domain: str
    team_size: str | None
    residency: str
    created_at: datetime

    model_config = {"from_attributes": True}
