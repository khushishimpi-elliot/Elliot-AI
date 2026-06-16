import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.sdlc import SDLCProfile

client = TestClient(app)

TENANT_ID = uuid.uuid4()


def make_profile():
    profile = SDLCProfile(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        stack="Python/FastAPI",
        branching_model="trunk",
        test_framework="pytest",
        coverage_gate=80,
        ci_cd_platform="GitHub Actions",
        review_policy="2-approvals",
        arch_style="monolith",
    )
    profile.created_at = datetime(2026, 6, 16, 12, 0, 0)
    profile.updated_at = datetime(2026, 6, 16, 12, 0, 0)
    return profile


def make_mock_db(profile=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = profile
    db.execute = AsyncMock(return_value=mock_result)
    db.add = MagicMock()

    async def fake_refresh(obj):
        pass

    db.refresh = AsyncMock(side_effect=fake_refresh)
    return db


def test_delete_sdlc_profile():
    mock_db = make_mock_db(profile=make_profile())
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.delete(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 204
    finally:
        del app.dependency_overrides[get_db]


def test_delete_sdlc_profile_not_found():
    mock_db = make_mock_db(profile=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.delete(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 404
        assert "not found" in r.json()["detail"]
    finally:
        del app.dependency_overrides[get_db]
