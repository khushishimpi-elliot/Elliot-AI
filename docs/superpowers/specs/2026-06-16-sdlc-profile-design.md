# SDLC Profile CRUD Endpoints Design — Task 12

## Overview

The SDLC profile model, schemas, and 3 routes (POST, GET, PUT) already exist. This task adds the missing DELETE endpoint and full test coverage for all 4 CRUD operations.

## Files

| File | Action |
|------|--------|
| `backend/app/routers/sdlc.py` | Modify — add DELETE /sdlc/{tenant_id} |
| `backend/tests/test_sdlc.py` | Create — 6 tests covering all 4 CRUD operations |

## Existing routes (no changes needed)

- `POST /sdlc` — create profile for a tenant
- `GET /sdlc/{tenant_id}` — get profile, 404 if not found
- `PUT /sdlc/{tenant_id}` — partial update, 404 if not found

## New route

### `DELETE /sdlc/{tenant_id}`

1. Query `SDLCProfile` by `tenant_id`
2. Return 404 if not found
3. Delete the record
4. Commit
5. Return 204 No Content

## Tests (`backend/tests/test_sdlc.py`)

All tests mock the async DB session via FastAPI dependency override.

| Test | What it checks |
|------|---------------|
| `test_create_sdlc_profile` | POST with valid body → 200, response has tenant_id and stack |
| `test_get_sdlc_profile` | GET with mocked DB returning profile → 200 |
| `test_get_sdlc_profile_not_found` | GET when DB returns None → 404 |
| `test_update_sdlc_profile` | PUT with partial update → 200, updated fields reflected |
| `test_delete_sdlc_profile` | DELETE → 204 |
| `test_delete_sdlc_profile_not_found` | DELETE when no profile → 404 |
