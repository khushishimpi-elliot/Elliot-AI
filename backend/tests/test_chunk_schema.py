"""Pure-Python tests for the Chunk model + Pydantic schemas (no DB)."""
import uuid

import pytest
from pydantic import ValidationError

from app.models.chunk import EMBEDDING_DIM, Chunk
from app.schemas.chunk import ChunkCreate, ChunkResponse


def test_embedding_dim_is_1536():
    assert EMBEDDING_DIM == 1536


def test_chunk_model_construction():
    tid = uuid.uuid4()
    c = Chunk(
        tenant_id=tid,
        source="github://org/repo/file.py:1-20",
        source_type="code",
        content="def hello(): ...",
        embedding=[0.0] * EMBEDDING_DIM,
        meta={"language": "python"},
    )
    assert c.tenant_id == tid
    assert c.source_type == "code"
    assert len(c.embedding) == EMBEDDING_DIM


def test_chunk_create_accepts_valid_embedding():
    payload = ChunkCreate(
        source="x.py:1-10",
        source_type="code",
        content="code here",
        embedding=[0.1] * EMBEDDING_DIM,
    )
    assert len(payload.embedding) == EMBEDDING_DIM


def test_chunk_create_rejects_short_embedding():
    with pytest.raises(ValidationError):
        ChunkCreate(
            source="x.py",
            source_type="code",
            content="x",
            embedding=[0.0] * 100,
        )


def test_chunk_create_rejects_long_embedding():
    with pytest.raises(ValidationError):
        ChunkCreate(
            source="x.py",
            source_type="code",
            content="x",
            embedding=[0.0] * (EMBEDDING_DIM + 1),
        )


def test_chunk_create_defaults_meta_to_empty_dict():
    payload = ChunkCreate(
        source="x.py", source_type="code", content="x", embedding=[0.0] * EMBEDDING_DIM
    )
    assert payload.meta == {}


def test_chunk_response_from_orm():
    cid = uuid.uuid4()
    tid = uuid.uuid4()
    c = Chunk(
        id=cid,
        tenant_id=tid,
        source="x.py",
        source_type="code",
        content="hello",
        embedding=[0.0] * EMBEDDING_DIM,
        meta={"k": "v"},
    )
    resp = ChunkResponse.model_validate(c)
    assert resp.id == cid
    assert resp.tenant_id == tid
    assert resp.meta == {"k": "v"}
