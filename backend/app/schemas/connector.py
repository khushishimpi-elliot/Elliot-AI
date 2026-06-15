from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConnectorResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    provider: str
    status: str
    scopes: list[str]
    last_synced: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectorAuthorizeResponse(BaseModel):
    authorization_url: str
