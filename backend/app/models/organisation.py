import uuid

from sqlalchemy import JSON, TIMESTAMP, UUID, Boolean, Column, ForeignKey, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    org_name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    team_size = Column(Text)
    data_residency = Column(Text, default="US")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(Text, nullable=False)
    permissions = Column(JSON, default={})
    created_at = Column(TIMESTAMP, server_default=func.now())


class Member(Base):
    __tablename__ = "members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    is_active = Column(Boolean, default=True)
