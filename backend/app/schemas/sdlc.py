from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SDLCCreate(BaseModel):
    tenant_id: UUID
    stack: str | None = None
    branching_model: str | None = None
    test_framework: str | None = None
    coverage_gate: int | None = None
    ci_cd_platform: str | None = None
    review_policy: str | None = None
    arch_style: str | None = None


class SDLCUpdate(BaseModel):
    stack: str | None = None
    branching_model: str | None = None
    test_framework: str | None = None
    coverage_gate: int | None = None
    ci_cd_platform: str | None = None
    review_policy: str | None = None
    arch_style: str | None = None


class SDLCResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    stack: str | None
    branching_model: str | None
    test_framework: str | None
    coverage_gate: int | None
    ci_cd_platform: str | None
    review_policy: str | None
    arch_style: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
