# CI Pipeline Design — Task 03

## Overview

GitHub Actions CI that runs on every PR and push to `main`/`dev`. Three parallel jobs — one per monorepo package — covering lint, test, and build.

## Triggers

```yaml
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
```

## Jobs

### backend

| Step | Command |
|------|---------|
| Install | `pip install -e ".[dev]"` |
| Lint | `ruff check .` |
| Test | `pytest -q` |

Python 3.11, pip cache enabled. Working directory: `backend/`.

### terminal

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Lint | `npm run lint` (ESLint via `eslint.config.js`) |
| Test | `npm run test` → `vitest run --passWithNoTests` |
| Build | `npm run build` |

Node 20, npm cache enabled. Working directory: `terminal/`.

### dashboard

Identical to `terminal`, working directory: `dashboard/`.

## ESLint Config

A minimal `eslint.config.js` will be added to both `terminal/` and `dashboard/`. It applies `@eslint/js` recommended rules to all `.ts`/`.tsx` files in `src/`.

## Files Changed

- `.github/workflows/ci.yml` — add lint + test steps to terminal and dashboard jobs; fix `npm ci || npm install` → `npm ci`
- `terminal/eslint.config.js` — new minimal config
- `dashboard/eslint.config.js` — new minimal config
- `terminal/package.json` — update `test` script to include `--passWithNoTests`
- `dashboard/package.json` — update `test` script to include `--passWithNoTests`

## Success Criteria

- CI passes on an empty PR with no test files
- Any future test file in `terminal/` or `dashboard/` is automatically picked up
- A lint error in any package causes CI to fail that job
- All three jobs run in parallel
