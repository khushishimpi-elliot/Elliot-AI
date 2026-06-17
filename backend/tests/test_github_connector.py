import hashlib
import hmac
import os
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.config import get_settings
from app.db.session import get_db
from app.main import app
from app.models.connector import Connector

client = TestClient(app)

TENANT_ID = uuid.uuid4()
FAKE_TOKEN = "encrypted-token"


def make_mock_connector(provider="github"):
    c = Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider=provider,
        status="connected",
        oauth_token=FAKE_TOKEN,
    )
    return c


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_get_repos_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/github/{TENANT_ID}/repos?owner=testuser")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_repos_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_repos = [
        {
            "name": "my-repo",
            "full_name": "testuser/my-repo",
            "description": "A repo",
            "owner": {"login": "testuser"},
            "private": False,
            "default_branch": "main",
        }
    ]

    try:
        with (
            patch("app.services.connectors.github.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_repos
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/github/{TENANT_ID}/repos?owner=testuser")
        assert r.status_code == 200
        assert r.json()[0]["name"] == "my-repo"
    finally:
        del app.dependency_overrides[get_db]


def test_get_prs_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_prs = [
        {
            "number": 1,
            "title": "Fix bug",
            "body": "fixes the bug",
            "user": {"login": "alice"},
            "state": "open",
            "created_at": "2026-06-16T00:00:00Z",
            "updated_at": "2026-06-16T01:00:00Z",
            "head": {"ref": "fix-branch"},
            "base": {"ref": "main"},
        }
    ]

    try:
        with (
            patch("app.services.connectors.github.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_prs
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/github/{TENANT_ID}/repos/testuser/my-repo/prs")
        assert r.status_code == 200
        assert r.json()[0]["title"] == "Fix bug"
    finally:
        del app.dependency_overrides[get_db]


def test_webhook_missing_signature():
    r = client.post(
        f"/github/{TENANT_ID}/webhook",
        json={"action": "push"},
    )
    assert r.status_code == 400
    assert "missing" in r.json()["detail"]


def test_webhook_invalid_signature():
    os.environ["github_webhook_secret"] = "test-secret"
    get_settings.cache_clear()
    try:
        r = client.post(
            f"/github/{TENANT_ID}/webhook",
            content=b'{"action": "push"}',
            headers={"X-Hub-Signature-256": "sha256=invalidsignature"},
        )
        assert r.status_code == 400
        assert "invalid" in r.json()["detail"]
    finally:
        get_settings.cache_clear()


def test_webhook_valid_signature():
    os.environ["github_webhook_secret"] = "test-secret"
    get_settings.cache_clear()
    body = b'{"action": "push"}'
    digest = hmac.new(b"test-secret", body, hashlib.sha256).hexdigest()
    try:
        r = client.post(
            f"/github/{TENANT_ID}/webhook",
            content=body,
            headers={"X-Hub-Signature-256": f"sha256={digest}"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "received"
    finally:
        get_settings.cache_clear()
