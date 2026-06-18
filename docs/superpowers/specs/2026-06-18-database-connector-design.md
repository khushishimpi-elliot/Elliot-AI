# Database Connector Design — v2 Feature

## Overview

New connector type supporting PostgreSQL, MySQL, Pinecone, Weaviate, and Qdrant. Users provide a connection string; the connector auto-detects the provider, tests the connection, stores encrypted credentials, and exposes schema + query log endpoints for RAG indexing.

## Files

| File | Action |
|------|--------|
| `backend/app/services/connectors/database.py` | Create — DatabaseConnector class |
| `backend/app/schemas/database.py` | Create — request/response schemas |
| `backend/app/routers/database.py` | Create — 3 routes |
| `backend/app/main.py` | Modify — register /database router |
| `backend/tests/test_database_connector.py` | Create — 4 tests |

## Provider Detection

Auto-detected from connection string prefix:

| Prefix | Provider | Driver |
|--------|---------|--------|
| `postgresql://` or `postgres://` | PostgreSQL | asyncpg |
| `mysql://` | MySQL | aiomysql |
| `pinecone://` | Pinecone | pinecone-client |
| `weaviate://` | Weaviate | weaviate-client |
| `qdrant://` | Qdrant | qdrant-client |

## DatabaseConnector (`services/connectors/database.py`)

```python
class DatabaseConnector:
    def __init__(self, connection_string: str, encrypted: bool = False)
    async def test_connection() -> bool
    async def get_schema() -> list[dict]      # tables/columns (SQL) or indexes (vector)
    async def get_query_logs() -> list[dict]  # pg_stat_statements / MySQL general_log / vector search logs
```

**Schema output (SQL DBs):** list of `{ table_name, columns: [{ name, type, nullable, is_primary_key, foreign_key }] }`

**Schema output (Vector DBs):** list of `{ index_name/collection, dimensions, vector_count, metric }`

**Query logs (SQL):** from `pg_stat_statements` (PostgreSQL) or `information_schema` (MySQL) — `{ query, calls, total_time_ms, last_call }`

**Query logs (Vector):** recent search vectors and filters — provider-specific APIs.

## Schemas (`schemas/database.py`)

```python
class DatabaseConnectRequest(BaseModel):
    connection_string: str    # e.g. "postgresql://user:pass@host:5432/db"

class DatabaseConnectResponse(BaseModel):
    status: str               # "connected"
    provider: str             # "postgresql" | "mysql" | "pinecone" | "weaviate" | "qdrant"
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
    tables: list[TableSchema] | None       # SQL DBs
    indexes: list[VectorIndexSchema] | None  # Vector DBs
    retrieved_at: str

class DatabaseQueryLogsResponse(BaseModel):
    provider: str
    logs: list[QueryLog]
    retrieved_at: str
```

## Routes (`routers/database.py`)

Registered with `prefix="/database"`.

### `POST /{tenant_id}/connect`
1. Parse connection string, detect provider
2. Instantiate `DatabaseConnector`, call `test_connection()`
3. Return 400 if connection fails with error message
4. Encrypt connection string using `encrypt_token()` from `services/oauth.py`
5. Store in `connectors` table: `provider=detected_provider`, `oauth_token=encrypted_string`, `status="connected"`
6. Return `DatabaseConnectResponse`

### `GET /{tenant_id}/schema?provider=postgresql`
1. Look up connector from DB by `tenant_id` + `provider`
2. Return 404 if not found/not connected
3. Decrypt connection string, instantiate `DatabaseConnector`
4. Call `get_schema()`
5. Return `DatabaseSchemaResponse`

### `GET /{tenant_id}/query-logs?provider=postgresql`
1. Look up connector from DB
2. Decrypt, instantiate `DatabaseConnector`
3. Call `get_query_logs()`
4. Return `DatabaseQueryLogsResponse`

## New Dependencies

Add to `backend/pyproject.toml`:
```
"asyncpg>=0.30.0",      # already present
"aiomysql>=0.2.0",
"pinecone-client>=3.0.0",
"weaviate-client>=4.0.0",
"qdrant-client>=1.7.0",
```

## Tests (`tests/test_database_connector.py`)

| Test | What it checks |
|------|---------------|
| `test_connect_postgresql_success` | Mock asyncpg ping → 200, provider="postgresql" |
| `test_connect_invalid_string` | Bad URL format → 400 |
| `test_get_schema_success` | Mock schema query → returns tables list |
| `test_get_query_logs_success` | Mock pg_stat_statements → returns query logs |
