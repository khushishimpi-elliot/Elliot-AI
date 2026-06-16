from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileData(BaseModel):
    """File data for indexing"""

    filepath: str
    content: str


class IndexFileRequest(BaseModel):
    """Request to index a single file"""

    tenant_id: str
    filepath: str
    content: str

    def to_dict(self) -> dict:
        """Convert to dictionary for indexer"""
        return {"filepath": self.filepath, "content": self.content}


class IndexRepositoryRequest(BaseModel):
    """Request to index a repository"""

    tenant_id: str
    files: list[FileData]


class IndexResponse(BaseModel):
    """Response from indexing operations"""

    files_processed: int
    chunks_created: int
    embeddings_created: int
    tenant_id: str


class IndexStatsResponse(BaseModel):
    """Index statistics response"""

    total_chunks: int
    total_files: int
    languages_breakdown: dict[str, int]
    last_indexed: datetime | None

    model_config = ConfigDict(from_attributes=True)
