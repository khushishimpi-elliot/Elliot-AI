# POST /workspace Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `POST /workspace` — a public endpoint that creates a new tenant and linked organisation in one transaction and returns the full workspace object.

**Architecture:** A new `Tenant` SQLAlchemy model and Alembic migration lay the foundation. A dedicated `workspace` router handles the endpoint. Pydantic's `Literal` type enforces residency validation. Tests mock the async DB session via FastAPI's dependency override system — no real Postgres required.

**Tech Stack:** FastAPI, SQLAlchemy (async), Alembic, Pydantic v2, pytest, AsyncMock

---

### Task 1: Create feature branch

**Files:** None — git only

- [ ] **Step 1: Checkout main and pull**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create the branch**

```bash
git checkout -b workspace/09-workspace-endpoint
```

Expected: `Switched to a new branch 'workspace/09-workspace-endpoint'`

---

### Task 2: Create Tenant model and migration

**Files:**
- Create: `backend/app/models/tenant.py`
- Create: `backend/migrations/versions/003_create_tenants.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/tenant.py`**

```python
import uuid

from sqlalchemy import TIMESTAMP, UUID, Column, Text
from sqlalchemy.sql import func

from app.models.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    team_size = Column(Text, nullable=True)
    residency = Column(Text, nullable=False, server_default="US")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
```

- [ ] **Step 2: Create `backend/migrations/versions/003_create_tenants.py`**

```python
"""Create tenants table

Revision ID: 003
Revises: (none — must run before 001 which has FK to tenants.id)
Create Date: 2026-06-15 00:00:00.000000
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("domain", sa.Text(), nullable=False),
        sa.Column("team_size", sa.Text(), nullable=True),
        sa.Column("residency", sa.Text(), nullable=False, server_default="US"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("tenants")
```

- [ ] **Step 3: Export Tenant from `backend/app/models/__init__.py`**

Replace the file content with:

```python
from app.models.base import Base
from app.models.organisation import Member, Organisation, Role
from app.models.sdlc import SDLCProfile
from app.models.tenant import Tenant

__all__ = ["Base", "Organisation", "Role", "Member", "SDLCProfile", "Tenant"]
```

- [ ] **Step 4: Verify import works**

```bash
cd backend
python -c "from app.models.tenant import Tenant; print(Tenant.__tablename__)"
```

Expected: `tenants`

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/app/models/tenant.py backend/migrations/versions/003_create_tenants.py backend/app/models/__init__.py
git commit -m "feat(workspace): add Tenant model and migration"
```

---

### Task 3: Create workspace schemas (TDD)

**Files:**
- Create: `backend/app/schemas/workspace.py`
- Create: `backend/tests/test_workspace.py`

- [ ] **Step 1: Write failing validation tests**

Create `backend/tests/test_workspace.py`:

```python
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_workspace_invalid_residency():
    r = client.post(
        "/workspace",
        json={"name": "Acme", "domain": "acme.com", "residency": "MARS"},
    )
    assert r.status_code == 422


def test_create_workspace_missing_required_fields():
    r = client.post("/workspace", json={"domain": "acme.com"})
    assert r.status_code == 422
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
python -m pytest tests/test_workspace.py -v
```

Expected: FAIL — 404 (route doesn't exist yet)

- [ ] **Step 3: Create `backend/app/schemas/workspace.py`**

```python
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    domain: str
    team_size: str | None = None
    residency: Literal["US", "EU", "UK", "APAC"] = "US"


class WorkspaceResponse(BaseModel):
    tenant_id: UUID
    name: str
    domain: str
    team_size: str | None
    residency: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Verify import works**

```bash
cd backend
python -c "from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse; print('ok')"
```

Expected: `ok`

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/app/schemas/workspace.py backend/tests/test_workspace.py
git commit -m "feat(workspace): add WorkspaceCreate and WorkspaceResponse schemas"
```

---

### Task 4: Implement POST /workspace route (TDD)

**Files:**
- Create: `backend/app/routers/workspace.py`
- Modify: `backend/app/main.py`
- Modify: `backend/tests/test_workspace.py`

- [ ] **Step 1: Add the happy-path test to `backend/tests/test_workspace.py`**

Append to the existing test file:

```python
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch


def make_mock_db():
    db = AsyncMock()
    db.add = MagicMock()

    async def fake_refresh(obj):
        obj.created_at = datetime.now(UTC)

    db.refresh = AsyncMock(side_effect=fake_refresh)
    return db


def test_create_workspace_returns_201():
    mock_db = make_mock_db()

    from app.db.session import get_db
    from app.routers.workspace import router

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        r = client.post(
            "/workspace",
            json={"name": "Acme Corp", "domain": "acme.com", "team_size": "50", "residency": "EU"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["name"] == "Acme Corp"
        assert body["domain"] == "acme.com"
        assert body["residency"] == "EU"
        assert "tenant_id" in body
        assert "created_at" in body
    finally:
        app.dependency_overrides.clear()


def test_create_workspace_default_residency():
    mock_db = make_mock_db()

    from app.db.session import get_db

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        r = client.post(
            "/workspace",
            json={"name": "Beta Inc", "domain": "beta.com"},
        )
        assert r.status_code == 201
        assert r.json()["residency"] == "US"
    finally:
        app.dependency_overrides.clear()
```

- [ ] **Step 2: Run tests to confirm happy-path tests fail**

```bash
cd backend
python -m pytest tests/test_workspace.py::test_create_workspace_returns_201 -v
```

Expected: FAIL — 404 (route doesn't exist)

- [ ] **Step 3: Create `backend/app/routers/workspace.py`**

```python
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.organisation import Organisation
from app.models.tenant import Tenant
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter(tags=["workspace"])


@router.post("/workspace", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    tenant = Tenant(
        id=uuid.uuid4(),
        name=payload.name,
        domain=payload.domain,
        team_size=payload.team_size,
        residency=payload.residency,
    )
    db.add(tenant)

    org = Organisation(
        tenant_id=tenant.id,
        org_name=payload.name,
        domain=payload.domain,
        team_size=payload.team_size,
        data_residency=payload.residency,
    )
    db.add(org)

    await db.commit()
    await db.refresh(tenant)

    return WorkspaceResponse(
        tenant_id=tenant.id,
        name=tenant.name,
        domain=tenant.domain,
        team_size=tenant.team_size,
        residency=tenant.residency,
        created_at=tenant.created_at,
    )
```

- [ ] **Step 4: Register the workspace router in `backend/app/main.py`**

Add the import and include_router call. The full `main.py` should look like:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.routers import organisation, sdlc
from app.routers.workspace import router as workspace_router

app = FastAPI(title="Elliot-AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisation.router)
app.include_router(sdlc.router)
app.include_router(workspace_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "elliot-ai", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Elliot-AI backend. See /docs for API."}
```

- [ ] **Step 5: Run all workspace tests**

```bash
cd backend
python -m pytest tests/test_workspace.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 6: Run full test suite**

```bash
python -m pytest -q
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/app/routers/workspace.py backend/app/main.py backend/tests/test_workspace.py
git commit -m "feat(workspace): add POST /workspace endpoint"
```

---

### Task 5: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Run ruff to catch any lint issues**

```bash
cd backend
python -m ruff check .
```

Expected: no errors. If errors exist, run `python -m ruff check . --fix` then re-check.

- [ ] **Step 2: Run full test suite one final time**

```bash
python -m pytest -q
```

Expected: all tests pass

- [ ] **Step 3: Push the branch**

```bash
cd ..
git push -u origin workspace/09-workspace-endpoint
```

- [ ] **Step 4: Open PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` and create a PR.

Title: `09. POST /workspace endpoint`

Body:
```
Adds POST /workspace — public endpoint to create a new isolated tenant.

Changes:
- `backend/app/models/tenant.py` — Tenant SQLAlchemy model
- `backend/migrations/versions/003_create_tenants.py` — tenants table migration
- `backend/app/schemas/workspace.py` — WorkspaceCreate + WorkspaceResponse schemas
- `backend/app/routers/workspace.py` — POST /workspace route
- `backend/app/main.py` — register workspace router
- `backend/tests/test_workspace.py` — 4 tests, DB mocked via dependency override

Accepts: name, domain, team_size, residency (US/EU/UK/APAC, validated).
Creates Tenant + Organisation in one transaction.
Returns 201 with full workspace object including tenant_id.

ClickUp: https://app.clickup.com/t/86d3b0ebe
```

- [ ] **Step 5: Wait for CI to go green, then merge**

- [ ] **Step 6: Update ClickUp task 09 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ebe` and set status to complete.
