from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_chunk import KnowledgeChunk
from app.services.chunker import CodeChunker
from app.services.embedder import Embedder


class Indexer:
    """Index code chunks in pgvector for RAG"""

    def __init__(self):
        """Initialize chunker and embedder"""
        self.chunker = CodeChunker()
        self.embedder = Embedder()

    async def index_chunks(
        self,
        db: AsyncSession,
        tenant_id: str,
        chunks: list[dict],
    ) -> int:
        """Save chunks to knowledge_chunks table"""
        count = 0

        for idx, chunk in enumerate(chunks):
            if not chunk.get("embedding"):
                continue

            if not chunk["content"].strip():
                continue

            knowledge_chunk = KnowledgeChunk(
                tenant_id=UUID(tenant_id),
                source=chunk["filepath"],
                content=chunk["content"],
                chunk_index=idx,
                chunk_type=chunk.get("chunk_type"),
                chunk_name=chunk.get("chunk_name"),
                start_line=chunk.get("start_line"),
                end_line=chunk.get("end_line"),
                language=chunk.get("language"),
                embedding=chunk["embedding"],
                char_count=chunk.get("char_count", 0),
                token_estimate=chunk.get("token_estimate", 0),
            )

            db.add(knowledge_chunk)
            count += 1

        await db.flush()
        return count

    async def delete_chunks_for_file(
        self,
        db: AsyncSession,
        tenant_id: str,
        filepath: str,
    ) -> int:
        """Delete all chunks for a specific file"""
        result = await db.execute(
            delete(KnowledgeChunk).where(
                (KnowledgeChunk.tenant_id == UUID(tenant_id))
                & (KnowledgeChunk.source == filepath)
            )
        )

        await db.flush()
        return result.rowcount

    async def index_repository(
        self,
        db: AsyncSession,
        tenant_id: str,
        files: list[dict],
    ) -> dict:
        """Full pipeline: chunk → embed → index"""
        # Chunk files
        chunks = self.chunker.chunk_repository(files)
        files_processed = len(files)
        chunks_created = len(chunks)

        if not chunks:
            return {
                "files_processed": files_processed,
                "chunks_created": 0,
                "embeddings_created": 0,
                "tenant_id": tenant_id,
            }

        # Embed chunks
        chunks = await self.embedder.embed_chunks(chunks)

        # Index chunks
        indexed_count = await self.index_chunks(
            db, tenant_id, chunks
        )

        await db.commit()

        return {
            "files_processed": files_processed,
            "chunks_created": chunks_created,
            "embeddings_created": indexed_count,
            "tenant_id": tenant_id,
        }
