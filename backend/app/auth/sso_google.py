"""Google Workspace OIDC.

Three pieces:
  - build_authorization_url(state): URL to send the browser to Google's consent screen
  - exchange_code_for_tokens(code): POST to Google's token endpoint
  - verify_id_token(id_token): validate signature + claims, return verified claims

Workspace domain enforcement: if settings.google_workspace_domain is set,
the ID token must carry a matching `hd` claim, otherwise the login is rejected.
"""
from urllib.parse import urlencode

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import get_settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPES = ["openid", "email", "profile"]


class OIDCError(Exception):
    pass


def build_authorization_url(state: str) -> str:
    s = get_settings()
    params = {
        "client_id": s.google_client_id,
        "redirect_uri": s.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    if s.google_workspace_domain:
        params["hd"] = s.google_workspace_domain
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(code: str, http_client: httpx.Client | None = None) -> dict:
    s = get_settings()
    payload = {
        "code": code,
        "client_id": s.google_client_id,
        "client_secret": s.google_client_secret,
        "redirect_uri": s.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    client = http_client or httpx.Client(timeout=10.0)
    try:
        resp = client.post(GOOGLE_TOKEN_URL, data=payload)
    finally:
        if http_client is None:
            client.close()

    if resp.status_code != 200:
        raise OIDCError(f"google token exchange failed: {resp.status_code} {resp.text}")
    body = resp.json()
    if "id_token" not in body:
        raise OIDCError("google response missing id_token")
    return body


def verify_id_token(token: str) -> dict:
    """Verify signature + standard claims, return the verified claims dict.

    Enforces:
      - signature against Google's current JWKS
      - audience matches our client_id
      - issuer is accounts.google.com
      - email is verified
      - hd matches configured Workspace domain (if set)
    """
    s = get_settings()
    try:
        claims = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=s.google_client_id,
        )
    except ValueError as e:
        raise OIDCError(f"invalid google id token: {e}") from e

    if not claims.get("email_verified"):
        raise OIDCError("google account email is not verified")

    if s.google_workspace_domain:
        hd = claims.get("hd")
        if hd != s.google_workspace_domain:
            raise OIDCError(
                f"workspace domain mismatch: token hd={hd!r}, "
                f"expected {s.google_workspace_domain!r}"
            )

    return claims
