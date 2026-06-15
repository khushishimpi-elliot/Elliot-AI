from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base


class KnowledgeChunk(Base):
    """Code chunks with embeddings for RAG retrieval"""

    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    source = Column(String(500), nullable=False, index=True)
    content = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_type = Column(String(50), nullable=True)
    chunk_name = Column(String(255), nullable=True)
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    language = Column(String(50), nullable=True)
    embedding = Column(Vector(1536), nullable=False)
    char_count = Column(Integer, nullable=False)
    token_estimate = Column(Integer, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=func.now(), index=True
    )

    def __repr__(self) -> str:
        return (
            f"<KnowledgeChunk(source={self.source}, "
            f"chunk_index={self.chunk_index}, "
            f"tokens={self.token_estimate})>"
        )
