# GET /launch Summary Endpoint Design — Task 27

## Overview

Single authenticated endpoint that aggregates org info, SDLC stack/standards, connected connectors, and chunk count into one launch summary response. Used by the terminal UI after login.

## Files

| File | Action |
|------|--------|
| `backend/app/routers/launch.py` | Create — GET /launch/{tenant_id} |
| `backend/app/schemas/launch.py` | Create — LaunchSummary schema |
| `backend/app/main.py` | Modify — register launch router |
| `backend/tests/test_launch.py` | Create — 3 tests |

## Response Schema (`schemas/launch.py`)

```python
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
    connectors: list[str]    # provider names with status="connected"
    chunk_count: int
```

## Route (`routers/launch.py`)

`GET /launch/{tenant_id}` — requires authentication via `get_current_user` dependency from `backend/app/auth/dependencies.py`.

**Logic:**
1. Query `Organisation` by `tenant_id` → 404 if not found
2. Query `SDLCProfile` by `tenant_id` → None if not set
3. Query `Connector` where `tenant_id = tenant_id` AND `status = "connected"` → list of `provider` names
4. Count `KnowledgeChunk` where `tenant_id = tenant_id`
5. Return `LaunchSummary`

Registered in `main.py` with `prefix="/launch"`.

## Tests (`tests/test_launch.py`)

All tests mock the DB session. Auth dependency is overridden to skip JWT validation.

| Test | What it checks |
|------|---------------|
| `test_launch_summary_success` | All 4 queries return data → 200 with full summary |
| `test_launch_summary_no_org` | Org not found → 404 |
| `test_launch_summary_no_sdlc` | Org found, no SDLC profile → 200 with sdlc=None |
