"""Magic-link issuance + redemption.

In-memory store for now. Replace with Postgres in task #08 (tenant schema).
Token is a single-use opaque random string mapped to (email, expires_at).
"""
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from app.config import get_settings


@dataclass
class MagicLink:
    email: str
    expires_at: datetime
    used: bool = False


_store: dict[str, MagicLink] = {}


def issue_link(email: str) -> tuple[str, int]:
    settings = get_settings()
    token = secrets.token_urlsafe(32)
    ttl = timedelta(minutes=settings.magic_link_ttl_min)
    _store[token] = MagicLink(
        email=email,
        expires_at=datetime.now(UTC) + ttl,
    )
    return token, int(ttl.total_seconds())


def redeem(token: str) -> str:
    link = _store.get(token)
    if link is None:
        raise ValueError("unknown token")
    if link.used:
        raise ValueError("token already used")
    if datetime.now(UTC) > link.expires_at:
        raise ValueError("token expired")
    link.used = True
    return link.email


def build_link_url(token: str) -> str:
    base = get_settings().magic_link_base_url
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}token={token}"


def _reset_for_tests() -> None:
    _store.clear()
