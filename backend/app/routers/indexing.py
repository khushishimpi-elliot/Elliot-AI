from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.knowledge_chunk import KnowledgeChunk
from app.schemas.indexing import (
    IndexFileRequest,
    IndexRepositoryRequest,
    IndexResponse,
    IndexStatsResponse,
)
from app.services.indexer import Indexer

router = APIRouter(tags=["indexing"])


@router.post("/repository", response_model=IndexResponse)
async def index_repository(
    request: IndexRepositoryRequest,
    db: AsyncSession = Depends(get_db),
) -> IndexResponse:
    """Index a full repository"""
    try:
        indexer = Indexer()
        result = await indexer.index_repository(
            db, request.tenant_id, request.files
        )
        return IndexResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index repository: {str(e)}",
        ) from e


@router.post("/file", response_model=IndexResponse)
async def index_file(
    request: IndexFileRequest,
    db: AsyncSession = Depends(get_db),
) -> IndexResponse:
    """Index a single file"""
    try:
        indexer = Indexer()
        result = await indexer.index_repository(
            db, request.tenant_id, [request.to_dict()]
        )
        return IndexResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index file: {str(e)}",
        ) from e


@router.delete("/{tenant_id}/file")
async def delete_file_chunks(
    tenant_id: UUID,
    filepath: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete all chunks for a file"""
    try:
        indexer = Indexer()
        deleted_count = await indexer.delete_chunks_for_file(
            db, str(tenant_id), filepath
        )
        await db.commit()
        return {
            "deleted": deleted_count,
            "filepath": filepath,
            "tenant_id": str(tenant_id),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chunks: {str(e)}",
        ) from e


@router.get("/{tenant_id}/stats", response_model=IndexStatsResponse)
async def get_index_stats(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> IndexStatsResponse:
    """Get indexing statistics for a tenant"""
    try:
        # Total chunks
        result = await db.execute(
            select(func.count(KnowledgeChunk.id)).where(
                KnowledgeChunk.tenant_id == tenant_id
            )
        )
        total_chunks = result.scalar() or 0

        # Total files
        result = await db.execute(
            select(func.count(func.distinct(KnowledgeChunk.source))).where(
                KnowledgeChunk.tenant_id == tenant_id
            )
        )
        total_files = result.scalar() or 0

        # Language breakdown
        result = await db.execute(
            select(
                KnowledgeChunk.language,
                func.count(KnowledgeChunk.id).label("count"),
            )
            .where(KnowledgeChunk.tenant_id == tenant_id)
            .group_by(KnowledgeChunk.language)
        )
        language_breakdown = {
            row[0] or "unknown": row[1]
            for row in result.fetchall()
        }

        # Last indexed
        result = await db.execute(
            select(func.max(KnowledgeChunk.created_at)).where(
                KnowledgeChunk.tenant_id == tenant_id
            )
        )
        last_indexed = result.scalar()

        return IndexStatsResponse(
            total_chunks=total_chunks,
            total_files=total_files,
            languages_breakdown=language_breakdown,
            last_indexed=last_indexed,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stats: {str(e)}",
        ) from e
