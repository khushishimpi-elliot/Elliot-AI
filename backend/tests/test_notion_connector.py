import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.connector import Connector
from app.services.connector_registry import CONNECTOR_REGISTRY

client = TestClient(app)
TENANT_ID = uuid.uuid4()
FAKE_TOKEN = "encrypted-token"


def make_mock_connector():
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider="notion",
        status="connected",
        oauth_token=FAKE_TOKEN,
    )


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_oauth_config_registered():
    assert "notion" in CONNECTOR_REGISTRY
    config = CONNECTOR_REGISTRY["notion"]
    assert config.provider_name == "notion"
    assert "api.notion.com" in config.authorization_url
    assert "api.notion.com" in config.token_url


def test_extract_text_from_blocks():
    from app.services.connectors.notion import NotionConnector
    connector = NotionConnector.__new__(NotionConnector)
    blocks = [
        {"type": "paragraph", "paragraph": {"rich_text": [{"plain_text": "Hello world"}]}},
        {"type": "heading_1", "heading_1": {"rich_text": [{"plain_text": "Section title"}]}},
        {
            "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": [{"plain_text": "Bullet point"}]},
        },
    ]
    text = connector._extract_text(blocks)
    assert "Hello world" in text
    assert "Section title" in text
    assert "Bullet point" in text


def test_get_pages_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/notion/{TENANT_ID}/pages")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_pages_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_search_response = {
        "results": [
            {
                "id": "page-1",
                "object": "page",
                "url": "https://notion.so/page-1",
                "last_edited_time": "2026-06-18T10:00:00.000Z",
                "properties": {
                    "title": {
                        "type": "title",
                        "title": [{"plain_text": "My Test Page"}]
                    }
                },
            }
        ]
    }
    fake_blocks_response = {
        "results": [
            {"type": "paragraph", "paragraph": {"rich_text": [{"plain_text": "Page content here"}]}}
        ]
    }

    try:
        with (
            patch("app.services.connectors.notion.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp_search = MagicMock()
            mock_resp_search.raise_for_status = MagicMock()
            mock_resp_search.json.return_value = fake_search_response

            mock_resp_blocks = MagicMock()
            mock_resp_blocks.raise_for_status = MagicMock()
            mock_resp_blocks.json.return_value = fake_blocks_response

            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_resp_search
            )
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_resp_blocks
            )

            r = client.get(f"/notion/{TENANT_ID}/pages")

        assert r.status_code == 200
        pages = r.json()
        assert len(pages) == 1
        assert pages[0]["title"] == "My Test Page"
        assert "Page content here" in pages[0]["content"]
    finally:
        del app.dependency_overrides[get_db]


def test_get_databases_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_search_response = {
        "results": [
            {
                "id": "db-1",
                "object": "database",
                "url": "https://notion.so/db-1",
                "title": [{"plain_text": "My Database"}],
            }
        ]
    }
    fake_query_response = {"results": [{"id": "entry-1", "properties": {}}]}

    try:
        with (
            patch("app.services.connectors.notion.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp_search = MagicMock()
            mock_resp_search.raise_for_status = MagicMock()
            mock_resp_search.json.return_value = fake_search_response

            mock_resp_query = MagicMock()
            mock_resp_query.raise_for_status = MagicMock()
            mock_resp_query.json.return_value = fake_query_response

            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=[mock_resp_search, mock_resp_query]
            )

            r = client.get(f"/notion/{TENANT_ID}/databases")

        assert r.status_code == 200
        dbs = r.json()
        assert len(dbs) == 1
        assert dbs[0]["title"] == "My Database"
    finally:
        del app.dependency_overrides[get_db]
