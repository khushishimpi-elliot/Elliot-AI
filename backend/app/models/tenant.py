import uuid

from sqlalchemy import TIMESTAMP, UUID, Column, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    team_size = Column(Text, nullable=True)
    residency = Column(Text, nullable=False, server_default="US")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
