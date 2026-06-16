# SDLC Profile CRUD Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `DELETE /sdlc/{tenant_id}` and full test coverage for all 4 SDLC CRUD operations.

**Architecture:** The model, schemas, and POST/GET/PUT routes already exist in `backend/app/routers/sdlc.py`. This plan adds only the DELETE route and tests. Tests mock the async DB session via FastAPI dependency override — no real Postgres needed.

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
git checkout -b sdlc/12-sdlc-profile-endpoint
```

Expected: `Switched to a new branch 'sdlc/12-sdlc-profile-endpoint'`

---

### Task 2: Add DELETE endpoint (TDD)

**Files:**
- Create: `backend/tests/test_sdlc.py`
- Modify: `backend/app/routers/sdlc.py`

- [ ] **Step 1: Write the failing DELETE tests**

Create `backend/tests/test_sdlc.py`:

```python
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.sdlc import SDLCProfile

client = TestClient(app)

TENANT_ID = uuid.uuid4()


def make_profile():
    profile = SDLCProfile(
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
    profile.created_at = datetime(2026, 6, 16, 12, 0, 0)
    profile.updated_at = datetime(2026, 6, 16, 12, 0, 0)
    return profile


def make_mock_db(profile=None):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = profile
    db.execute = AsyncMock(return_value=mock_result)
    db.add = MagicMock()

    async def fake_refresh(obj):
        pass

    db.refresh = AsyncMock(side_effect=fake_refresh)
    return db


def test_delete_sdlc_profile():
    mock_db = make_mock_db(profile=make_profile())
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.delete(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 204
    finally:
        del app.dependency_overrides[get_db]


def test_delete_sdlc_profile_not_found():
    mock_db = make_mock_db(profile=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.delete(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 404
        assert "not found" in r.json()["detail"]
    finally:
        del app.dependency_overrides[get_db]
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
python -m pytest tests/test_sdlc.py::test_delete_sdlc_profile tests/test_sdlc.py::test_delete_sdlc_profile_not_found -v
```

Expected: FAIL — 405 Method Not Allowed (route doesn't exist)

- [ ] **Step 3: Add DELETE route to `backend/app/routers/sdlc.py`**

Read the file first. Then add these imports at the top if not already present:

```python
from fastapi import APIRouter, Depends, HTTPException, Response, status
```

Then append this route at the end of the file:

```python

@router.delete("/sdlc/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sdlc_profile(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete SDLC profile for a tenant"""
    result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="SDLC profile not found")
    await db.delete(profile)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run DELETE tests to confirm they pass**

```bash
python -m pytest tests/test_sdlc.py::test_delete_sdlc_profile tests/test_sdlc.py::test_delete_sdlc_profile_not_found -v
```

Expected: both PASS

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/app/routers/sdlc.py backend/tests/test_sdlc.py
git commit -m "feat(sdlc): add DELETE /sdlc/{tenant_id} endpoint"
```

---

### Task 3: Add tests for POST, GET, PUT

**Files:**
- Modify: `backend/tests/test_sdlc.py`

- [ ] **Step 1: Append POST, GET, PUT tests to `backend/tests/test_sdlc.py`**

```python

def test_create_sdlc_profile():
    mock_db = make_mock_db()

    async def fake_refresh(obj):
        obj.id = uuid.uuid4()
        obj.created_at = datetime(2026, 6, 16, 12, 0, 0)
        obj.updated_at = datetime(2026, 6, 16, 12, 0, 0)

    mock_db.refresh = AsyncMock(side_effect=fake_refresh)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.post(
            "/sdlc",
            json={
                "tenant_id": str(TENANT_ID),
                "stack": "Python/FastAPI",
                "branching_model": "trunk",
                "test_framework": "pytest",
                "coverage_gate": 80,
                "ci_cd_platform": "GitHub Actions",
                "review_policy": "2-approvals",
                "arch_style": "monolith",
            },
        )
        assert r.status_code == 200
        body = r.json()
        assert body["tenant_id"] == str(TENANT_ID)
        assert body["stack"] == "Python/FastAPI"
    finally:
        del app.dependency_overrides[get_db]


def test_get_sdlc_profile():
    profile = make_profile()
    mock_db = make_mock_db(profile=profile)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["tenant_id"] == str(TENANT_ID)
        assert body["stack"] == "Python/FastAPI"
    finally:
        del app.dependency_overrides[get_db]


def test_get_sdlc_profile_not_found():
    mock_db = make_mock_db(profile=None)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.get(f"/sdlc/{TENANT_ID}")
        assert r.status_code == 404
        assert "not found" in r.json()["detail"]
    finally:
        del app.dependency_overrides[get_db]


def test_update_sdlc_profile():
    profile = make_profile()
    mock_db = make_mock_db(profile=profile)

    async def fake_refresh(obj):
        pass

    mock_db.refresh = AsyncMock(side_effect=fake_refresh)
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        r = client.put(
            f"/sdlc/{TENANT_ID}",
            json={"stack": "Go/Gin", "coverage_gate": 90},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["stack"] == "Go/Gin"
        assert body["coverage_gate"] == 90
    finally:
        del app.dependency_overrides[get_db]
```

- [ ] **Step 2: Run all SDLC tests**

```bash
cd backend
python -m pytest tests/test_sdlc.py -v
```

Expected: all 6 tests PASS

- [ ] **Step 3: Run full test suite**

```bash
python -m pytest -q
```

Expected: all tests pass

- [ ] **Step 4: Run ruff**

```bash
python -m ruff check .
```

Expected: no errors. If errors exist, run `python -m ruff check . --fix` then re-check.

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/tests/test_sdlc.py
git commit -m "test(sdlc): add full CRUD test coverage"
```

---

### Task 4: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin sdlc/12-sdlc-profile-endpoint
```

- [ ] **Step 2: Open PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` and create a PR.

Title: `12. POST /sdlc-profile endpoint`

Body:
```
Completes SDLC profile CRUD endpoints.

Changes:
- `backend/app/routers/sdlc.py` — add DELETE /sdlc/{tenant_id} (204 No Content)
- `backend/tests/test_sdlc.py` — 6 tests covering all 4 CRUD operations, DB mocked

ClickUp: https://app.clickup.com/t/86d3b0eby
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 12 to "complete"**

Go to `https://app.clickup.com/t/86d3b0eby` and set status to complete.
