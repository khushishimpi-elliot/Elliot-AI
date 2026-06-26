"""Integration tests for chunk repository — requires a running Postgres with pgvector.

Set `TEST_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/elliot_test`
to enable. Without it the tests are skipped, so CI on a vanilla runner stays
green. Local dev: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=elliot pgvector/pgvector:pg17`.
"""
import os
import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.chunk import EMBEDDING_DIM
from app.rag.repository import insert_chunk, search_by_embedding

TEST_DB_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not TEST_DB_URL, reason="TEST_DATABASE_URL not set; skipping pgvector integration tests"
)


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DB_URL, future=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with SessionLocal() as s:
        # rollback at end so tests are isolated
        yield s
        await s.rollback()
    await engine.dispose()


@pytest.fixture
async def tenant_id(db_session):
    """Insert a throwaway tenant row so FK is satisfied; return its id."""
    tid = uuid.uuid4()
    await db_session.execute(
        text("INSERT INTO tenants (id, name) VALUES (:id, :n)"),
        {"id": tid, "n": "test"},
    )
    return tid


async def test_insert_and_retrieve(db_session, tenant_id):
    chunk = await insert_chunk(
        db_session,
        tenant_id=tenant_id,
        source="x.py:1-10",
        source_type="code",
        content="def hi(): pass",
        embedding=[0.1] * EMBEDDING_DIM,
        meta={"language": "python"},
    )
    assert chunk.id is not None


async def test_insert_rejects_wrong_dim(db_session, tenant_id):
    with pytest.raises(ValueError, match="exactly 1536 dimensions"):
        await insert_chunk(
            db_session,
            tenant_id=tenant_id,
            source="x",
            source_type="code",
            content="x",
            embedding=[0.0] * 100,
        )


async def test_search_returns_most_similar_first(db_session, tenant_id):
    """Insert 3 chunks with distinct embeddings; the query closest to one
    should return that one first."""
    # Distinct unit vectors so cosine sim is well-defined.
    def vec(seed: int) -> list[float]:
        v = [0.0] * EMBEDDING_DIM
        v[seed] = 1.0
        return v

    await insert_chunk(
        db_session, tenant_id=tenant_id, source="a", source_type="code",
        content="A", embedding=vec(0),
    )
    await insert_chunk(
        db_session, tenant_id=tenant_id, source="b", source_type="code",
        content="B", embedding=vec(1),
    )
    await insert_chunk(
        db_session, tenant_id=tenant_id, source="c", source_type="code",
        content="C", embedding=vec(2),
    )

    results = await search_by_embedding(
        db_session, tenant_id=tenant_id, query_embedding=vec(1), top_k=3
    )
    assert len(results) == 3
    top_chunk, top_score = results[0]
    assert top_chunk.source == "b"
    assert top_score == pytest.approx(1.0, abs=1e-6)


async def test_search_scopes_by_tenant(db_session):
    """A chunk inserted under tenant A must NOT appear in a search under tenant B."""
    tid_a = uuid.uuid4()
    tid_b = uuid.uuid4()
    await db_session.execute(
        text("INSERT INTO tenants (id, name) VALUES (:a, 'A'), (:b, 'B')"),
        {"a": tid_a, "b": tid_b},
    )

    await insert_chunk(
        db_session, tenant_id=tid_a, source="secret", source_type="code",
        content="leak me", embedding=[0.5] * EMBEDDING_DIM,
    )

    results = await search_by_embedding(
        db_session, tenant_id=tid_b, query_embedding=[0.5] * EMBEDDING_DIM, top_k=5
    )
    assert results == [], "tenant B must not see tenant A's chunks"
