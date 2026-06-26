import uuid

from sqlalchemy import TIMESTAMP, UUID, Column, ForeignKey, Integer, Text
from sqlalchemy.sql import func

from app.models.base import Base


class SDLCProfile(Base):
    __tablename__ = "sdlc_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    stack = Column(Text)
    branching_model = Column(Text)
    test_framework = Column(Text)
    coverage_gate = Column(Integer)
    ci_cd_platform = Column(Text)
    review_policy = Column(Text)
    arch_style = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
