# Microsoft Entra OIDC Design — Task 06

## Overview

Add Microsoft Entra (Azure AD) OIDC login to the backend, following the same pattern as the existing Google OIDC implementation. Single-tenant only. Group claims are extracted and returned but not enforced (enforcement belongs in the workspace/permissions layer).

## Files

| File | Action |
|------|--------|
| `backend/app/auth/sso_entra.py` | Create — 3-function OIDC module |
| `backend/tests/test_auth_entra_oidc.py` | Create — mirrors test_auth_google_oidc.py |
| `backend/app/config.py` | Modify — add 5 Entra settings |
| `backend/app/auth/router.py` | Modify — add 2 Entra routes |
| `backend/.env.example` | Modify — document new env vars |
| `backend/pyproject.toml` | Modify — add msal dependency |

## Config (config.py)

```python
entra_tenant_id: str = ""
entra_client_id: str = ""
entra_client_secret: str = ""
entra_redirect_uri: str = "http://localhost:8000/auth/entra/callback"
entra_login_success_url: str = "http://localhost:5173/auth/success"
```

## sso_entra.py

Three functions matching the Google module's interface:

### `build_authorization_url(state: str) -> str`

Builds URL to Microsoft's consent screen:
```
https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize
```
Scopes: `openid email profile offline_access`

### `exchange_code_for_tokens(code: str, http_client=None) -> dict`

POSTs to:
```
https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
```
Returns token response dict. Raises `OIDCError` on failure.

### `verify_id_token(token: str) -> dict`

Uses `msal` to validate the token against Microsoft's JWKS. Enforces:
- `tid` claim matches configured `entra_tenant_id`
- `email` or `preferred_username` claim is present

Extracts and returns:
- `email` — from `preferred_username` or `email` claim
- `groups` — list of Azure AD group IDs (may be empty list)

Raises `OIDCError` on any validation failure.

### `OIDCError(Exception)`

Raised for any token/validation failure. Router catches and returns HTTP 400.

## Routes (router.py)

### `GET /auth/entra/login`
- Returns 503 if `entra_client_id` is not configured
- Issues CSRF state via `oauth_state.issue()`
- Redirects to Microsoft login URL (302)

### `GET /auth/entra/callback`
- Validates state via `oauth_state.consume()` → 400 if invalid/expired
- Exchanges code for tokens via `sso_entra.exchange_code_for_tokens(code)`
- Validates token via `sso_entra.verify_id_token(id_token)`
- Issues internal JWT via `issue_access_token(email)`
- Returns `TokenResponse`

## Error Handling

| Condition | HTTP |
|-----------|------|
| `entra_client_id` not set | 503 "entra sso not configured" |
| Invalid/expired CSRF state | 400 "invalid or expired state" |
| Token exchange failure | 400 via OIDCError |
| Tenant ID mismatch | 400 via OIDCError |
| Missing email claim | 400 via OIDCError |

## Tests (test_auth_entra_oidc.py)

| Test | What it checks |
|------|---------------|
| `test_login_returns_503_when_not_configured` | 503 when no client_id |
| `test_login_redirects_to_microsoft` | 302, URL contains tenant_id, client_id, scopes, state |
| `test_callback_rejects_unknown_state` | 400 on unknown state |
| `test_callback_happy_path` | mocked exchange + verify → JWT returned |
| `test_callback_rejects_wrong_tenant` | OIDCError → 400 |
| `test_state_is_single_use` | state cannot be reused |

## Dependencies

Add to `backend/pyproject.toml`:
```
"msal>=1.31.0",
```
