# POST /workspace Endpoint Design — Task 09

## Overview

Public endpoint that creates a new isolated tenant (workspace). Accepts workspace details, creates a `Tenant` row and a linked `Organisation` row in one transaction, and returns the full workspace object.

## Files

| File | Action |
|------|--------|
| `backend/app/models/tenant.py` | Create — Tenant SQLAlchemy model |
| `backend/app/schemas/workspace.py` | Create — WorkspaceCreate + WorkspaceResponse schemas |
| `backend/app/routers/workspace.py` | Create — POST /workspace route |
| `backend/tests/test_workspace.py` | Create — tests |
| `backend/migrations/versions/003_create_tenants.py` | Create — Alembic migration for tenants table |
| `backend/app/models/__init__.py` | Modify — export Tenant |
| `backend/app/main.py` | Modify — register workspace router |

## Tenant Model (`backend/app/models/tenant.py`)

```
id          UUID        primary key, auto-generated
name        Text        not null
domain      Text        not null
team_size   Text        nullable
residency   Text        not null, default "US"
created_at  TIMESTAMP   server default now()
```

## Migration (`003_create_tenants.py`)

Creates the `tenants` table. Sets `down_revision = None` so it runs as a base migration independent of 001 (which has FK references to `tenants.id`).

## Schemas (`backend/app/schemas/workspace.py`)

### WorkspaceCreate
```
name        str
domain      str
team_size   str | None = None
residency   Literal["US", "EU", "UK", "APAC"] = "US"
```

### WorkspaceResponse
```
tenant_id   UUID
name        str
domain      str
team_size   str | None
residency   str
created_at  datetime
```

## Endpoint

`POST /workspace` — public, no authentication required.

**Flow:**
1. Pydantic validates request body (invalid residency → 422 automatically)
2. Create `Tenant` row (auto-generate UUID as `id`)
3. Create `Organisation` row with `tenant_id = tenant.id`, `org_name = name`, `domain = domain`, `team_size = team_size`, `data_residency = residency`
4. Commit both in one transaction
5. Return `WorkspaceResponse`

**Response status:** 201 Created

**Error handling:**
- Invalid residency → 422 (Pydantic, automatic)
- Missing required fields → 422 (Pydantic, automatic)
- DB failure → 500 (unhandled)

## Tests (`backend/tests/test_workspace.py`)

| Test | What it checks |
|------|---------------|
| `test_create_workspace_returns_201` | Valid body → 201, response contains tenant_id, name, domain, residency |
| `test_create_workspace_invalid_residency` | residency="MARS" → 422 |
| `test_create_workspace_missing_required_fields` | missing name → 422 |
| `test_create_workspace_default_residency` | no residency in body → defaults to "US" |

Tests mock the DB session using `AsyncMock` — no real Postgres required.
