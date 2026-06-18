"""Database connector for PostgreSQL, MySQL, Pinecone, Weaviate, and Qdrant."""
from urllib.parse import urlparse

PROVIDER_PREFIXES = {
    "postgresql": ["postgresql://", "postgres://"],
    "mysql": ["mysql://"],
    "pinecone": ["pinecone://"],
    "weaviate": ["weaviate://"],
    "qdrant": ["qdrant://"],
}


class DatabaseConnector:
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
        raise ValueError(f"Unsupported connection string. Must start with: {supported}")

    async def test_connection(self) -> bool:
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
                import asyncio

                import pinecone
                parsed = urlparse(self.connection_string)
                pc = pinecone.Pinecone(api_key=parsed.username or "")
                await asyncio.to_thread(pc.list_indexes)
                return True
            elif self.provider == "weaviate":
                import asyncio

                import weaviate
                parsed = urlparse(self.connection_string)
                client = weaviate.connect_to_custom(
                    http_host=parsed.hostname or "localhost",
                    http_port=parsed.port or 8080,
                    http_secure=False,
                )
                ready = await asyncio.to_thread(client.is_ready)
                client.close()
                return bool(ready)
            elif self.provider == "qdrant":
                import asyncio

                from qdrant_client import QdrantClient
                parsed = urlparse(self.connection_string)
                client = QdrantClient(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 6333,
                    timeout=10,
                )
                await asyncio.to_thread(client.get_collections)
                return True
        except Exception:
            return False
        return False

    async def get_schema(self) -> list[dict]:
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
                        SELECT c.TABLE_NAME as table_name,
                               c.COLUMN_NAME as column_name,
                               c.DATA_TYPE as data_type,
                               c.IS_NULLABLE as is_nullable,
                               CASE WHEN c.COLUMN_KEY = 'PRI'
                                    THEN true ELSE false
                                    END as is_primary_key,
                               CASE WHEN kcu.REFERENCED_TABLE_NAME IS NOT NULL
                                    THEN CONCAT(
                                        kcu.REFERENCED_TABLE_NAME,
                                        '.',
                                        kcu.REFERENCED_COLUMN_NAME
                                    )
                                    ELSE NULL END as foreign_key
                        FROM information_schema.COLUMNS c
                        LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
                            ON kcu.TABLE_NAME = c.TABLE_NAME
                            AND kcu.COLUMN_NAME = c.COLUMN_NAME
                            AND kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
                            AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
                        WHERE c.TABLE_SCHEMA = DATABASE()
                        ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
                    """)
                    rows = await cur.fetchall()
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
                conn.close()

        elif self.provider == "pinecone":
            import asyncio

            import pinecone
            parsed = urlparse(self.connection_string)
            pc = pinecone.Pinecone(api_key=parsed.username or "")
            indexes = await asyncio.to_thread(pc.list_indexes)
            return [
                {
                    "index_name": idx.name,
                    "dimensions": getattr(idx, "dimension", None),
                    "vector_count": None,
                    "metric": str(idx.metric) if hasattr(idx, "metric") else None,
                }
                for idx in indexes
            ]

        elif self.provider == "weaviate":
            import asyncio

            import weaviate
            parsed = urlparse(self.connection_string)
            client = weaviate.connect_to_custom(
                http_host=parsed.hostname or "localhost",
                http_port=parsed.port or 8080,
                http_secure=False,
            )
            try:
                collections = await asyncio.to_thread(client.collections.list_all)
                return [
                    {"index_name": name, "dimensions": None, "vector_count": None, "metric": None}
                    for name in collections
                ]
            finally:
                client.close()

        elif self.provider == "qdrant":
            import asyncio

            from qdrant_client import QdrantClient
            parsed = urlparse(self.connection_string)
            client = QdrantClient(
                host=parsed.hostname or "localhost",
                port=parsed.port or 6333,
                timeout=10,
            )
            collections_resp = await asyncio.to_thread(client.get_collections)
            collections = collections_resp.collections
            result = []
            for col in collections:
                info = await asyncio.to_thread(client.get_collection, col.name)
                vectors = info.config.params.vectors
                result.append({
                    "index_name": col.name,
                    "dimensions": getattr(vectors, "size", None),
                    "vector_count": info.vectors_count,
                    "metric": str(getattr(vectors, "distance", None)),
                })
            return result

        return []

    async def get_query_logs(self, limit: int = 50) -> list[dict]:
        limit = max(1, min(int(limit), 500))  # clamp to safe range
        if self.provider == "postgresql":
            import asyncpg
            conn = await asyncpg.connect(self.connection_string, timeout=10.0)
            try:
                rows = await conn.fetch(
                    f"SELECT query, calls, total_exec_time AS total_time, "
                    f"now()::text AS last_call FROM pg_stat_statements "
                    f"ORDER BY total_exec_time DESC LIMIT {limit}"
                )
                return [
                    {
                        "query": r["query"],
                        "calls": r["calls"],
                        "total_time_ms": float(r["total_time"]) if r["total_time"] else None,
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
                    await cur.execute(
                        f"SELECT SQL_TEXT AS query, COUNT_STAR AS calls, "
                        f"SUM_TIMER_WAIT / 1e9 AS total_time, LAST_SEEN AS last_call "
                        f"FROM performance_schema.events_statements_summary_by_digest "
                        f"ORDER BY SUM_TIMER_WAIT DESC LIMIT {limit}"
                    )
                    rows = await cur.fetchall()
                return [
                    {
                        "query": r["query"] or "",
                        "calls": r["calls"],
                        "total_time_ms": float(r["total_time"]) if r["total_time"] else None,
                        "last_call": str(r["last_call"]) if r["last_call"] else None,
                    }
                    for r in rows
                ]
            except Exception:
                return []
            finally:
                conn.close()

        return []
