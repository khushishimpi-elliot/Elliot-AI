import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.connector import Connector
from app.services.connector_registry import CONNECTOR_REGISTRY

client = TestClient(app)
TENANT_ID = uuid.uuid4()
CLOUD_ID = "test-cloud-id"
FAKE_TOKEN = "encrypted-token"


def make_mock_connector():
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider="confluence",
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
    assert "confluence" in CONNECTOR_REGISTRY
    config = CONNECTOR_REGISTRY["confluence"]
    assert config.provider_name == "confluence"
    assert "atlassian.com" in config.authorization_url


def test_get_spaces_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/confluence/{TENANT_ID}/spaces?cloud_id={CLOUD_ID}")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_spaces_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_response = {
        "results": [
            {
                "key": "ENG",
                "name": "Engineering",
                "description": {"plain": {"value": "Engineering docs"}},
                "_links": {"webui": "/spaces/ENG"},
            }
        ]
    }

    try:
        with (
            patch("app.services.connectors.confluence.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = fake_response
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_resp
            )
            r = client.get(f"/confluence/{TENANT_ID}/spaces?cloud_id={CLOUD_ID}")
        assert r.status_code == 200
        spaces = r.json()
        assert len(spaces) == 1
        assert spaces[0]["key"] == "ENG"
        assert spaces[0]["name"] == "Engineering"
    finally:
        del app.dependency_overrides[get_db]


def test_get_pages_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/confluence/{TENANT_ID}/spaces/ENG/pages?cloud_id={CLOUD_ID}")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_pages_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_response = {
        "results": [
            {
                "id": "page-1",
                "title": "API Guidelines",
                "body": {"storage": {"value": "<p>Use REST APIs</p>"}},
                "version": {"when": "2026-06-18T10:00:00.000Z"},
                "_links": {"webui": "/spaces/ENG/pages/page-1"},
            }
        ],
        "size": 1,
    }

    try:
        with (
            patch("app.services.connectors.confluence.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = fake_response
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_resp
            )
            r = client.get(
                f"/confluence/{TENANT_ID}/spaces/ENG/pages?cloud_id={CLOUD_ID}"
            )
        assert r.status_code == 200
        pages = r.json()
        assert len(pages) == 1
        assert pages[0]["title"] == "API Guidelines"
        assert "Use REST APIs" in pages[0]["content"]
    finally:
        del app.dependency_overrides[get_db]
