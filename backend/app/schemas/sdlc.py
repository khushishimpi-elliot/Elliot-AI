from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SDLCCreate(BaseModel):
    tenant_id: UUID
    stack: Optional[str] = None
    branching_model: Optional[str] = None
    test_framework: Optional[str] = None
    coverage_gate: Optional[int] = None
    ci_cd_platform: Optional[str] = None
    review_policy: Optional[str] = None
    arch_style: Optional[str] = None


class SDLCUpdate(BaseModel):
    stack: Optional[str] = None
    branching_model: Optional[str] = None
    test_framework: Optional[str] = None
    coverage_gate: Optional[int] = None
    ci_cd_platform: Optional[str] = None
    review_policy: Optional[str] = None
    arch_style: Optional[str] = None


class SDLCResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    stack: Optional[str]
    branching_model: Optional[str]
    test_framework: Optional[str]
    coverage_gate: Optional[int]
    ci_cd_platform: Optional[str]
    review_policy: Optional[str]
    arch_style: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
