import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, TIMESTAMP, UUID, Column, ForeignKey, Text
from sqlalchemy.sql import func

from app.models.base import Base

EMBEDDING_DIM = 1536


class Chunk(Base):
    """A retrievable chunk in elliot-index: code, docs, tickets, or chat threads.

    Populated by the chunker + embeddings pipeline (tasks #23, #24, #25).
    Queried by the Context Planner (task #29) via cosine similarity over `embedding`.
    """

    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source = Column(Text, nullable=False)
    source_type = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    meta = Column(JSON, default=dict, server_default="{}")
    embedding = Column(Vector(EMBEDDING_DIM), nullable=False)
    indexed_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
