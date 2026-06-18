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
        provider="sharepoint",
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
    assert "sharepoint" in CONNECTOR_REGISTRY
    config = CONNECTOR_REGISTRY["sharepoint"]
    assert config.provider_name == "sharepoint"
    assert "microsoftonline.com" in config.authorization_url


def test_get_sites_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/sharepoint/{TENANT_ID}/sites")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_sites_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_response = {
        "value": [
            {
                "id": "site-1",
                "displayName": "Engineering Wiki",
                "webUrl": "https://company.sharepoint.com/sites/engineering",
                "description": "Engineering documentation",
            }
        ]
    }

    try:
        with (
            patch("app.services.connectors.sharepoint.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = fake_response
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_resp
            )
            r = client.get(f"/sharepoint/{TENANT_ID}/sites")
        assert r.status_code == 200
        sites = r.json()
        assert len(sites) == 1
        assert sites[0]["name"] == "Engineering Wiki"
    finally:
        del app.dependency_overrides[get_db]


def test_get_documents_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/sharepoint/{TENANT_ID}/sites/site-1/documents")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_documents_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_response = {
        "value": [
            {
                "id": "doc-1",
                "name": "Architecture.docx",
                "file": {},
                "webUrl": "https://company.sharepoint.com/sites/engineering/Architecture.docx",
                "lastModifiedDateTime": "2026-06-18T10:00:00Z",
                "@microsoft.graph.downloadUrl": "",
            }
        ]
    }

    try:
        with (
            patch("app.services.connectors.sharepoint.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = fake_response
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_resp
            )
            r = client.get(f"/sharepoint/{TENANT_ID}/sites/site-1/documents")
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) == 1
        assert docs[0]["name"] == "Architecture.docx"
    finally:
        del app.dependency_overrides[get_db]
