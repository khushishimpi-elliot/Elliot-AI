import uuid as _uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
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


_client = TestClient(app)
_TENANT_ID = _uuid.uuid4()


def _make_mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_connect_endpoint_success():
    mock_db = _make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        with patch(
            "app.services.connectors.database.DatabaseConnector.test_connection",
            new_callable=AsyncMock,
            return_value=True,
        ), patch("app.routers.database.encrypt_token", return_value="encrypted"):
            r = _client.post(
                f"/database/{_TENANT_ID}/connect",
                json={"connection_string": "postgresql://user:pass@localhost:5432/db"},
            )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "connected"
        assert body["provider"] == "postgresql"
    finally:
        app.dependency_overrides.clear()


def test_connect_endpoint_invalid_string():
    mock_db = _make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = _client.post(
            f"/database/{_TENANT_ID}/connect",
            json={"connection_string": "mongodb://localhost:27017/db"},
        )
        assert r.status_code == 400
        assert "Unsupported" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_connect_endpoint_connection_fails():
    mock_db = _make_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        with patch(
            "app.services.connectors.database.DatabaseConnector.test_connection",
            new_callable=AsyncMock,
            return_value=False,
        ):
            r = _client.post(
                f"/database/{_TENANT_ID}/connect",
                json={"connection_string": "postgresql://user:wrong@localhost:5432/db"},
            )
        assert r.status_code == 400
        assert "connect" in r.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
