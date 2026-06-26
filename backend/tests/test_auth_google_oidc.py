from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.auth import oauth_state, sso_google
from app.config import get_settings
from app.main import app

client = TestClient(app)


@pytest.fixture
def configured_google(monkeypatch):
    """Pretend Google SSO is configured. Clear settings cache to pick up env."""
    get_settings.cache_clear()
    monkeypatch.setenv("google_client_id", "test-client-id.apps.googleusercontent.com")
    monkeypatch.setenv("google_client_secret", "test-secret")
    monkeypatch.setenv("google_workspace_domain", "elliotsystems.com")
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def reset_oauth_state():
    oauth_state._reset_for_tests()
    yield
    oauth_state._reset_for_tests()


# ---- Authorization URL ----------------------------------------------------


def test_login_returns_503_when_not_configured():
    get_settings.cache_clear()
    r = client.get("/auth/google/login", follow_redirects=False)
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]


def test_login_redirects_to_google(configured_google):
    r = client.get("/auth/google/login", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers["location"]
    assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    assert "client_id=test-client-id" in location
    assert "scope=openid+email+profile" in location
    assert "response_type=code" in location
    assert "hd=elliotsystems.com" in location
    assert "state=" in location


def test_login_omits_hd_when_no_workspace_domain(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("google_client_id", "x.apps.googleusercontent.com")
    monkeypatch.setenv("google_client_secret", "x")
    monkeypatch.setenv("google_workspace_domain", "")
    try:
        r = client.get("/auth/google/login", follow_redirects=False)
        assert r.status_code == 302
        assert "hd=" not in r.headers["location"]
    finally:
        get_settings.cache_clear()


# ---- Callback -------------------------------------------------------------


def test_callback_rejects_unknown_state(configured_google):
    r = client.get("/auth/google/callback?code=anything&state=never-issued")
    assert r.status_code == 400
    assert "invalid or expired state" in r.json()["detail"]


def test_callback_happy_path(configured_google):
    state = oauth_state.issue()

    fake_tokens = {"id_token": "fake.jwt.here", "access_token": "fake-access"}
    fake_claims = {
        "email": "khushi@elliotsystems.com",
        "email_verified": True,
        "hd": "elliotsystems.com",
        "sub": "google-user-123",
    }

    with (
        patch.object(sso_google, "exchange_code_for_tokens", return_value=fake_tokens),
        patch.object(sso_google, "verify_id_token", return_value=fake_claims),
    ):
        r = client.get(f"/auth/google/callback?code=auth-code&state={state}")

    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "khushi@elliotsystems.com"
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_callback_rejects_wrong_workspace_domain(configured_google):
    """If sso_google.verify_id_token raises OIDCError, we 400."""
    state = oauth_state.issue()

    with (
        patch.object(
            sso_google, "exchange_code_for_tokens", return_value={"id_token": "fake"}
        ),
        patch.object(
            sso_google,
            "verify_id_token",
            side_effect=sso_google.OIDCError("workspace domain mismatch"),
        ),
    ):
        r = client.get(f"/auth/google/callback?code=x&state={state}")

    assert r.status_code == 400
    assert "workspace domain mismatch" in r.json()["detail"]


def test_state_is_single_use(configured_google):
    state = oauth_state.issue()
    # Consume it once directly
    assert oauth_state.consume(state) is True
    # Now the callback should reject it
    r = client.get(f"/auth/google/callback?code=x&state={state}")
    assert r.status_code == 400


# ---- Unit: build_authorization_url ---------------------------------------


def test_build_authorization_url_includes_required_params(configured_google):
    url = sso_google.build_authorization_url("my-state-token")
    assert "client_id=test-client-id" in url
    assert "redirect_uri=" in url
    assert "scope=openid+email+profile" in url
    assert "state=my-state-token" in url
    assert "response_type=code" in url
