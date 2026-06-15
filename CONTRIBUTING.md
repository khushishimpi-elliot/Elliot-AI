# Contributing to Elliot-AI

Conventions every contributor follows so the four of us don't drift.

## 1. Pick a task

All work comes from the ClickUp List `Elliot-AI v1.0`:
https://app.clickup.com/90161656698/v/li/901615378425

- Tasks are pre-assigned. Don't pick someone else's task without checking with them.
- When you start, move the task `to do` -> `in progress` in ClickUp.
- When the PR merges, move it -> `complete`.

## 2. Branch naming

`<phase>/<task-num>-<slug>`

Phases match the ClickUp tag on your task:
`setup`, `identity`, `workspace`, `sdlc`, `connectors`, `rag`, `launch`, `orchestration`, `terminal-ui`, `dashboard-ui`, `deploy`

Examples:
- `auth/04-magic-link`
- `connectors/21-clickup`
- `rag/22-pgvector-schema`

Branch off `main`. Don't branch off other people's feature branches unless coordinating.

## 3. Commit messages

Conventional commits, scoped:

```
<type>(<scope>): <subject> (ClickUp #<num>)

<body — what changed and why, in present tense>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.
Scopes: usually the module — `auth`, `rag`, `connectors`, `dashboard`, `terminal`, `db`, `ci`.

Example:
```
feat(auth): magic-link issuance + JWT redemption (ClickUp #04)

- POST /auth/magic-link: accept email, issue single-use token
- GET /auth/callback: redeem token, return JWT
- In-memory store (Postgres swap in #08)
```

## 4. Pull Requests

**Title** = ClickUp task name (e.g. `04. Magic-link email auth`).

**Body must include:**
- Link to the ClickUp task
- What this PR does (3-5 bullets)
- What's intentionally NOT in this PR (deferred to which task)
- Manual test instructions if not covered by automated tests

PR template:
```md
ClickUp: https://app.clickup.com/t/<task-id>

## What
- ...
- ...

## Not in this PR
- <thing> deferred to task #N

## Test plan
- [ ] `cd backend && pytest -q`
- [ ] manual: <how to verify in browser / curl>
```

## 5. Code review

- At least 1 approval before merge. 2 if the PR touches `backend/app/orchestration/` or `backend/app/auth/` (security-sensitive).
- Reviewer runs the test plan locally — don't approve based on diff alone.
- Krishna's PRs: Khushi reviews first (mentorship). Anyone else can be the second reviewer.

## 6. Tests

- **Backend:** `pytest`. New endpoints need at least: happy path, validation failure, auth failure.
- **Frontend:** `vitest`. New components need at least: renders without crash, key interaction.
- CI runs on every PR. Don't merge if red.

## 7. Local dev

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate              # PowerShell: .venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cp .env.example .env                # fill in secrets
uvicorn app.main:app --reload       # http://localhost:8000

# Terminal UI
cd terminal && npm install && npm run dev    # http://localhost:5173

# Dashboard UI
cd dashboard && npm install && npm run dev   # http://localhost:5174
```

## 8. Secrets

- **Never commit `.env`.** Only `.env.example` (no real values).
- API tokens, DB URLs, SSO secrets go in 1Password / Bitwarden / Render env vars.
- If you accidentally commit a secret: rotate it immediately, then `git rm` + force-push.

## 9. Communication

- Daily 15-min standup: task number, blockers, next task.
- Block on something? Comment on the ClickUp task AND ping the relevant person.
- Don't merge a PR with unresolved review comments.

## 10. Module ownership (loose, not strict)

| Module | Primary maintainer |
|---|---|
| `backend/app/auth/` | Khushi |
| `backend/app/connectors/` | Astika |
| `backend/app/rag/` | Shrushti |
| `backend/app/orchestration/` | round-robin, decide on first PR |
| `terminal/` | Astika + Shrushti |
| `dashboard/` | Khushi (Krishna for simple tabs) |

Anyone can touch anything — primary means "ask them in review."
