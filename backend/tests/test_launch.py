import uuid
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.main import app
from app.models.connector import Connector
from app.models.organisation import Organisation
from app.models.sdlc import SDLCProfile

client = TestClient(app)

TENANT_ID = uuid.uuid4()
FAKE_USER = {"sub": "test@elliotsystems.com"}


def make_mock_db(org=None, sdlc=None, connectors=None, chunk_count=0):
    db = AsyncMock()

    org_result = MagicMock()
    org_result.scalar_one_or_none.return_value = org

    sdlc_result = MagicMock()
    sdlc_result.scalar_one_or_none.return_value = sdlc

    connectors_result = MagicMock()
    connectors_result.scalars.return_value.all.return_value = connectors or []

    count_result = MagicMock()
    count_result.scalar.return_value = chunk_count

    db.execute = AsyncMock(
        side_effect=[org_result, sdlc_result, connectors_result, count_result]
    )
    return db


def make_org():
    return Organisation(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        org_name="Elliot Systems",
        domain="elliotsystems.com",
        team_size="20",
        data_residency="US",
    )


def make_sdlc():
    return SDLCProfile(
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


def make_connector(provider: str):
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider=provider,
        status="connected",
    )


def test_launch_summary_success():
    mock_db = make_mock_db(
        org=make_org(),
        sdlc=make_sdlc(),
        connectors=[make_connector("github"), make_connector("jira")],
        chunk_count=42,
    )
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["org"]["name"] == "Elliot Systems"
        assert body["org"]["domain"] == "elliotsystems.com"
        assert body["sdlc"]["stack"] == "Python/FastAPI"
        assert body["sdlc"]["coverage_gate"] == 80
        assert set(body["connectors"]) == {"github", "jira"}
        assert body["chunk_count"] == 42
    finally:
        app.dependency_overrides.clear()


def test_launch_summary_no_org():
    mock_db = AsyncMock()
    no_org_result = MagicMock()
    no_org_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=no_org_result)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 404
        assert "not found" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_launch_summary_no_sdlc():
    mock_db = make_mock_db(
        org=make_org(),
        sdlc=None,
        connectors=[make_connector("github")],
        chunk_count=10,
    )
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["org"]["name"] == "Elliot Systems"
        assert body["sdlc"] is None
        assert body["connectors"] == ["github"]
        assert body["chunk_count"] == 10
    finally:
        app.dependency_overrides.clear()
