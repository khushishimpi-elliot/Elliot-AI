from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.chunk import EMBEDDING_DIM


class ChunkCreate(BaseModel):
    source: str = Field(
        ...,
        description="Stable identifier — e.g. 'github://org/repo/path/file.py:42-78'",
    )
    source_type: str = Field(..., description="code | doc | ticket | thread")
    content: str
    meta: dict = Field(default_factory=dict)
    embedding: list[float] = Field(..., min_length=EMBEDDING_DIM, max_length=EMBEDDING_DIM)


class ChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    source: str
    source_type: str
    content: str
    meta: dict


class ChunkSearchResult(BaseModel):
    chunk: ChunkResponse
    score: float = Field(..., description="Cosine similarity in [0, 1]; higher is more similar")
