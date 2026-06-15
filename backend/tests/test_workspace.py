import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_workspace_invalid_residency():
    r = client.post(
        "/workspace",
        json={"name": "Acme", "domain": "acme.com", "residency": "MARS"},
    )
    assert r.status_code == 422


def test_create_workspace_missing_required_fields():
    r = client.post("/workspace", json={"domain": "acme.com"})
    assert r.status_code == 422


import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock


def make_mock_db():
    db = AsyncMock()
    db.add = MagicMock()

    async def fake_refresh(obj):
        obj.created_at = datetime.now(UTC)

    db.refresh = AsyncMock(side_effect=fake_refresh)
    return db


def test_create_workspace_returns_201():
    mock_db = make_mock_db()

    from app.db.session import get_db

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        r = client.post(
            "/workspace",
            json={"name": "Acme Corp", "domain": "acme.com", "team_size": "50", "residency": "EU"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["name"] == "Acme Corp"
        assert body["domain"] == "acme.com"
        assert body["residency"] == "EU"
        assert "tenant_id" in body
        assert "created_at" in body
    finally:
        app.dependency_overrides.clear()


def test_create_workspace_default_residency():
    mock_db = make_mock_db()

    from app.db.session import get_db

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        r = client.post(
            "/workspace",
            json={"name": "Beta Inc", "domain": "beta.com"},
        )
        assert r.status_code == 201
        assert r.json()["residency"] == "US"
    finally:
        app.dependency_overrides.clear()
