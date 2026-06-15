from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base


class TokenUsageLog(Base):
    """Token usage logging for LLM queries"""

    __tablename__ = "token_usage_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    team_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    model = Column(String(255), nullable=False, index=True)
    input_tokens = Column(Integer, nullable=False)
    output_tokens = Column(Integer, nullable=False)
    cost_usd = Column(
        Numeric(10, 6), nullable=False
    )  # e.g., 0.001234
    query_type = Column(String(50), nullable=False, index=True)
    timestamp = Column(
        DateTime, nullable=False, server_default=func.now(), index=True
    )

    def __repr__(self) -> str:
        return (
            f"<TokenUsageLog(user_id={self.user_id}, model={self.model}, "
            f"tokens={self.input_tokens + self.output_tokens}, "
            f"cost=${self.cost_usd})>"
        )
