from unittest.mock import AsyncMock, patch

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
