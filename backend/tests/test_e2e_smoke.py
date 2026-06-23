"""End-to-end smoke test (ClickUp #44).

Exercises the deployed backend over real HTTP. Skipped by default; opt in by
setting an env var pointing at the target:

    # Live deploy
    E2E_BASE_URL=https://elliot-ai.onrender.com pytest tests/test_e2e_smoke.py -v

    # Local
    E2E_BASE_URL=http://localhost:8000 pytest tests/test_e2e_smoke.py -v

This isn't a functional test of the orchestration chain — that requires real
LLM API keys + a populated index. It's a deployment-health check: are the key
HTTP endpoints reachable, are auth gates closed, does the docs surface load.
"""
import os

import httpx
import pytest

BASE_URL = os.getenv("E2E_BASE_URL")

pytestmark = pytest.mark.skipif(
    not BASE_URL,
    reason="E2E_BASE_URL not set — skipping smoke test against deployed backend",
)


@pytest.fixture(scope="module")
def client():
    # Long timeout because Render free-tier services cold-start (~30-60s).
    with httpx.Client(base_url=BASE_URL, timeout=90.0) as c:
        yield c


# ---- Liveness ----------------------------------------------------------


def test_health_endpoint_responds(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "elliot-ai"


def test_root_endpoint_responds(client):
    r = client.get("/")
    assert r.status_code == 200
    # The home route just returns a hint about /docs.
    assert "message" in r.json()


# ---- API surface available --------------------------------------------


def test_openapi_schema_is_served(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    schema = r.json()
    assert schema["info"]["title"] == "Elliot-AI"
    # A handful of routes we expect to exist after a real deploy.
    paths = schema["paths"]
    expected = {"/health", "/auth/magic-link", "/auth/callback"}
    missing = expected - set(paths.keys())
    assert not missing, f"deployed API is missing expected routes: {missing}"


def test_docs_ui_loads(client):
    r = client.get("/docs")
    assert r.status_code == 200
    assert "swagger" in r.text.lower() or "redoc" in r.text.lower()


# ---- Auth: gates are closed, public endpoints open ---------------------


def test_magic_link_endpoint_accepts_valid_email(client):
    r = client.post(
        "/auth/magic-link",
        json={"email": "smoke@elliotsystems.com"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["sent"] is True
    assert body["expires_in_seconds"] > 0


def test_magic_link_endpoint_rejects_invalid_email(client):
    r = client.post(
        "/auth/magic-link",
        json={"email": "not-an-email"},
    )
    assert r.status_code == 422


def test_magic_link_callback_rejects_unknown_token(client):
    r = client.get("/auth/callback", params={"token": "definitely-not-a-real-token"})
    assert r.status_code == 400


# ---- Connectors surface present ---------------------------------------


def test_connector_routes_are_mounted(client):
    """Verify the connector router surface is wired in (not full OAuth flow)."""
    schema = client.get("/openapi.json").json()
    paths = set(schema["paths"].keys())
    # We don't care about every connector, just that the router family is there.
    has_connector_route = any(
        p.startswith(("/github/", "/gitlab/", "/jira/", "/linear/", "/slack/"))
        for p in paths
    )
    assert has_connector_route, "no connector routes found in openapi schema"
