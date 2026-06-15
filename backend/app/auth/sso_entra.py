"""Microsoft Entra (Azure AD) OIDC.

Three pieces:
  - build_authorization_url(state): URL to send the browser to Microsoft's consent screen
  - exchange_code_for_tokens(code): POST to Microsoft's token endpoint
  - verify_id_token(id_token): validate signature + claims, return verified claims

Token validation uses python-jose with Microsoft's JWKS endpoint.
Single-tenant only: the token's `tid` claim must match entra_tenant_id.
"""
from urllib.parse import urlencode

import httpx

from app.config import get_settings

ENTRA_AUTH_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
ENTRA_TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
ENTRA_JWKS_URL = "https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
ENTRA_ISSUER = "https://login.microsoftonline.com/{tenant_id}/v2.0"
SCOPES = ["openid", "email", "profile"]


class OIDCError(Exception):
    pass


def build_authorization_url(state: str) -> str:
    s = get_settings()
    params = {
        "client_id": s.entra_client_id,
        "redirect_uri": s.entra_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
        "response_mode": "query",
    }
    url = ENTRA_AUTH_URL.format(tenant_id=s.entra_tenant_id)
    return f"{url}?{urlencode(params)}"


def exchange_code_for_tokens(code: str, http_client: httpx.Client | None = None) -> dict:
    s = get_settings()
    payload = {
        "code": code,
        "client_id": s.entra_client_id,
        "client_secret": s.entra_client_secret,
        "redirect_uri": s.entra_redirect_uri,
        "grant_type": "authorization_code",
    }
    url = ENTRA_TOKEN_URL.format(tenant_id=s.entra_tenant_id)
    client = http_client or httpx.Client(timeout=10.0)
    try:
        resp = client.post(url, data=payload)
    finally:
        if http_client is None:
            client.close()

    if resp.status_code != 200:
        raise OIDCError(f"entra token exchange failed: {resp.status_code} {resp.text}")
    body = resp.json()
    if "id_token" not in body:
        raise OIDCError("entra response missing id_token")
    return body


def verify_id_token(token: str, http_client: httpx.Client | None = None) -> dict:
    """Validate the Entra ID token using Microsoft's JWKS endpoint.

    Enforces:
      - signature via RS256 + Microsoft JWKS
      - audience matches entra_client_id
      - issuer matches tenant-specific v2.0 issuer
      - tid claim matches entra_tenant_id
      - email or preferred_username claim is present

    Returns verified claims dict with at minimum 'email' and 'groups' keys.
    """
    from jose import JWTError, jwt as jose_jwt

    s = get_settings()
    jwks_url = ENTRA_JWKS_URL.format(tenant_id=s.entra_tenant_id)
    issuer = ENTRA_ISSUER.format(tenant_id=s.entra_tenant_id)

    client = http_client or httpx.Client(timeout=10.0)
    try:
        jwks_resp = client.get(jwks_url)
    finally:
        if http_client is None:
            client.close()

    if jwks_resp.status_code != 200:
        raise OIDCError(f"failed to fetch entra JWKS: {jwks_resp.status_code}")

    try:
        claims = jose_jwt.decode(
            token,
            jwks_resp.json(),
            algorithms=["RS256"],
            audience=s.entra_client_id,
            issuer=issuer,
        )
    except JWTError as e:
        raise OIDCError(f"invalid entra id token: {e}") from e

    if claims.get("tid") != s.entra_tenant_id:
        raise OIDCError(
            f"tenant mismatch: token tid={claims.get('tid')!r}, "
            f"expected {s.entra_tenant_id!r}"
        )

    email = claims.get("preferred_username") or claims.get("email")
    if not email:
        raise OIDCError("entra token missing email/preferred_username claim")

    return {
        **claims,
        "email": email,
        "groups": claims.get("groups", []),
    }
