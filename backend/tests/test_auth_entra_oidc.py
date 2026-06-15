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
