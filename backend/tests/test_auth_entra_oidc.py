from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.auth import oauth_state, sso_entra
from app.config import get_settings
from app.main import app

client = TestClient(app)


@pytest.fixture
def configured_entra(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("entra_tenant_id", "test-tenant-id")
    monkeypatch.setenv("entra_client_id", "test-client-id")
    monkeypatch.setenv("entra_client_secret", "test-secret")
    monkeypatch.setenv("frontend_url", "http://localhost:5173")
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def reset_oauth_state():
    oauth_state._reset_for_tests()
    yield
    oauth_state._reset_for_tests()


def test_build_authorization_url_includes_required_params(configured_entra):
    url = sso_entra.build_authorization_url("my-state-token")
    assert "test-tenant-id" in url
    assert "client_id=test-client-id" in url
    assert "redirect_uri=" in url
    assert "scope=" in url
    assert "openid" in url
    assert "state=my-state-token" in url
    assert "response_type=code" in url


# ---- Unit: exchange_code_for_tokens ---------------------------------------

def test_exchange_code_raises_on_http_error(configured_entra):
    class FakeResp:
        status_code = 400
        text = "bad request"
        def json(self): return {}

    class FakeClient:
        def post(self, *a, **kw): return FakeResp()
        def close(self): pass

    with pytest.raises(sso_entra.OIDCError, match="token exchange failed"):
        sso_entra.exchange_code_for_tokens("bad-code", http_client=FakeClient())


def test_exchange_code_raises_when_id_token_missing(configured_entra):
    class FakeResp:
        status_code = 200
        def json(self): return {"access_token": "x"}

    class FakeClient:
        def post(self, *a, **kw): return FakeResp()
        def close(self): pass

    with pytest.raises(sso_entra.OIDCError, match="missing id_token"):
        sso_entra.exchange_code_for_tokens("code", http_client=FakeClient())


# ---- Unit: verify_id_token ------------------------------------------------

def test_verify_id_token_raises_on_jwks_fetch_failure(configured_entra):
    class FakeResp:
        status_code = 500

    class FakeClient:
        def get(self, *a, **kw): return FakeResp()
        def close(self): pass

    with pytest.raises(sso_entra.OIDCError, match="failed to fetch entra JWKS"):
        sso_entra.verify_id_token("fake.token.here", http_client=FakeClient())


# ---- Routes ---------------------------------------------------------------

def test_login_returns_503_when_not_configured():
    get_settings.cache_clear()
    r = client.get("/auth/entra/login", follow_redirects=False)
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]


def test_login_redirects_to_microsoft(configured_entra):
    r = client.get("/auth/entra/login", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers["location"]
    assert "login.microsoftonline.com" in location
    assert "test-tenant-id" in location
    assert "client_id=test-client-id" in location
    assert "openid" in location
    assert "state=" in location


def test_callback_rejects_unknown_state(configured_entra):
    r = client.get("/auth/entra/callback?code=anything&state=never-issued")
    assert r.status_code == 400
    assert "invalid or expired state" in r.json()["detail"]


def test_callback_happy_path(configured_entra):
    state = oauth_state.issue()

    fake_tokens = {"id_token": "fake.jwt.here", "access_token": "fake-access"}
    fake_claims = {
        "email": "astika@elliotsystems.com",
        "preferred_username": "astika@elliotsystems.com",
        "tid": "test-tenant-id",
        "groups": ["group-id-1"],
    }

    with (
        patch.object(sso_entra, "exchange_code_for_tokens", return_value=fake_tokens),
        patch.object(sso_entra, "verify_id_token", return_value=fake_claims),
    ):
        r = client.get(f"/auth/entra/callback?code=auth-code&state={state}", follow_redirects=False)

    # Callback now redirects to frontend with JWT in URL (step=2 since Sign in is complete)
    assert r.status_code == 302
    location = r.headers["location"]
    assert "?jwt=" in location
    assert "&step=2" in location
    assert "email=astika" in location


def test_callback_rejects_on_oidc_error(configured_entra):
    state = oauth_state.issue()

    with (
        patch.object(sso_entra, "exchange_code_for_tokens", return_value={"id_token": "x"}),
        patch.object(
            sso_entra,
            "verify_id_token",
            side_effect=sso_entra.OIDCError("tenant mismatch"),
        ),
    ):
        r = client.get(f"/auth/entra/callback?code=x&state={state}")

    assert r.status_code == 400
    assert "tenant mismatch" in r.json()["detail"]


def test_state_is_single_use(configured_entra):
    state = oauth_state.issue()
    assert oauth_state.consume(state) is True
    r = client.get(f"/auth/entra/callback?code=x&state={state}")
    assert r.status_code == 400
