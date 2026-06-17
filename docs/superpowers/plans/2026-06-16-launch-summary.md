# GET /launch Summary Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `GET /launch/{tenant_id}` — an authenticated endpoint that aggregates org info, SDLC profile, connected connectors, and chunk count into one launch summary.

**Architecture:** New `launch` router with one GET endpoint. Runs 4 sequential DB queries (Organisation, SDLCProfile, Connector, KnowledgeChunk count) and assembles a `LaunchSummary` response. Uses the existing `get_current_user` JWT dependency for auth. Tests mock all 4 DB queries via `side_effect` list on `db.execute`.

**Tech Stack:** FastAPI, SQLAlchemy (async), Pydantic, pytest, AsyncMock

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
git checkout -b launch/27-launch-summary
```

Expected: `Switched to a new branch 'launch/27-launch-summary'`

---

### Task 2: Create schemas + router + register (TDD)

**Files:**
- Create: `backend/app/schemas/launch.py`
- Create: `backend/app/routers/launch.py`
- Create: `backend/tests/test_launch.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/schemas/launch.py`**

```python
from pydantic import BaseModel


class OrgSummary(BaseModel):
    name: str
    domain: str
    team_size: str | None
    residency: str


class SDLCSummary(BaseModel):
    stack: str | None
    branching_model: str | None
    test_framework: str | None
    coverage_gate: int | None
    ci_cd_platform: str | None
    review_policy: str | None
    arch_style: str | None


class LaunchSummary(BaseModel):
    org: OrgSummary
    sdlc: SDLCSummary | None
    connectors: list[str]
    chunk_count: int
```

- [ ] **Step 2: Write failing tests**

Create `backend/tests/test_launch.py`:

```python
import uuid
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.main import app
from app.models.connector import Connector
from app.models.organisation import Organisation
from app.models.sdlc import SDLCProfile

client = TestClient(app)

TENANT_ID = uuid.uuid4()
FAKE_USER = {"sub": "test@elliotsystems.com"}


def make_mock_db(org=None, sdlc=None, connectors=None, chunk_count=0):
    db = AsyncMock()

    org_result = MagicMock()
    org_result.scalar_one_or_none.return_value = org

    sdlc_result = MagicMock()
    sdlc_result.scalar_one_or_none.return_value = sdlc

    connectors_result = MagicMock()
    connectors_result.scalars.return_value.all.return_value = connectors or []

    count_result = MagicMock()
    count_result.scalar.return_value = chunk_count

    db.execute = AsyncMock(
        side_effect=[org_result, sdlc_result, connectors_result, count_result]
    )
    return db


def make_org():
    return Organisation(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        org_name="Elliot Systems",
        domain="elliotsystems.com",
        team_size="20",
        data_residency="US",
    )


def make_sdlc():
    return SDLCProfile(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        stack="Python/FastAPI",
        branching_model="trunk",
        test_framework="pytest",
        coverage_gate=80,
        ci_cd_platform="GitHub Actions",
        review_policy="2-approvals",
        arch_style="monolith",
    )


def make_connector(provider: str):
    return Connector(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        provider=provider,
        status="connected",
    )


def test_launch_summary_success():
    mock_db = make_mock_db(
        org=make_org(),
        sdlc=make_sdlc(),
        connectors=[make_connector("github"), make_connector("jira")],
        chunk_count=42,
    )
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["org"]["name"] == "Elliot Systems"
        assert body["org"]["domain"] == "elliotsystems.com"
        assert body["sdlc"]["stack"] == "Python/FastAPI"
        assert body["sdlc"]["coverage_gate"] == 80
        assert set(body["connectors"]) == {"github", "jira"}
        assert body["chunk_count"] == 42
    finally:
        app.dependency_overrides.clear()


def test_launch_summary_no_org():
    mock_db = AsyncMock()
    no_org_result = MagicMock()
    no_org_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=no_org_result)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 404
        assert "not found" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_launch_summary_no_sdlc():
    mock_db = make_mock_db(
        org=make_org(),
        sdlc=None,
        connectors=[make_connector("github")],
        chunk_count=10,
    )
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    try:
        r = client.get(f"/launch/{TENANT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["org"]["name"] == "Elliot Systems"
        assert body["sdlc"] is None
        assert body["connectors"] == ["github"]
        assert body["chunk_count"] == 10
    finally:
        app.dependency_overrides.clear()
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_launch.py -v
```

Expected: FAIL — 404 (route doesn't exist yet)

- [ ] **Step 4: Create `backend/app/routers/launch.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.connector import Connector
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.organisation import Organisation
from app.models.sdlc import SDLCProfile
from app.schemas.launch import LaunchSummary, OrgSummary, SDLCSummary

router = APIRouter(tags=["launch"])


@router.get("/{tenant_id}", response_model=LaunchSummary)
async def get_launch_summary(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
) -> LaunchSummary:
    # 1. Organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.tenant_id == tenant_id)
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="organisation not found")

    # 2. SDLC profile
    sdlc_result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    sdlc = sdlc_result.scalar_one_or_none()

    # 3. Connected connectors
    conn_result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.status == "connected")
        )
    )
    connectors = conn_result.scalars().all()

    # 4. Chunk count
    count_result = await db.execute(
        select(func.count()).select_from(KnowledgeChunk).where(
            KnowledgeChunk.tenant_id == tenant_id
        )
    )
    chunk_count = count_result.scalar() or 0

    return LaunchSummary(
        org=OrgSummary(
            name=org.org_name,
            domain=org.domain,
            team_size=org.team_size,
            residency=org.data_residency or "US",
        ),
        sdlc=SDLCSummary(
            stack=sdlc.stack,
            branching_model=sdlc.branching_model,
            test_framework=sdlc.test_framework,
            coverage_gate=sdlc.coverage_gate,
            ci_cd_platform=sdlc.ci_cd_platform,
            review_policy=sdlc.review_policy,
            arch_style=sdlc.arch_style,
        ) if sdlc else None,
        connectors=[c.provider for c in connectors],
        chunk_count=chunk_count,
    )
```

- [ ] **Step 5: Register launch router in `backend/app/main.py`**

Read `backend/app/main.py`. Add import and router registration:

```python
from app.routers import launch
```

```python
app.include_router(launch.router, prefix="/launch", tags=["launch"])
```

- [ ] **Step 6: Run all launch tests**

```bash
cd backend
python -m pytest tests/test_launch.py -v
```

Expected: all 3 PASS. Fix any failures.

- [ ] **Step 7: Run full suite + ruff**

```bash
python -m pytest -q && python -m ruff check .
```

Expected: all pass

- [ ] **Step 8: Commit**

```bash
cd ..
git add backend/app/schemas/launch.py backend/app/routers/launch.py backend/tests/test_launch.py backend/app/main.py
git commit -m "feat(launch): add GET /launch/{tenant_id} summary endpoint"
```

---

### Task 3: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin launch/27-launch-summary
```

- [ ] **Step 2: Open PR on GitHub**

Title: `27. GET /launch summary endpoint`

Body:
```
Adds GET /launch/{tenant_id} — authenticated endpoint returning org, SDLC, connectors, and chunk count.

Changes:
- `backend/app/schemas/launch.py` — OrgSummary, SDLCSummary, LaunchSummary schemas
- `backend/app/routers/launch.py` — GET /{tenant_id} with JWT auth
- `backend/app/main.py` — register launch router
- `backend/tests/test_launch.py` — 3 tests (success, no org 404, no sdlc)

Queries: Organisation + SDLCProfile + Connector (connected only) + KnowledgeChunk count.

ClickUp: https://app.clickup.com/t/86d3b0ede
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 27 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ede` and set status to complete.
