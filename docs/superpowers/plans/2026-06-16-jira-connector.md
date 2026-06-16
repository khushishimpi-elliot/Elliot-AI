# Jira Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Jira connector — OAuth token-based JQL ticket search, full issue fetch, and issue status fetch using the Atlassian Cloud REST API v3.

**Architecture:** Mirrors the GitHub connector pattern exactly. `JiraConnector` wraps the Atlassian API with `cloud_id` passed at construction. A FastAPI router exposes 3 read endpoints. All routes look up the stored (encrypted) OAuth token from the `connectors` DB table and accept `cloud_id` as a query parameter (consistent with Bitbucket's `workspace` pattern).

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
git checkout -b connectors/18-jira-connector
```

Expected: `Switched to a new branch 'connectors/18-jira-connector'`

---

### Task 2: Add Jira config settings + schemas + connector service

**Files:**
- Modify: `backend/app/config.py`
- Create: `backend/app/schemas/jira.py`
- Create: `backend/app/services/connectors/jira.py`

- [ ] **Step 1: Add Jira settings to `backend/app/config.py`**

Read `backend/app/config.py`. Add after the GitHub settings:

```python
    jira_client_id: str = ""
    jira_client_secret: str = ""
```

- [ ] **Step 2: Verify config**

```bash
cd backend
python -c "from app.config import get_settings; s = get_settings(); print(s.jira_client_id)"
```

Expected: empty string

- [ ] **Step 3: Create `backend/app/schemas/jira.py`**

```python
from pydantic import BaseModel


class JiraIssue(BaseModel):
    key: str
    summary: str
    description: str | None
    status: str
    assignee: str | None
    priority: str | None
    issue_type: str
    created: str
    updated: str


class JiraStatus(BaseModel):
    key: str
    status: str
```

- [ ] **Step 4: Verify schemas**

```bash
python -c "from app.schemas.jira import JiraIssue, JiraStatus; print('ok')"
```

Expected: `ok`

- [ ] **Step 5: Create `backend/app/services/connectors/jira.py`**

```python
import httpx

from app.services.oauth import decrypt_token

JIRA_API_BASE = "https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"


class JiraConnector:
    """Jira Cloud API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str, cloud_id: str):
        self.access_token = decrypt_token(encrypted_token)
        self.cloud_id = cloud_id
        self.base_url = JIRA_API_BASE.format(cloud_id=cloud_id)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def search_issues(self, jql: str) -> list[dict]:
        """Search Jira issues using JQL"""
        issues = []
        start_at = 0
        max_results = 100

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    params={
                        "jql": jql,
                        "startAt": start_at,
                        "maxResults": max_results,
                        "fields": "summary,description,status,assignee,priority,issuetype,created,updated",
                    },
                )
                response.raise_for_status()
                data = response.json()

                for issue in data.get("issues", []):
                    fields = issue.get("fields", {})
                    issues.append(
                        {
                            "key": issue.get("key"),
                            "summary": fields.get("summary", ""),
                            "description": fields.get("description"),
                            "status": fields.get("status", {}).get("name", ""),
                            "assignee": (
                                fields.get("assignee", {}).get("displayName")
                                if fields.get("assignee")
                                else None
                            ),
                            "priority": (
                                fields.get("priority", {}).get("name")
                                if fields.get("priority")
                                else None
                            ),
                            "issue_type": fields.get("issuetype", {}).get("name", ""),
                            "created": fields.get("created", ""),
                            "updated": fields.get("updated", ""),
                        }
                    )

                total = data.get("total", 0)
                start_at += max_results
                if start_at >= total:
                    break

        return issues

    async def get_issue(self, issue_key: str) -> dict:
        """Get a single Jira issue by key"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/issue/{issue_key}",
                headers=self.headers,
                params={
                    "fields": "summary,description,status,assignee,priority,issuetype,created,updated"
                },
            )
            response.raise_for_status()
            issue = response.json()
            fields = issue.get("fields", {})
            return {
                "key": issue.get("key"),
                "summary": fields.get("summary", ""),
                "description": fields.get("description"),
                "status": fields.get("status", {}).get("name", ""),
                "assignee": (
                    fields.get("assignee", {}).get("displayName")
                    if fields.get("assignee")
                    else None
                ),
                "priority": (
                    fields.get("priority", {}).get("name")
                    if fields.get("priority")
                    else None
                ),
                "issue_type": fields.get("issuetype", {}).get("name", ""),
                "created": fields.get("created", ""),
                "updated": fields.get("updated", ""),
            }

    async def get_issue_status(self, issue_key: str) -> str:
        """Get just the status of a Jira issue"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/issue/{issue_key}",
                headers=self.headers,
                params={"fields": "status"},
            )
            response.raise_for_status()
            issue = response.json()
            return issue.get("fields", {}).get("status", {}).get("name", "")
```

- [ ] **Step 6: Verify connector**

```bash
python -c "from app.services.connectors.jira import JiraConnector; print('ok')"
```

Expected: `ok`

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/app/config.py backend/app/schemas/jira.py backend/app/services/connectors/jira.py
git commit -m "feat(jira): add config settings, schemas, and JiraConnector service"
```

---

### Task 3: Create Jira router + tests + register in main.py (TDD)

**Files:**
- Create: `backend/app/routers/jira.py`
- Create: `backend/tests/test_jira_connector.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/tests/test_jira_connector.py`**

```python
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.connector import Connector

client = TestClient(app)

TENANT_ID = uuid.uuid4()
CLOUD_ID = "test-cloud-id"
FAKE_TOKEN = "encrypted-token"


def make_mock_connector():
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider="jira",
        status="connected",
        oauth_token=FAKE_TOKEN,
    )


def make_mock_db(connector=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = connector
    db.execute = AsyncMock(return_value=mock_result)
    return db


FAKE_ISSUE = {
    "key": "PROJ-1",
    "summary": "Fix login bug",
    "description": "Users cannot log in",
    "status": "In Progress",
    "assignee": "Alice",
    "priority": "High",
    "issue_type": "Bug",
    "created": "2026-06-16T00:00:00.000+0000",
    "updated": "2026-06-16T01:00:00.000+0000",
}


def test_search_issues_connector_not_found():
    mock_db = make_mock_db(connector=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/jira/{TENANT_ID}/search?cloud_id={CLOUD_ID}&jql=project=PROJ")
        assert r.status_code == 404
    finally:
        del app.dependency_overrides[get_db]


def test_search_issues_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.services.connectors.jira.decrypt_token", return_value="token"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "issues": [
                    {
                        "key": "PROJ-1",
                        "fields": {
                            "summary": "Fix login bug",
                            "description": "Users cannot log in",
                            "status": {"name": "In Progress"},
                            "assignee": {"displayName": "Alice"},
                            "priority": {"name": "High"},
                            "issuetype": {"name": "Bug"},
                            "created": "2026-06-16T00:00:00.000+0000",
                            "updated": "2026-06-16T01:00:00.000+0000",
                        },
                    }
                ],
                "total": 1,
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(
                f"/jira/{TENANT_ID}/search?cloud_id={CLOUD_ID}&jql=project=PROJ"
            )
        assert r.status_code == 200
        assert r.json()[0]["key"] == "PROJ-1"
        assert r.json()[0]["status"] == "In Progress"
    finally:
        del app.dependency_overrides[get_db]


def test_get_issue_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.services.connectors.jira.decrypt_token", return_value="token"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "key": "PROJ-1",
                "fields": {
                    "summary": "Fix login bug",
                    "description": "Users cannot log in",
                    "status": {"name": "In Progress"},
                    "assignee": {"displayName": "Alice"},
                    "priority": {"name": "High"},
                    "issuetype": {"name": "Bug"},
                    "created": "2026-06-16T00:00:00.000+0000",
                    "updated": "2026-06-16T01:00:00.000+0000",
                },
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(f"/jira/{TENANT_ID}/issues/PROJ-1?cloud_id={CLOUD_ID}")
        assert r.status_code == 200
        assert r.json()["key"] == "PROJ-1"
        assert r.json()["summary"] == "Fix login bug"
    finally:
        del app.dependency_overrides[get_db]


def test_get_issue_status_success():
    mock_db = make_mock_db(connector=make_mock_connector())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.services.connectors.jira.decrypt_token", return_value="token"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.return_value = {
                "key": "PROJ-1",
                "fields": {"status": {"name": "Done"}},
            }
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            r = client.get(
                f"/jira/{TENANT_ID}/issues/PROJ-1/status?cloud_id={CLOUD_ID}"
            )
        assert r.status_code == 200
        assert r.json()["status"] == "Done"
        assert r.json()["key"] == "PROJ-1"
    finally:
        del app.dependency_overrides[get_db]
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_jira_connector.py -v
```

Expected: FAIL — 404 (routes don't exist yet)

- [ ] **Step 3: Create `backend/app/routers/jira.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.jira import JiraIssue, JiraStatus
from app.services.connectors.jira import JiraConnector

router = APIRouter(tags=["jira"])


async def get_jira_connector(
    tenant_id: UUID, cloud_id: str, db: AsyncSession
) -> JiraConnector:
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "jira")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector or not connector.oauth_token:
        raise HTTPException(
            status_code=404,
            detail="Jira connector not found or not connected",
        )

    return JiraConnector(connector.oauth_token, cloud_id)


@router.get("/{tenant_id}/search", response_model=list[JiraIssue])
async def search_jira_issues(
    tenant_id: UUID,
    cloud_id: str,
    jql: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        return await connector.search_issues(jql)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues/{issue_key}", response_model=JiraIssue)
async def get_jira_issue(
    tenant_id: UUID,
    issue_key: str,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        return await connector.get_issue(issue_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{tenant_id}/issues/{issue_key}/status", response_model=JiraStatus)
async def get_jira_issue_status(
    tenant_id: UUID,
    issue_key: str,
    cloud_id: str,
    db: AsyncSession = Depends(get_db),
):
    connector = await get_jira_connector(tenant_id, cloud_id, db)
    try:
        status = await connector.get_issue_status(issue_key)
        return JiraStatus(key=issue_key, status=status)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
```

- [ ] **Step 4: Register jira router in `backend/app/main.py`**

Read `backend/app/main.py`. Add import and registration after the github router lines:

```python
from app.routers import jira
```

```python
app.include_router(jira.router, prefix="/jira", tags=["jira"])
```

- [ ] **Step 5: Run all Jira tests**

```bash
cd backend
python -m pytest tests/test_jira_connector.py -v
```

Expected: all 4 PASS

- [ ] **Step 6: Run full suite + ruff**

```bash
python -m pytest -q && python -m ruff check .
```

Expected: all pass, no lint errors

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/app/routers/jira.py backend/tests/test_jira_connector.py backend/app/main.py
git commit -m "feat(jira): add Jira connector routes and tests"
```

---

### Task 4: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin connectors/18-jira-connector
```

- [ ] **Step 2: Open PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` and create a PR.

Title: `18. Jira connector`

Body:
```
Adds Jira connector — OAuth token-based JQL search, issue fetch, and status fetch.

Changes:
- `backend/app/services/connectors/jira.py` — JiraConnector class (search, get, status)
- `backend/app/routers/jira.py` — 3 routes under /jira prefix
- `backend/app/schemas/jira.py` — JiraIssue, JiraStatus schemas
- `backend/app/config.py` — jira_client_id, jira_client_secret
- `backend/app/main.py` — register jira router with prefix="/jira"
- `backend/tests/test_jira_connector.py` — 4 tests

cloud_id passed as query param (consistent with Bitbucket workspace pattern).

ClickUp: https://app.clickup.com/t/86d3b0ecf
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 18 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ecf` and set status to complete.
