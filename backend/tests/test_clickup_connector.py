import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.connector import Connector

client = TestClient(app)

TENANT_ID = uuid.uuid4()
FAKE_TOKEN = "encrypted-token"
LIST_ID = "test-list-id"
TASK_ID = "test-task-id"


def make_mock_connector():
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider="clickup",
        status="connected",
        oauth_token=FAKE_TOKEN,
    )


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


def test_get_tasks_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/clickup/{TENANT_ID}/lists/{LIST_ID}/tasks")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_tasks_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_tasks = [
        {
            "id": "task-1",
            "name": "Fix login bug",
            "status": {"status": "in progress"},
            "assignees": [{"username": "alice"}],
            "due_date": None,
            "priority": {"priority": "high"},
            "list": {"name": "Sprint 1"},
            "url": "https://app.clickup.com/t/task-1",
        }
    ]

    try:
        with (
            patch("app.services.connectors.clickup.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {"tasks": fake_tasks, "last_page": True}
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/clickup/{TENANT_ID}/lists/{LIST_ID}/tasks")
        assert r.status_code == 200
        assert r.json()[0]["name"] == "Fix login bug"
        assert r.json()[0]["status"] == "in progress"
    finally:
        del app.dependency_overrides[get_db]


def test_get_task_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_task = {
        "id": "task-1",
        "name": "Fix login bug",
        "status": {"status": "in progress"},
        "assignees": [{"username": "alice"}],
        "due_date": None,
        "priority": {"priority": "high"},
        "list": {"name": "Sprint 1"},
        "url": "https://app.clickup.com/t/task-1",
    }

    try:
        with (
            patch("app.services.connectors.clickup.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_task
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/clickup/{TENANT_ID}/tasks/{TASK_ID}")
        assert r.status_code == 200
        assert r.json()["id"] == "task-1"
        assert r.json()["name"] == "Fix login bug"
    finally:
        del app.dependency_overrides[get_db]


def test_get_task_comments_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_comments = {
        "comments": [
            {
                "id": 12345,
                "comment_text": "This is a comment",
                "user": {"username": "bob"},
                "date": "1718524800000",
            }
        ]
    }

    try:
        with (
            patch("app.services.connectors.clickup.decrypt_token", return_value="token"),
            patch("httpx.AsyncClient") as mock_client,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_comments
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/clickup/{TENANT_ID}/tasks/{TASK_ID}/comments")
        assert r.status_code == 200
        assert r.json()[0]["comment_text"] == "This is a comment"
        assert r.json()[0]["author"] == "bob"
    finally:
        del app.dependency_overrides[get_db]
