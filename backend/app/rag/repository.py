"""Repository helpers for the chunks table.

Two operations the rest of the system needs:
  - insert_chunk: called by the embeddings pipeline (#25)
  - search_by_embedding: called by the Context Planner (#29)

Search uses pgvector's cosine distance operator `<=>` and converts to a
similarity score in [0, 1] so callers don't need to remember which way
the operator goes (smaller distance = more similar).
"""
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import EMBEDDING_DIM, Chunk


async def insert_chunk(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    source: str,
    source_type: str,
    content: str,
    embedding: list[float],
    meta: dict | None = None,
) -> Chunk:
    if len(embedding) != EMBEDDING_DIM:
        raise ValueError(f"embedding must have exactly {EMBEDDING_DIM} dimensions")
    chunk = Chunk(
        tenant_id=tenant_id,
        source=source,
        source_type=source_type,
        content=content,
        meta=meta or {},
        embedding=embedding,
    )
    db.add(chunk)
    await db.flush()
    return chunk


async def search_by_embedding(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    query_embedding: list[float],
    top_k: int = 5,
    source_type: str | None = None,
) -> list[tuple[Chunk, float]]:
    """Return the top-K chunks for a tenant by cosine similarity.

    Always scoped by `tenant_id` so one tenant cannot see another's index.
    Optionally filtered by `source_type` (code / doc / ticket / thread).
    """
    if len(query_embedding) != EMBEDDING_DIM:
        raise ValueError(f"query_embedding must have exactly {EMBEDDING_DIM} dimensions")

    sql = """
        SELECT id, 1 - (embedding <=> CAST(:emb AS vector)) AS similarity
        FROM chunks
        WHERE tenant_id = :tenant_id
        {source_filter}
        ORDER BY embedding <=> CAST(:emb AS vector)
        LIMIT :k
    """.format(
        source_filter="AND source_type = :source_type" if source_type else ""
    )

    params: dict = {"tenant_id": tenant_id, "emb": str(query_embedding), "k": top_k}
    if source_type:
        params["source_type"] = source_type

    rows = (await db.execute(text(sql), params)).all()
    if not rows:
        return []

    ids = [r.id for r in rows]
    sim_by_id = {r.id: float(r.similarity) for r in rows}

    chunks = (
        await db.execute(text("SELECT * FROM chunks WHERE id = ANY(:ids)"), {"ids": ids})
    ).all()
    # Re-order to match the similarity ranking.
    chunks_by_id = {c.id: c for c in chunks}
    return [(chunks_by_id[cid], sim_by_id[cid]) for cid in ids if cid in chunks_by_id]
