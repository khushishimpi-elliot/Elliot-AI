import uuid

from sqlalchemy import JSON, TIMESTAMP, UUID, Column, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    team_size = Column(Text, nullable=True)
    data_residency = Column(Text, nullable=False, server_default="US")
    stack = Column(Text, nullable=True)
    sdlc_profile = Column(JSON, nullable=True)
    status = Column(Text, nullable=False, server_default="active")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
