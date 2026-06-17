# GitHub Connector Design — Task 15

## Overview

GitHub connector mirroring the existing Bitbucket connector pattern. Adds OAuth token-based repo read, PR fetch, and a push webhook endpoint that verifies HMAC-SHA256 signatures and acknowledges receipt. Re-indexing on push is handled by task 26.

## Files

| File | Action |
|------|--------|
| `backend/app/services/connectors/github.py` | Create — GitHubConnector class |
| `backend/app/schemas/github.py` | Create — GitHub schemas |
| `backend/app/routers/github.py` | Create — GitHub routes |
| `backend/app/config.py` | Modify — add 3 GitHub settings |
| `backend/app/main.py` | Modify — register github router with prefix="/github" |
| `backend/tests/test_github_connector.py` | Create — 6 tests |

## GitHubConnector (`services/connectors/github.py`)

```python
class GitHubConnector:
    GITHUB_API_BASE = "https://api.github.com"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async def get_repositories(owner: str) -> list[dict]
    async def get_all_files(owner: str, repo: str) -> list[dict]
    async def get_pull_requests(owner: str, repo: str) -> list[dict]
```

File filtering: same `SUPPORTED_FILE_TYPES` and `SKIP_FOLDERS` as Bitbucket connector.

## Schemas (`schemas/github.py`)

```
GitHubRepo     — name, full_name, description, owner, is_private, default_branch
GitHubFile     — path, content
GitHubPR       — id, title, body, author, state, created_at, updated_at, head_branch, base_branch
GitHubWebhookResponse — status: str
GitHubIndexResponse   — status, message, files_indexed
```

## Routes (`routers/github.py`)

Registered in `main.py` with `prefix="/github"`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/{tenant_id}/repos` | List repos, query param `?owner=` |
| GET | `/{tenant_id}/repos/{owner}/{repo}/files` | Get all files |
| GET | `/{tenant_id}/repos/{owner}/{repo}/prs` | Get open PRs |
| POST | `/{tenant_id}/webhook` | Receive push webhook |

### Webhook verification

1. Read `X-Hub-Signature-256` header → 400 if missing
2. Compute `hmac.new(secret, raw_body, sha256).hexdigest()`
3. Compare with `sha256=<digest>` using `hmac.compare_digest()` → 400 if mismatch
4. Return 200 `{"status": "received"}` if valid

Webhook secret from `settings.github_webhook_secret`.

## Config additions (`config.py`)

```python
github_client_id: str = ""
github_client_secret: str = ""
github_webhook_secret: str = ""
```

## Tests (`tests/test_github_connector.py`)

| Test | What it checks |
|------|---------------|
| `test_get_repos_success` | Mocked GitHub API → 200 with repo list |
| `test_get_repos_connector_not_found` | No connector in DB → 404 |
| `test_get_prs_success` | Mocked GitHub API → 200 with PR list |
| `test_webhook_valid_signature` | Correct HMAC → 200 `{"status": "received"}` |
| `test_webhook_invalid_signature` | Wrong HMAC → 400 |
| `test_webhook_missing_signature` | No header → 400 |
