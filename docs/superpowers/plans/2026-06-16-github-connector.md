# GitHub Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the GitHub connector — OAuth token-based repo read, PR fetch, and a push webhook endpoint with HMAC-SHA256 signature verification.

**Architecture:** Mirrors the existing Bitbucket connector pattern exactly. `GitHubConnector` service class wraps the GitHub REST API. A FastAPI router exposes 3 read endpoints + 1 webhook endpoint. All read endpoints look up the stored (encrypted) OAuth token from the `connectors` DB table. Webhook verifies the `X-Hub-Signature-256` header using the global `github_webhook_secret` config value.

**Tech Stack:** FastAPI, httpx (async), SQLAlchemy (async), cryptography (Fernet), pytest, AsyncMock

---

### Task 1: Create feature branch

**Files:** None — git only

- [ ] **Step 1: Checkout main and pull**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create branch**

```bash
git checkout -b connectors/15-github-connector
```

Expected: `Switched to a new branch 'connectors/15-github-connector'`

---

### Task 2: Add GitHub settings to config.py

**Files:**
- Modify: `backend/app/config.py`

- [ ] **Step 1: Read the current config.py**

Open `backend/app/config.py` and add these 3 settings to the `Settings` class (after the existing Entra settings):

```python
    github_client_id: str = ""
    github_client_secret: str = ""
    github_webhook_secret: str = ""
```

- [ ] **Step 2: Verify**

```bash
cd backend
python -c "from app.config import get_settings; s = get_settings(); print(s.github_webhook_secret)"
```

Expected: empty string (no error)

- [ ] **Step 3: Commit**

```bash
cd ..
git add backend/app/config.py
git commit -m "feat(github): add GitHub config settings"
```

---

### Task 3: Create GitHub schemas

**Files:**
- Create: `backend/app/schemas/github.py`

- [ ] **Step 1: Create `backend/app/schemas/github.py`**

```python
from pydantic import BaseModel


class GitHubRepo(BaseModel):
    name: str
    full_name: str
    description: str | None
    owner: str
    is_private: bool
    default_branch: str


class GitHubFile(BaseModel):
    path: str
    content: str


class GitHubPR(BaseModel):
    id: int
    title: str
    body: str | None
    author: str
    state: str
    created_at: str
    updated_at: str
    head_branch: str | None
    base_branch: str | None


class GitHubWebhookResponse(BaseModel):
    status: str


class GitHubIndexResponse(BaseModel):
    status: str
    message: str
    files_indexed: int
```

- [ ] **Step 2: Verify import**

```bash
cd backend
python -c "from app.schemas.github import GitHubRepo, GitHubPR, GitHubWebhookResponse; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
cd ..
git add backend/app/schemas/github.py
git commit -m "feat(github): add GitHub schemas"
```

---

### Task 4: Create GitHubConnector service

**Files:**
- Create: `backend/app/services/connectors/github.py`

- [ ] **Step 1: Create `backend/app/services/connectors/github.py`**

```python
import httpx

from app.services.oauth import decrypt_token

GITHUB_API_BASE = "https://api.github.com"
SUPPORTED_FILE_TYPES = {".py", ".ts", ".js", ".go", ".java", ".rs"}
SKIP_FOLDERS = {"node_modules", ".git", "__pycache__", "dist", "build", ".venv", "venv"}


class GitHubConnector:
    """GitHub API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def get_repositories(self, owner: str) -> list[dict]:
        """Get all repositories for a user or organisation"""
        repos = []
        page = 1

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{owner}/repos",
                    headers=self.headers,
                    params={"page": page, "per_page": 100, "type": "all"},
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    break

                for repo in data:
                    repos.append(
                        {
                            "name": repo.get("name"),
                            "full_name": repo.get("full_name"),
                            "description": repo.get("description"),
                            "owner": repo.get("owner", {}).get("login"),
                            "is_private": repo.get("private", False),
                            "default_branch": repo.get("default_branch", "main"),
                        }
                    )

                if len(data) < 100:
                    break
                page += 1

        return repos

    async def get_file_content(self, owner: str, repo: str, path: str) -> str:
        """Get raw file content from repository"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}",
                headers={**self.headers, "Accept": "application/vnd.github.raw+json"},
            )
            response.raise_for_status()
            return response.text

    async def get_all_files(self, owner: str, repo: str) -> list[dict]:
        """Get all files in repository filtered by type and skip folders"""
        files = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/HEAD",
                headers=self.headers,
                params={"recursive": "1"},
            )
            response.raise_for_status()
            data = response.json()

            for item in data.get("tree", []):
                if item.get("type") != "blob":
                    continue

                path = item.get("path", "")

                if any(folder in path.split("/") for folder in SKIP_FOLDERS):
                    continue

                if not any(path.endswith(ext) for ext in SUPPORTED_FILE_TYPES):
                    continue

                try:
                    content = await self.get_file_content(owner, repo, path)
                    files.append({"path": path, "content": content})
                except httpx.HTTPStatusError:
                    continue

        return files

    async def get_pull_requests(self, owner: str, repo: str) -> list[dict]:
        """Get open pull requests for a repository"""
        prs = []
        page = 1

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls",
                    headers=self.headers,
                    params={"state": "open", "page": page, "per_page": 100},
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    break

                for pr in data:
                    prs.append(
                        {
                            "id": pr.get("number"),
                            "title": pr.get("title"),
                            "body": pr.get("body"),
                            "author": pr.get("user", {}).get("login"),
                            "state": pr.get("state"),
                            "created_at": pr.get("created_at"),
                            "updated_at": pr.get("updated_at"),
                            "head_branch": pr.get("head", {}).get("ref"),
                            "base_branch": pr.get("base", {}).get("ref"),
                        }
                    )

                if len(data) < 100:
                    break
                page += 1

        return prs
```

- [ ] **Step 2: Verify import**

```bash
cd backend
python -c "from app.services.connectors.github import GitHubConnector; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
cd ..
git add backend/app/services/connectors/github.py
git commit -m "feat(github): add GitHubConnector service"
```

---

### Task 5: Create GitHub router and register in main.py (TDD)

**Files:**
- Create: `backend/app/routers/github.py`
- Create: `backend/tests/test_github_connector.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_github_connector.py`:

```python
import hashlib
import hmac
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.config import get_settings
from app.db.session import get_db
from app.main import app
from app.models.connector import Connector

client = TestClient(app)

TENANT_ID = uuid.uuid4()
FAKE_TOKEN = "encrypted-token"


def make_mock_connector(provider="github"):
    c = Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider=provider,
        status="connected",
        oauth_token=FAKE_TOKEN,
    )
    return c


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


def make_valid_signature(body: bytes) -> str:
    get_settings.cache_clear()
    import os
    os.environ["github_webhook_secret"] = "test-secret"
    get_settings.cache_clear()
    digest = hmac.new(b"test-secret", body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_get_repos_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/github/{TENANT_ID}/repos?owner=testuser")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_get_repos_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_repos = [
        {
            "name": "my-repo",
            "full_name": "testuser/my-repo",
            "description": "A repo",
            "owner": {"login": "testuser"},
            "private": False,
            "default_branch": "main",
        }
    ]

    try:
        with patch("app.services.connectors.github.decrypt_token", return_value="token"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_repos
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/github/{TENANT_ID}/repos?owner=testuser")
        assert r.status_code == 200
        assert r.json()[0]["name"] == "my-repo"
    finally:
        del app.dependency_overrides[get_db]


def test_get_prs_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    fake_prs = [
        {
            "number": 1,
            "title": "Fix bug",
            "body": "fixes the bug",
            "user": {"login": "alice"},
            "state": "open",
            "created_at": "2026-06-16T00:00:00Z",
            "updated_at": "2026-06-16T01:00:00Z",
            "head": {"ref": "fix-branch"},
            "base": {"ref": "main"},
        }
    ]

    try:
        with patch("app.services.connectors.github.decrypt_token", return_value="token"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = fake_prs
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/github/{TENANT_ID}/repos/testuser/my-repo/prs")
        assert r.status_code == 200
        assert r.json()[0]["title"] == "Fix bug"
    finally:
        del app.dependency_overrides[get_db]


def test_webhook_missing_signature():
    r = client.post(
        f"/github/{TENANT_ID}/webhook",
        json={"action": "push"},
    )
    assert r.status_code == 400
    assert "missing" in r.json()["detail"]


def test_webhook_invalid_signature():
    import os
    os.environ["github_webhook_secret"] = "test-secret"
    get_settings.cache_clear()
    try:
        r = client.post(
            f"/github/{TENANT_ID}/webhook",
            content=b'{"action": "push"}',
            headers={"X-Hub-Signature-256": "sha256=invalidsignature"},
        )
        assert r.status_code == 400
        assert "invalid" in r.json()["detail"]
    finally:
        get_settings.cache_clear()


def test_webhook_valid_signature():
    import os
    os.environ["github_webhook_secret"] = "test-secret"
    get_settings.cache_clear()
    body = b'{"action": "push"}'
    digest = hmac.new(b"test-secret", body, hashlib.sha256).hexdigest()
    try:
        r = client.post(
            f"/github/{TENANT_ID}/webhook",
            content=body,
            headers={"X-Hub-Signature-256": f"sha256={digest}"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "received"
    finally:
        get_settings.cache_clear()
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_github_connector.py -v
```

Expected: FAIL — 404 (routes don't exist yet)

- [ ] **Step 3: Create `backend/app/routers/github.py`**

```python
import hashlib
import hmac
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.github import (
    GitHubFile,
    GitHubIndexResponse,
    GitHubPR,
    GitHubRepo,
    GitHubWebhookResponse,
)
from app.services.connectors.github import GitHubConnector

router = APIRouter(tags=["github"])


async def get_github_connector(
    tenant_id: UUID, db: AsyncSession
) -> GitHubConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "github")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="GitHub connector not found or not connected",
        )

    return GitHubConnector(connector.oauth_token)


@router.get("/{tenant_id}/repos", response_model=list[GitHubRepo])
async def get_github_repos(
    tenant_id: UUID,
    owner: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_repositories(owner)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{owner}/{repo}/files",
    response_model=list[GitHubFile],
)
async def get_github_repo_files(
    tenant_id: UUID,
    owner: str,
    repo: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_all_files(owner, repo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{tenant_id}/repos/{owner}/{repo}/prs",
    response_model=list[GitHubPR],
)
async def get_github_repo_prs(
    tenant_id: UUID,
    owner: str,
    repo: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_github_connector(tenant_id, db)
    try:
        return await connector.get_pull_requests(owner, repo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/{tenant_id}/webhook", response_model=GitHubWebhookResponse)
async def github_webhook(
    tenant_id: UUID,
    request: Request,
) -> GitHubWebhookResponse:
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="missing signature header")

    body = await request.body()
    secret = get_settings().github_webhook_secret
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=400, detail="invalid signature")

    return GitHubWebhookResponse(status="received")
```

- [ ] **Step 4: Register the GitHub router in `backend/app/main.py`**

Read `backend/app/main.py`. Add the import and router registration. Add after the existing bitbucket router line:

```python
from app.routers import github
```

And:

```python
app.include_router(github.router, prefix="/github", tags=["github"])
```

- [ ] **Step 5: Run all GitHub tests**

```bash
cd backend
python -m pytest tests/test_github_connector.py -v
```

Expected: all 6 tests PASS

- [ ] **Step 6: Run full test suite**

```bash
python -m pytest -q
```

Expected: all pass

- [ ] **Step 7: Run ruff**

```bash
python -m ruff check .
```

Expected: no errors. Run `python -m ruff check . --fix` if there are any.

- [ ] **Step 8: Commit**

```bash
cd ..
git add backend/app/routers/github.py backend/tests/test_github_connector.py backend/app/main.py
git commit -m "feat(github): add GitHub connector routes and tests"
```

---

### Task 6: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin connectors/15-github-connector
```

- [ ] **Step 2: Open PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` and create a PR.

Title: `15. GitHub connector`

Body:
```
Adds GitHub connector — OAuth token-based repo read, PR fetch, and push webhook.

Changes:
- `backend/app/services/connectors/github.py` — GitHubConnector class
- `backend/app/routers/github.py` — GET repos/files/PRs + POST webhook
- `backend/app/schemas/github.py` — GitHub schemas
- `backend/app/config.py` — github_client_id, github_client_secret, github_webhook_secret
- `backend/app/main.py` — register github router with prefix="/github"
- `backend/tests/test_github_connector.py` — 6 tests

Webhook verifies X-Hub-Signature-256 HMAC-SHA256. Re-indexing on push is handled by task 26.

ClickUp: https://app.clickup.com/t/86d3b0ec3
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 15 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ec3` and set status to complete.
