import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.connector import Connector

client = TestClient(app)

TENANT_ID = uuid.uuid4()
CLOUD_ID = "test-cloud-id"
FAKE_TOKEN = "encrypted-token"


def make_mock_connector():
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider="jira",
        status="connected",
        oauth_token=FAKE_TOKEN,
    )


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_search_issues_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/jira/{TENANT_ID}/search?cloud_id={CLOUD_ID}&jql=project=PROJ")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_search_issues_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with (
            patch("app.services.connectors.jira.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "issues": [
                    {
                        "key": "PROJ-1",
                        "fields": {
                            "summary": "Fix login bug",
                            "description": "Users cannot log in",
                            "status": {"name": "In Progress"},
                            "assignee": {"displayName": "Alice"},
                            "priority": {"name": "High"},
                            "issuetype": {"name": "Bug"},
                            "created": "2026-06-16T00:00:00.000+0000",
                            "updated": "2026-06-16T01:00:00.000+0000",
                        },
                    }
                ],
                "total": 1,
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(
                f"/jira/{TENANT_ID}/search?cloud_id={CLOUD_ID}&jql=project=PROJ"
            )
        assert r.status_code == 200
        assert r.json()[0]["key"] == "PROJ-1"
        assert r.json()[0]["status"] == "In Progress"
    finally:
        del app.dependency_overrides[get_db]


def test_get_issue_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with (
            patch("app.services.connectors.jira.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "key": "PROJ-1",
                "fields": {
                    "summary": "Fix login bug",
                    "description": "Users cannot log in",
                    "status": {"name": "In Progress"},
                    "assignee": {"displayName": "Alice"},
                    "priority": {"name": "High"},
                    "issuetype": {"name": "Bug"},
                    "created": "2026-06-16T00:00:00.000+0000",
                    "updated": "2026-06-16T01:00:00.000+0000",
                },
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/jira/{TENANT_ID}/issues/PROJ-1?cloud_id={CLOUD_ID}")
        assert r.status_code == 200
        assert r.json()["key"] == "PROJ-1"
        assert r.json()["summary"] == "Fix login bug"
    finally:
        del app.dependency_overrides[get_db]


def test_get_issue_status_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with (
            patch("app.services.connectors.jira.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "key": "PROJ-1",
                "fields": {"status": {"name": "Done"}},
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(
                f"/jira/{TENANT_ID}/issues/PROJ-1/status?cloud_id={CLOUD_ID}"
            )
        assert r.status_code == 200
        assert r.json()["status"] == "Done"
        assert r.json()["key"] == "PROJ-1"
    finally:
        del app.dependency_overrides[get_db]
