"""OAuth state token store (CSRF protection for the OIDC flow).

Issue a single-use random token before redirecting to the IdP, then verify
on the callback. In-memory dict for now — same swap-to-Postgres story as
the magic-link store (task #08).
"""
import secrets
from datetime import datetime, timedelta, timezone

_STATE_TTL = timedelta(minutes=10)
_store: dict[str, datetime] = {}


def issue() -> str:
    token = secrets.token_urlsafe(32)
    _store[token] = datetime.now(timezone.utc) + _STATE_TTL
    return token


def consume(token: str) -> bool:
    expiry = _store.pop(token, None)
    if expiry is None:
        return False
    return datetime.now(timezone.utc) <= expiry


def _reset_for_tests() -> None:
    _store.clear()
