# Microsoft Entra OIDC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Microsoft Entra (Azure AD) OIDC login to the backend, exposing `GET /auth/entra/login` and `GET /auth/entra/callback` endpoints that mirror the existing Google OIDC implementation.

**Architecture:** Single-tenant OIDC flow using Microsoft's v2.0 endpoints. Token exchange uses `httpx` (already a dependency). ID token validation uses `python-jose` (already a dependency) with Microsoft's JWKS endpoint. Group claims are extracted and returned but not enforced. The `sso_entra.py` module mirrors `sso_google.py` in structure and interface.

**Tech Stack:** FastAPI, httpx, python-jose[cryptography], pydantic-settings

---

### Task 1: Create the feature branch

**Files:** None — git only

- [ ] **Step 1: Make sure you're on main and up to date**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create the branch**

```bash
git checkout -b identity/06-entra-oidc
```

Expected: `Switched to a new branch 'identity/06-entra-oidc'`

---

### Task 2: Add Entra settings to config.py

**Files:**
- Modify: `backend/app/config.py`

- [ ] **Step 1: Add Entra settings to the Settings class**

Open `backend/app/config.py`. After the `google_login_success_url` line, add:

```python
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""
    entra_redirect_uri: str = "http://localhost:8000/auth/entra/callback"
    entra_login_success_url: str = "http://localhost:5173/auth/success"
```

The full file should look like:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-secret-change-me"
    jwt_algo: str = "HS256"
    jwt_expire_min: int = 60
    magic_link_ttl_min: int = 15
    magic_link_base_url: str = "http://localhost:5173/auth/callback"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    # Restrict logins to a single Google Workspace domain. Empty = allow any.
    google_workspace_domain: str = ""
    # Where to send the browser after we issue our JWT
    google_login_success_url: str = "http://localhost:5173/auth/success"

    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""
    entra_redirect_uri: str = "http://localhost:8000/auth/entra/callback"
    entra_login_success_url: str = "http://localhost:5173/auth/success"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/config.py
git commit -m "feat(entra): add Entra OIDC settings to config"
```

---

### Task 3: Create sso_entra.py — build_authorization_url (TDD)

**Files:**
- Create: `backend/app/auth/sso_entra.py`
- Create: `backend/tests/test_auth_entra_oidc.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_entra_oidc.py` with:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
pytest tests/test_auth_entra_oidc.py::test_build_authorization_url_includes_required_params -v
```

Expected: FAIL with `ImportError` or `ModuleNotFoundError` for `sso_entra`

- [ ] **Step 3: Create sso_entra.py with build_authorization_url**

Create `backend/app/auth/sso_entra.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_auth_entra_oidc.py::test_build_authorization_url_includes_required_params -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth/sso_entra.py backend/tests/test_auth_entra_oidc.py
git commit -m "feat(entra): add sso_entra module with build_authorization_url"
```

---

### Task 4: Test exchange_code_for_tokens and verify_id_token

**Files:**
- Modify: `backend/tests/test_auth_entra_oidc.py`

- [ ] **Step 1: Add unit tests for exchange_code_for_tokens and verify_id_token**

Append to `backend/tests/test_auth_entra_oidc.py`:

```python
# ---- Unit: exchange_code_for_tokens ---------------------------------------

def test_exchange_code_raises_on_http_error(configured_entra):
    mock_client = patch("httpx.Client").start()
    mock_resp = mock_client.return_value.__enter__.return_value.post.return_value
    mock_resp.status_code = 400
    mock_resp.text = "bad request"

    fake_client = httpx.Client()
    fake_client.post = lambda *a, **kw: type("R", (), {"status_code": 400, "text": "bad request", "json": lambda: {}})()

    with pytest.raises(sso_entra.OIDCError, match="token exchange failed"):
        sso_entra.exchange_code_for_tokens("bad-code", http_client=fake_client)


def test_exchange_code_raises_when_id_token_missing(configured_entra):
    fake_client = httpx.Client()
    fake_client.post = lambda *a, **kw: type("R", (), {"status_code": 200, "json": lambda: {"access_token": "x"}})()

    with pytest.raises(sso_entra.OIDCError, match="missing id_token"):
        sso_entra.exchange_code_for_tokens("code", http_client=fake_client)


# ---- Unit: verify_id_token ------------------------------------------------

def test_verify_id_token_raises_on_jwks_fetch_failure(configured_entra):
    fake_client = httpx.Client()
    fake_client.get = lambda *a, **kw: type("R", (), {"status_code": 500})()

    with pytest.raises(sso_entra.OIDCError, match="failed to fetch entra JWKS"):
        sso_entra.verify_id_token("fake.token.here", http_client=fake_client)
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_auth_entra_oidc.py -v -k "exchange or verify"
```

Expected: all 3 new tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_auth_entra_oidc.py
git commit -m "test(entra): add unit tests for exchange and verify functions"
```

---

### Task 5: Add Entra routes to router.py (TDD)

**Files:**
- Modify: `backend/app/auth/router.py`
- Modify: `backend/tests/test_auth_entra_oidc.py`

- [ ] **Step 1: Write failing route tests**

Append to `backend/tests/test_auth_entra_oidc.py`:

```python
import httpx as httpx_module

# ---- Routes ---------------------------------------------------------------

def test_login_returns_503_when_not_configured():
    get_settings.cache_clear()
    r = client.get("/auth/entra/login", follow_redirects=False)
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]


def test_login_redirects_to_microsoft(configured_entra):
    r = client.get("/auth/entra/login", follow_redirects=False)
    assert r.status_code == 302
    location = r.headers["location"]
    assert "login.microsoftonline.com" in location
    assert "test-tenant-id" in location
    assert "client_id=test-client-id" in location
    assert "openid" in location
    assert "state=" in location


def test_callback_rejects_unknown_state(configured_entra):
    r = client.get("/auth/entra/callback?code=anything&state=never-issued")
    assert r.status_code == 400
    assert "invalid or expired state" in r.json()["detail"]


def test_callback_happy_path(configured_entra):
    state = oauth_state.issue()

    fake_tokens = {"id_token": "fake.jwt.here", "access_token": "fake-access"}
    fake_claims = {
        "email": "astika@elliotsystems.com",
        "preferred_username": "astika@elliotsystems.com",
        "tid": "test-tenant-id",
        "groups": ["group-id-1"],
    }

    with (
        patch.object(sso_entra, "exchange_code_for_tokens", return_value=fake_tokens),
        patch.object(sso_entra, "verify_id_token", return_value=fake_claims),
    ):
        r = client.get(f"/auth/entra/callback?code=auth-code&state={state}")

    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "astika@elliotsystems.com"
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_callback_rejects_on_oidc_error(configured_entra):
    state = oauth_state.issue()

    with (
        patch.object(sso_entra, "exchange_code_for_tokens", return_value={"id_token": "x"}),
        patch.object(
            sso_entra,
            "verify_id_token",
            side_effect=sso_entra.OIDCError("tenant mismatch"),
        ),
    ):
        r = client.get(f"/auth/entra/callback?code=x&state={state}")

    assert r.status_code == 400
    assert "tenant mismatch" in r.json()["detail"]


def test_state_is_single_use(configured_entra):
    state = oauth_state.issue()
    assert oauth_state.consume(state) is True
    r = client.get(f"/auth/entra/callback?code=x&state={state}")
    assert r.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
pytest tests/test_auth_entra_oidc.py -v -k "login or callback or state"
```

Expected: FAIL — routes don't exist yet (404)

- [ ] **Step 3: Add Entra routes to router.py**

Open `backend/app/auth/router.py`. Add this import at the top (after existing imports):

```python
from app.auth import sso_entra
```

Then append these two routes at the end of the file:

```python

@router.get("/entra/login")
def entra_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.entra_client_id:
        raise HTTPException(status_code=503, detail="entra sso not configured")
    state = oauth_state.issue()
    url = sso_entra.build_authorization_url(state)
    return RedirectResponse(url=url, status_code=302)


@router.get("/entra/callback", response_model=TokenResponse)
def entra_callback(code: str = Query(...), state: str = Query(...)) -> TokenResponse:
    if not oauth_state.consume(state):
        raise HTTPException(status_code=400, detail="invalid or expired state")

    try:
        tokens = sso_entra.exchange_code_for_tokens(code)
        claims = sso_entra.verify_id_token(tokens["id_token"])
    except sso_entra.OIDCError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    email = claims["email"]
    access_token, ttl = issue_access_token(email)
    return TokenResponse(
        access_token=access_token,
        expires_in_seconds=ttl,
        email=email,
    )
```

- [ ] **Step 4: Run all Entra tests to verify they pass**

```bash
cd backend
pytest tests/test_auth_entra_oidc.py -v
```

Expected: all tests PASS

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
pytest -q
```

Expected: all tests pass, no failures

- [ ] **Step 6: Commit**

```bash
git add backend/app/auth/router.py backend/tests/test_auth_entra_oidc.py
git commit -m "feat(entra): add /auth/entra/login and /auth/entra/callback routes"
```

---

### Task 6: Update .env.example

**Files:**
- Modify: `backend/.env.example`

- [ ] **Step 1: Add Entra env vars to .env.example**

In `backend/.env.example`, find the `# SSO` section:

```
# SSO
OKTA_DOMAIN=
ENTRA_TENANT_ID=
GOOGLE_CLIENT_ID=
```

Replace it with:

```
# SSO
OKTA_DOMAIN=

# Microsoft Entra OIDC — register app at https://portal.azure.com
# App registration > Authentication > add redirect URI: http://localhost:8000/auth/entra/callback
# App registration > Certificates & secrets > create client secret
ENTRA_TENANT_ID=
ENTRA_CLIENT_ID=
ENTRA_CLIENT_SECRET=
ENTRA_REDIRECT_URI=http://localhost:8000/auth/entra/callback
ENTRA_LOGIN_SUCCESS_URL=http://localhost:5173/auth/success

GOOGLE_CLIENT_ID=
```

- [ ] **Step 2: Commit**

```bash
git add backend/.env.example
git commit -m "docs(entra): document Entra env vars in .env.example"
```

---

### Task 7: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Run the full test suite one final time**

```bash
cd backend
pytest -q
```

Expected: all tests pass

- [ ] **Step 2: Push the branch**

```bash
cd ..
git push -u origin identity/06-entra-oidc
```

- [ ] **Step 3: Open a PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` and create a PR.

Title: `06. Microsoft Entra OIDC`

Body:
```
Adds Microsoft Entra (Azure AD) OIDC login.

Changes:
- `backend/app/auth/sso_entra.py` — OIDC module (build URL, exchange code, verify token)
- `backend/app/auth/router.py` — GET /auth/entra/login and GET /auth/entra/callback
- `backend/app/config.py` — 5 new Entra settings
- `backend/.env.example` — document Entra env vars with setup instructions
- `backend/tests/test_auth_entra_oidc.py` — full test coverage

Token validation uses python-jose with Microsoft's JWKS endpoint (no new deps).
Single-tenant: tid claim is enforced. Group claims extracted and returned.

ClickUp: https://app.clickup.com/t/86d3b0ea5
```

- [ ] **Step 4: Wait for CI to go green, then merge**

- [ ] **Step 5: Update ClickUp task 06 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ea5` and set status to complete.
