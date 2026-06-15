import pytest
from fastapi.testclient import TestClient

from app.auth import magic_link
from app.auth.jwt import decode_access_token
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    magic_link._reset_for_tests()
    yield
    magic_link._reset_for_tests()


def test_request_magic_link_returns_sent_true():
    r = client.post("/auth/magic-link", json={"email": "khushi@elliotsystems.com"})
    assert r.status_code == 200
    body = r.json()
    assert body["sent"] is True
    assert body["expires_in_seconds"] > 0


def test_request_magic_link_rejects_invalid_email():
    r = client.post("/auth/magic-link", json={"email": "not-an-email"})
    assert r.status_code == 422


def test_callback_returns_jwt_for_valid_token():
    email = "khushi@elliotsystems.com"
    token, _ = magic_link.issue_link(email)

    r = client.get(f"/auth/callback?token={token}")
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["email"] == email

    payload = decode_access_token(body["access_token"])
    assert payload["sub"] == email
    assert payload["typ"] == "access"


def test_callback_rejects_unknown_token():
    r = client.get("/auth/callback?token=does-not-exist")
    assert r.status_code == 400
    assert "unknown" in r.json()["detail"]


def test_callback_rejects_reused_token():
    token, _ = magic_link.issue_link("khushi@elliotsystems.com")
    first = client.get(f"/auth/callback?token={token}")
    assert first.status_code == 200

    second = client.get(f"/auth/callback?token={token}")
    assert second.status_code == 400
    assert "already used" in second.json()["detail"]


def test_callback_rejects_expired_token():
    from datetime import datetime, timedelta, timezone

    email = "khushi@elliotsystems.com"
    token, _ = magic_link.issue_link(email)
    magic_link._store[token].expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)

    r = client.get(f"/auth/callback?token={token}")
    assert r.status_code == 400
    assert "expired" in r.json()["detail"]


def test_end_to_end_flow():
    """Full flow: request link -> grab token from store -> redeem -> get JWT."""
    email = "khushi@elliotsystems.com"

    r1 = client.post("/auth/magic-link", json={"email": email})
    assert r1.status_code == 200

    # In real life, user clicks the email link. Here we grab the token from the store.
    assert len(magic_link._store) == 1
    token = next(iter(magic_link._store.keys()))

    r2 = client.get(f"/auth/callback?token={token}")
    assert r2.status_code == 200

    payload = decode_access_token(r2.json()["access_token"])
    assert payload["sub"] == email
