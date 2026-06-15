from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class OrganisationCreate(BaseModel):
    tenant_id: UUID
    org_name: str
    domain: str
    team_size: str | None = None
    data_residency: str | None = "US"


class OrganisationResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    org_name: str
    domain: str
    team_size: str | None
    data_residency: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    tenant_id: UUID
    name: str
    permissions: dict[str, Any] | None = None


class RoleResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    permissions: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class MemberCreate(BaseModel):
    tenant_id: UUID
    user_id: UUID
    role_id: UUID


class MemberResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: UUID
    role_id: UUID
    joined_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
