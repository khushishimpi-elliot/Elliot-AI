# Database Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostgreSQL, MySQL, Pinecone, Weaviate, and Qdrant connectors that extract schema and query logs for RAG indexing via a connection string.

**Architecture:** `DatabaseConnector` service auto-detects the provider from the connection string prefix and implements `test_connection`, `get_schema`, and `get_query_logs` for each. Three routes expose connect/schema/query-logs. Connection strings are encrypted at rest using the existing `encrypt_token` utility.

**Tech Stack:** FastAPI, asyncpg, aiomysql, pinecone-client, weaviate-client, qdrant-client, pytest, AsyncMock

---

### Task 1: Create feature branch + install dependencies

**Files:**
- Modify: `backend/pyproject.toml`

- [ ] **Step 1: Create branch**

```bash
cd Elliot-AI
git checkout main
git pull
git checkout -b connectors/db-connector
```

- [ ] **Step 2: Add dependencies to `backend/pyproject.toml`**

In the `dependencies` list, add after `asyncpg`:

```toml
    "aiomysql>=0.2.0",
    "pinecone-client>=3.0.0",
    "weaviate-client>=4.0.0",
    "qdrant-client>=1.9.0",
```

- [ ] **Step 3: Install**

```bash
cd backend
pip install -e ".[dev]" -q
python -c "import aiomysql; import pinecone; import weaviate; import qdrant_client; print('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
cd ..
git add backend/pyproject.toml
git commit -m "feat(db-connector): add database driver dependencies"
```

---

### Task 2: Create schemas

**Files:**
- Create: `backend/app/schemas/database.py`

- [ ] **Step 1: Create `backend/app/schemas/database.py`**

```python
from datetime import datetime
from pydantic import BaseModel


class DatabaseConnectRequest(BaseModel):
    connection_string: str


class DatabaseConnectResponse(BaseModel):
    status: str
    provider: str
    message: str


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    is_primary_key: bool
    foreign_key: str | None


class TableSchema(BaseModel):
    table_name: str
    columns: list[ColumnInfo]


class VectorIndexSchema(BaseModel):
    index_name: str
    dimensions: int | None
    vector_count: int | None
    metric: str | None


class QueryLog(BaseModel):
    query: str
    calls: int | None
    total_time_ms: float | None
    last_call: str | None


class DatabaseSchemaResponse(BaseModel):
    provider: str
    tables: list[TableSchema] | None
    indexes: list[VectorIndexSchema] | None
    retrieved_at: str


class DatabaseQueryLogsResponse(BaseModel):
    provider: str
    logs: list[QueryLog]
    retrieved_at: str
```

- [ ] **Step 2: Verify**

```bash
cd backend
python -c "from app.schemas.database import DatabaseConnectRequest, DatabaseSchemaResponse; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
cd ..
git add backend/app/schemas/database.py
git commit -m "feat(db-connector): add database connector schemas"
```

---

### Task 3: Create DatabaseConnector service (TDD)

**Files:**
- Create: `backend/app/services/connectors/database.py`
- Create: `backend/tests/test_database_connector.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_database_connector.py`:

```python
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.connectors.database import DatabaseConnector


def test_detect_provider_postgresql():
    c = DatabaseConnector("postgresql://user:pass@localhost:5432/mydb")
    assert c.provider == "postgresql"


def test_detect_provider_postgres_alias():
    c = DatabaseConnector("postgres://user:pass@localhost/mydb")
    assert c.provider == "postgresql"


def test_detect_provider_mysql():
    c = DatabaseConnector("mysql://user:pass@localhost:3306/mydb")
    assert c.provider == "mysql"


def test_detect_provider_pinecone():
    c = DatabaseConnector("pinecone://apikey@us-east1-gcp")
    assert c.provider == "pinecone"


def test_detect_provider_weaviate():
    c = DatabaseConnector("weaviate://localhost:8080")
    assert c.provider == "weaviate"


def test_detect_provider_qdrant():
    c = DatabaseConnector("qdrant://localhost:6333")
    assert c.provider == "qdrant"


def test_detect_provider_invalid():
    with pytest.raises(ValueError, match="Unsupported"):
        DatabaseConnector("mongodb://localhost:27017/db")


@pytest.mark.asyncio
async def test_connect_postgresql_success():
    with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_conn = AsyncMock()
        mock_connect.return_value = mock_conn
        c = DatabaseConnector("postgresql://user:pass@localhost:5432/mydb")
        result = await c.test_connection()
        assert result is True
        mock_conn.close.assert_called_once()


@pytest.mark.asyncio
async def test_connect_postgresql_failure():
    with patch("asyncpg.connect", side_effect=Exception("connection refused")):
        c = DatabaseConnector("postgresql://user:pass@localhost:5432/mydb")
        result = await c.test_connection()
        assert result is False


@pytest.mark.asyncio
async def test_get_schema_postgresql():
    mock_rows = [
        {"table_name": "users", "column_name": "id", "data_type": "integer",
         "is_nullable": "NO", "is_primary_key": True, "foreign_key": None},
        {"table_name": "users", "column_name": "email", "data_type": "text",
         "is_nullable": "NO", "is_primary_key": False, "foreign_key": None},
    ]
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=mock_rows)
    with patch("asyncpg.connect", new_callable=AsyncMock, return_value=mock_conn):
        c = DatabaseConnector("postgresql://user:pass@localhost:5432/mydb")
        tables = await c.get_schema()
        assert len(tables) == 1
        assert tables[0]["table_name"] == "users"
        assert len(tables[0]["columns"]) == 2


@pytest.mark.asyncio
async def test_get_query_logs_postgresql():
    mock_rows = [
        {"query": "SELECT * FROM users", "calls": 42,
         "total_time": 100.5, "last_call": "2026-06-18T10:00:00Z"},
    ]
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=mock_rows)
    with patch("asyncpg.connect", new_callable=AsyncMock, return_value=mock_conn):
        c = DatabaseConnector("postgresql://user:pass@localhost:5432/mydb")
        logs = await c.get_query_logs()
        assert len(logs) == 1
        assert logs[0]["query"] == "SELECT * FROM users"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_database_connector.py -v
```

Expected: FAIL — `ImportError` for `database` module

- [ ] **Step 3: Create `backend/app/services/connectors/database.py`**

```python
"""Database connector for PostgreSQL, MySQL, Pinecone, Weaviate, and Qdrant.

Extracts schema and query logs for RAG indexing.
Connection strings are auto-detected by prefix.
"""
from datetime import UTC, datetime
from urllib.parse import urlparse

PROVIDER_PREFIXES = {
    "postgresql": ["postgresql://", "postgres://"],
    "mysql": ["mysql://"],
    "pinecone": ["pinecone://"],
    "weaviate": ["weaviate://"],
    "qdrant": ["qdrant://"],
}


class DatabaseConnector:
    """Unified connector for SQL and vector databases."""

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.provider = self._detect_provider(connection_string)

    def _detect_provider(self, cs: str) -> str:
        for provider, prefixes in PROVIDER_PREFIXES.items():
            if any(cs.startswith(p) for p in prefixes):
                return provider
        supported = ", ".join(
            p for prefixes in PROVIDER_PREFIXES.values() for p in prefixes
        )
        raise ValueError(
            f"Unsupported connection string. Must start with: {supported}"
        )

    async def test_connection(self) -> bool:
        """Ping the database and return True if reachable."""
        try:
            if self.provider == "postgresql":
                import asyncpg
                conn = await asyncpg.connect(self.connection_string, timeout=10.0)
                await conn.close()
                return True

            elif self.provider == "mysql":
                import aiomysql
                parsed = urlparse(self.connection_string)
                conn = await aiomysql.connect(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 3306,
                    user=parsed.username or "",
                    password=parsed.password or "",
                    db=(parsed.path or "/").lstrip("/"),
                    connect_timeout=10,
                )
                conn.close()
                return True

            elif self.provider == "pinecone":
                import pinecone
                parsed = urlparse(self.connection_string)
                pc = pinecone.Pinecone(api_key=parsed.username or "")
                pc.list_indexes()
                return True

            elif self.provider == "weaviate":
                import weaviate
                parsed = urlparse(self.connection_string)
                client = weaviate.connect_to_custom(
                    http_host=parsed.hostname or "localhost",
                    http_port=parsed.port or 8080,
                    http_secure=False,
                )
                ready = client.is_ready()
                client.close()
                return ready

            elif self.provider == "qdrant":
                from qdrant_client import QdrantClient
                parsed = urlparse(self.connection_string)
                client = QdrantClient(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 6333,
                    timeout=10,
                )
                client.get_collections()
                return True

        except Exception:
            return False
        return False

    async def get_schema(self) -> list[dict]:
        """Return schema: tables+columns for SQL, indexes for vector DBs."""
        if self.provider == "postgresql":
            import asyncpg
            conn = await asyncpg.connect(self.connection_string, timeout=10.0)
            try:
                rows = await conn.fetch("""
                    SELECT
                        t.table_name,
                        c.column_name,
                        c.data_type,
                        c.is_nullable,
                        COALESCE(pk.is_pk, false) AS is_primary_key,
                        fk.foreign_ref AS foreign_key
                    FROM information_schema.tables t
                    JOIN information_schema.columns c
                        ON t.table_name = c.table_name
                        AND t.table_schema = c.table_schema
                    LEFT JOIN (
                        SELECT kcu.table_name, kcu.column_name, true AS is_pk
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                    ) pk ON pk.table_name = t.table_name AND pk.column_name = c.column_name
                    LEFT JOIN (
                        SELECT kcu.table_name, kcu.column_name,
                               ccu.table_name || '.' || ccu.column_name AS foreign_ref
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                    ) fk ON fk.table_name = t.table_name AND fk.column_name = c.column_name
                    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
                    ORDER BY t.table_name, c.ordinal_position
                """)
                tables: dict[str, dict] = {}
                for row in rows:
                    tn = row["table_name"]
                    if tn not in tables:
                        tables[tn] = {"table_name": tn, "columns": []}
                    tables[tn]["columns"].append({
                        "name": row["column_name"],
                        "type": row["data_type"],
                        "nullable": row["is_nullable"] == "YES",
                        "is_primary_key": bool(row["is_primary_key"]),
                        "foreign_key": row["foreign_key"],
                    })
                return list(tables.values())
            finally:
                await conn.close()

        elif self.provider == "mysql":
            import aiomysql
            parsed = urlparse(self.connection_string)
            conn = await aiomysql.connect(
                host=parsed.hostname or "localhost",
                port=parsed.port or 3306,
                user=parsed.username or "",
                password=parsed.password or "",
                db=(parsed.path or "/").lstrip("/"),
            )
            try:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("""
                        SELECT TABLE_NAME as table_name,
                               COLUMN_NAME as column_name,
                               DATA_TYPE as data_type,
                               IS_NULLABLE as is_nullable,
                               COLUMN_KEY as column_key,
                               REFERENCED_TABLE_NAME as ref_table,
                               REFERENCED_COLUMN_NAME as ref_col
                        FROM information_schema.COLUMNS c
                        LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
                            ON kcu.TABLE_NAME = c.TABLE_NAME
                            AND kcu.COLUMN_NAME = c.COLUMN_NAME
                            AND kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
                        WHERE c.TABLE_SCHEMA = DATABASE()
                        ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
                    """)
                    rows = await cur.fetchall()
                tables: dict[str, dict] = {}
                for row in rows:
                    tn = row["table_name"]
                    if tn not in tables:
                        tables[tn] = {"table_name": tn, "columns": []}
                    fk = None
                    if row.get("ref_table"):
                        fk = f"{row['ref_table']}.{row['ref_col']}"
                    tables[tn]["columns"].append({
                        "name": row["column_name"],
                        "type": row["data_type"],
                        "nullable": row["is_nullable"] == "YES",
                        "is_primary_key": row.get("column_key") == "PRI",
                        "foreign_key": fk,
                    })
                return list(tables.values())
            finally:
                conn.close()

        elif self.provider == "pinecone":
            import pinecone
            parsed = urlparse(self.connection_string)
            pc = pinecone.Pinecone(api_key=parsed.username or "")
            indexes = pc.list_indexes()
            result = []
            for idx in indexes:
                result.append({
                    "index_name": idx.name,
                    "dimensions": getattr(idx.dimension, "__int__", lambda: None)(),
                    "vector_count": None,
                    "metric": str(idx.metric) if hasattr(idx, "metric") else None,
                })
            return result

        elif self.provider == "weaviate":
            import weaviate
            parsed = urlparse(self.connection_string)
            client = weaviate.connect_to_custom(
                http_host=parsed.hostname or "localhost",
                http_port=parsed.port or 8080,
                http_secure=False,
            )
            try:
                collections = client.collections.list_all()
                return [
                    {
                        "index_name": name,
                        "dimensions": None,
                        "vector_count": None,
                        "metric": None,
                    }
                    for name in collections
                ]
            finally:
                client.close()

        elif self.provider == "qdrant":
            from qdrant_client import QdrantClient
            parsed = urlparse(self.connection_string)
            client = QdrantClient(
                host=parsed.hostname or "localhost",
                port=parsed.port or 6333,
                timeout=10,
            )
            collections = client.get_collections().collections
            result = []
            for col in collections:
                info = client.get_collection(col.name)
                result.append({
                    "index_name": col.name,
                    "dimensions": info.config.params.vectors.size
                    if hasattr(info.config.params.vectors, "size") else None,
                    "vector_count": info.vectors_count,
                    "metric": str(info.config.params.vectors.distance)
                    if hasattr(info.config.params.vectors, "distance") else None,
                })
            return result

        return []

    async def get_query_logs(self, limit: int = 50) -> list[dict]:
        """Return recent query logs."""
        if self.provider == "postgresql":
            import asyncpg
            conn = await asyncpg.connect(self.connection_string, timeout=10.0)
            try:
                rows = await conn.fetch(f"""
                    SELECT query, calls, total_exec_time AS total_time,
                           now()::text AS last_call
                    FROM pg_stat_statements
                    ORDER BY total_exec_time DESC
                    LIMIT {limit}
                """)
                return [
                    {
                        "query": r["query"],
                        "calls": r["calls"],
                        "total_time": r["total_time"],
                        "last_call": r["last_call"],
                    }
                    for r in rows
                ]
            except Exception:
                return []
            finally:
                await conn.close()

        elif self.provider == "mysql":
            import aiomysql
            parsed = urlparse(self.connection_string)
            conn = await aiomysql.connect(
                host=parsed.hostname or "localhost",
                port=parsed.port or 3306,
                user=parsed.username or "",
                password=parsed.password or "",
                db=(parsed.path or "/").lstrip("/"),
            )
            try:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute(f"""
                        SELECT SQL_TEXT AS query,
                               COUNT_STAR AS calls,
                               SUM_TIMER_WAIT / 1e9 AS total_time,
                               LAST_SEEN AS last_call
                        FROM performance_schema.events_statements_summary_by_digest
                        ORDER BY SUM_TIMER_WAIT DESC
                        LIMIT {limit}
                    """)
                    rows = await cur.fetchall()
                return [
                    {
                        "query": r["query"] or "",
                        "calls": r["calls"],
                        "total_time": float(r["total_time"]) if r["total_time"] else None,
                        "last_call": str(r["last_call"]) if r["last_call"] else None,
                    }
                    for r in rows
                ]
            except Exception:
                return []
            finally:
                conn.close()

        # Vector DBs don't have traditional query logs — return empty
        return []
```

- [ ] **Step 4: Run all tests**

```bash
cd backend
python -m pytest tests/test_database_connector.py -v
```

Expected: all 11 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/app/services/connectors/database.py backend/tests/test_database_connector.py
git commit -m "feat(db-connector): add DatabaseConnector service with PostgreSQL/MySQL/vector support"
```

---

### Task 4: Create database router + register in main.py (TDD)

**Files:**
- Create: `backend/app/routers/database.py`
- Modify: `backend/app/main.py`
- Modify: `backend/tests/test_database_connector.py`

- [ ] **Step 1: Append route tests to `backend/tests/test_database_connector.py`**

```python
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.db.session import get_db
from app.main import app

client = TestClient(app)
TENANT_ID = uuid.uuid4()


def make_mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_connect_endpoint_success():
    mock_db = make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        with patch(
            "app.services.connectors.database.DatabaseConnector.test_connection",
            new_callable=AsyncMock,
            return_value=True,
        ):
            r = client.post(
                f"/database/{TENANT_ID}/connect",
                json={"connection_string": "postgresql://user:pass@localhost:5432/db"},
            )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "connected"
        assert body["provider"] == "postgresql"
    finally:
        app.dependency_overrides.clear()


def test_connect_endpoint_invalid_string():
    mock_db = make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.post(
            f"/database/{TENANT_ID}/connect",
            json={"connection_string": "mongodb://localhost:27017/db"},
        )
        assert r.status_code == 400
        assert "Unsupported" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_connect_endpoint_connection_fails():
    mock_db = make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        with patch(
            "app.services.connectors.database.DatabaseConnector.test_connection",
            new_callable=AsyncMock,
            return_value=False,
        ):
            r = client.post(
                f"/database/{TENANT_ID}/connect",
                json={"connection_string": "postgresql://user:wrong@localhost:5432/db"},
            )
        assert r.status_code == 400
        assert "connect" in r.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
```

- [ ] **Step 2: Run new tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_database_connector.py -v -k "endpoint"
```

Expected: FAIL — 404 (routes don't exist)

- [ ] **Step 3: Create `backend/app/routers/database.py`**

```python
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.database import (
    DatabaseConnectRequest,
    DatabaseConnectResponse,
    DatabaseQueryLogsResponse,
    DatabaseSchemaResponse,
    QueryLog,
    TableSchema,
    VectorIndexSchema,
)
from app.services.connectors.database import DatabaseConnector
from app.services.oauth import encrypt_token

router = APIRouter(tags=["database"])


@router.post("/{tenant_id}/connect", response_model=DatabaseConnectResponse)
async def connect_database(
    tenant_id: UUID,
    payload: DatabaseConnectRequest,
    db: AsyncSession = Depends(get_db),
) -> DatabaseConnectResponse:
    try:
        connector = DatabaseConnector(payload.connection_string)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    reachable = await connector.test_connection()
    if not reachable:
        raise HTTPException(
            status_code=400,
            detail=f"Could not connect to {connector.provider} database. Check your connection string.",
        )

    encrypted = encrypt_token(payload.connection_string)

    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == connector.provider)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.oauth_token = encrypted
        existing.status = "connected"
    else:
        db.add(
            Connector(
                tenant_id=tenant_id,
                provider=connector.provider,
                status="connected",
                oauth_token=encrypted,
            )
        )

    await db.commit()
    return DatabaseConnectResponse(
        status="connected",
        provider=connector.provider,
        message=f"Successfully connected to {connector.provider} database.",
    )


@router.get("/{tenant_id}/schema", response_model=DatabaseSchemaResponse)
async def get_database_schema(
    tenant_id: UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> DatabaseSchemaResponse:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == provider)
            & (Connector.status == "connected")
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.oauth_token:
        raise HTTPException(status_code=404, detail=f"{provider} connector not found or not connected")

    from app.services.oauth import decrypt_token
    connection_string = decrypt_token(record.oauth_token)
    connector = DatabaseConnector(connection_string)

    try:
        raw = await connector.get_schema()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    is_vector = provider in ("pinecone", "weaviate", "qdrant")
    return DatabaseSchemaResponse(
        provider=provider,
        tables=[TableSchema(**t) for t in raw] if not is_vector else None,
        indexes=[VectorIndexSchema(**i) for i in raw] if is_vector else None,
        retrieved_at=datetime.now(UTC).isoformat(),
    )


@router.get("/{tenant_id}/query-logs", response_model=DatabaseQueryLogsResponse)
async def get_query_logs(
    tenant_id: UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> DatabaseQueryLogsResponse:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == provider)
            & (Connector.status == "connected")
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.oauth_token:
        raise HTTPException(status_code=404, detail=f"{provider} connector not found or not connected")

    from app.services.oauth import decrypt_token
    connection_string = decrypt_token(record.oauth_token)
    connector = DatabaseConnector(connection_string)

    try:
        raw = await connector.get_query_logs()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return DatabaseQueryLogsResponse(
        provider=provider,
        logs=[QueryLog(**q) for q in raw],
        retrieved_at=datetime.now(UTC).isoformat(),
    )
```

- [ ] **Step 4: Register database router in `backend/app/main.py`**

Read `backend/app/main.py`. Add:
```python
from app.routers import database
```
and:
```python
app.include_router(database.router, prefix="/database", tags=["database"])
```

- [ ] **Step 5: Run all tests**

```bash
cd backend
python -m pytest tests/test_database_connector.py -v
python -m pytest -q
```

Expected: all database tests PASS, full suite passes

- [ ] **Step 6: Run ruff**

```bash
python -m ruff check .
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/app/routers/database.py backend/tests/test_database_connector.py backend/app/main.py
git commit -m "feat(db-connector): add database connector routes"
```

---

### Task 5: Push branch and open PR

- [ ] **Step 1: Push**

```bash
git push -u origin connectors/db-connector
```

- [ ] **Step 2: Open PR on GitHub**

Title: `Database connector — PostgreSQL, MySQL, Pinecone, Weaviate, Qdrant`

Body:
```
Adds database connectors for SQL and vector databases.

Changes:
- `backend/app/services/connectors/database.py` — DatabaseConnector with test, schema, query logs
- `backend/app/routers/database.py` — POST /connect, GET /schema, GET /query-logs
- `backend/app/schemas/database.py` — request/response schemas
- `backend/app/main.py` — register /database router
- `backend/tests/test_database_connector.py` — 14 tests
- `backend/pyproject.toml` — aiomysql, pinecone-client, weaviate-client, qdrant-client

Supports: postgresql://, mysql://, pinecone://, weaviate://, qdrant://
Connection strings encrypted at rest using existing Fernet key.
```

- [ ] **Step 3: Wait for CI green, merge**
