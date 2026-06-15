import uuid

from sqlalchemy import ARRAY, TIMESTAMP, UUID, Column, ForeignKey, String, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider = Column(String(50), nullable=False)
    status = Column(
        String(20),
        default="not_connected",
        nullable=False,
    )
    oauth_token = Column(Text)
    oauth_refresh_token = Column(Text)
    scopes = Column(ARRAY(String), default=[])
    last_synced = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
