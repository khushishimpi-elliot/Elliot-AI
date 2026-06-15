import pytest
from unittest.mock import patch
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
