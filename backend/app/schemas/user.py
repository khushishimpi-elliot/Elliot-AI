from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    """Request to create a user"""

    tenant_id: UUID
    email: str
    sso_provider: str | None = None


class UserResponse(BaseModel):
    """User response"""

    id: UUID
    tenant_id: UUID
    email: str
    sso_provider: str | None
    last_active: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
