import uuid

from sqlalchemy import TIMESTAMP, UUID, Column, ForeignKey, JSON, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(Text, nullable=False)
    repos = Column(JSON, default=[])
    members = Column(JSON, default=[])
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
