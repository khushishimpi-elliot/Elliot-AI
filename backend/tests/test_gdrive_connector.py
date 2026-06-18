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
        provider="gdrive",
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
    assert "gdrive" in CONNECTOR_REGISTRY
    config = CONNECTOR_REGISTRY["gdrive"]
    assert config.provider_name == "gdrive"
    assert "google.com" in config.authorization_url


def test_list_files_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/gdrive/{TENANT_ID}/files")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_list_files_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_response = {
        "files": [
            {
                "id": "file-1",
                "name": "Architecture Notes",
                "mimeType": "application/vnd.google-apps.document",
                "webViewLink": "https://docs.google.com/document/d/file-1",
                "modifiedTime": "2026-06-18T10:00:00.000Z",
            }
        ]
    }

    try:
        with (
            patch("app.services.connectors.gdrive.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_list_resp = MagicMock()
            mock_list_resp.raise_for_status = MagicMock()
            mock_list_resp.json.return_value = fake_response

            mock_export_resp = MagicMock()
            mock_export_resp.raise_for_status = MagicMock()
            mock_export_resp.text = "Document content here"

            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=[mock_list_resp, mock_export_resp]
            )

            r = client.get(f"/gdrive/{TENANT_ID}/files")

        assert r.status_code == 200
        files = r.json()
        assert len(files) == 1
        assert files[0]["name"] == "Architecture Notes"
        assert "Document content here" in files[0]["content"]
    finally:
        del app.dependency_overrides[get_db]


def test_get_file_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/gdrive/{TENANT_ID}/files/file-1")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_file_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_file = {
        "id": "file-1",
        "name": "Design Doc",
        "mimeType": "application/vnd.google-apps.document",
        "webViewLink": "https://docs.google.com/document/d/file-1",
        "modifiedTime": "2026-06-18T10:00:00.000Z",
    }

    try:
        with (
            patch("app.services.connectors.gdrive.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_meta_resp = MagicMock()
            mock_meta_resp.raise_for_status = MagicMock()
            mock_meta_resp.json.return_value = fake_file

            mock_export_resp = MagicMock()
            mock_export_resp.raise_for_status = MagicMock()
            mock_export_resp.text = "Full design document text"

            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=[mock_meta_resp, mock_export_resp]
            )

            r = client.get(f"/gdrive/{TENANT_ID}/files/file-1")

        assert r.status_code == 200
        assert r.json()["name"] == "Design Doc"
        assert "Full design document text" in r.json()["content"]
    finally:
        del app.dependency_overrides[get_db]
