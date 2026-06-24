import pytest
from fastapi.testclient import TestClient

from app.auth import magic_link
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

    r = client.get(f"/auth/callback?token={token}", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers.get("location", "")
    assert "token=" in location
    assert "error" not in location


def test_callback_rejects_unknown_token():
    r = client.get("/auth/callback?token=does-not-exist", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers.get("location", "")
    assert "error=invalid_magic_link" in location


def test_callback_rejects_reused_token():
    token, _ = magic_link.issue_link("khushi@elliotsystems.com")
    first = client.get(f"/auth/callback?token={token}", follow_redirects=False)
    assert first.status_code == 302

    second = client.get(f"/auth/callback?token={token}", follow_redirects=False)
    assert second.status_code == 302
    location = second.headers.get("location", "")
    assert "error=invalid_magic_link" in location


def test_callback_rejects_expired_token():
    from datetime import UTC, datetime, timedelta

    email = "khushi@elliotsystems.com"
    token, _ = magic_link.issue_link(email)
    magic_link._store[token].expires_at = datetime.now(UTC) - timedelta(seconds=1)

    r = client.get(f"/auth/callback?token={token}", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers.get("location", "")
    assert "error=invalid_magic_link" in location


def test_end_to_end_flow():
    """Full flow: request link -> grab token from store -> redeem -> get JWT."""
    email = "khushi@elliotsystems.com"

    r1 = client.post("/auth/magic-link", json={"email": email})
    assert r1.status_code == 200

    # In real life, user clicks the email link. Here we grab the token from the store.
    assert len(magic_link._store) == 1
    token = next(iter(magic_link._store.keys()))

    r2 = client.get(f"/auth/callback?token={token}", follow_redirects=False)
    assert r2.status_code == 302
    location = r2.headers.get("location", "")
    assert "token=" in location
