from fastapi.testclient import TestClient

from app.auth.jwt import issue_access_token
from app.main import app

client = TestClient(app)


def test_me_requires_bearer_token():
    r = client.get("/me")
    assert r.status_code == 401
    assert r.json()["detail"] == "tenant context required"


def test_me_rejects_token_without_tenant_id():
    token, _ = issue_access_token("khushi@elliotsystems.com")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401, "tenant_id is required, email alone is not enough"


def test_me_accepts_token_with_tenant_id():
    token, _ = issue_access_token("khushi@elliotsystems.com", tenant_id="org_42")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == {"email": "khushi@elliotsystems.com", "tenant_id": "org_42"}


def test_me_rejects_invalid_token():
    r = client.get("/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert r.status_code == 401


def test_me_ignores_non_bearer_scheme():
    token, _ = issue_access_token("khushi@elliotsystems.com", tenant_id="org_42")
    r = client.get("/me", headers={"Authorization": f"Basic {token}"})
    assert r.status_code == 401


def test_health_is_public():
    r = client.get("/health")
    assert r.status_code == 200


def test_auth_endpoints_remain_public():
    """Tenant middleware must not break the magic-link flow itself."""
    r = client.post("/auth/magic-link", json={"email": "khushi@elliotsystems.com"})
    assert r.status_code == 200
