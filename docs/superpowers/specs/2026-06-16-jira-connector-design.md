# Jira Connector Design — Task 18

## Overview

Jira connector mirroring the existing GitHub/Bitbucket connector pattern. Provides JQL ticket search, full issue fetch, and issue status fetch. `cloud_id` (Atlassian tenant identifier) is passed as a query parameter on each request — consistent with how Bitbucket passes `workspace`.

## Files

| File | Action |
|------|--------|
| `backend/app/services/connectors/jira.py` | Create — JiraConnector class |
| `backend/app/schemas/jira.py` | Create — JiraIssue, JiraStatus schemas |
| `backend/app/routers/jira.py` | Create — 3 routes |
| `backend/app/config.py` | Modify — add jira_client_id, jira_client_secret |
| `backend/app/main.py` | Modify — register jira router with prefix="/jira" |
| `backend/tests/test_jira_connector.py` | Create — 4 tests |

## JiraConnector (`services/connectors/jira.py`)

```
API base: https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3
Auth: Authorization: Bearer <token>

JiraConnector(encrypted_token: str, cloud_id: str)
  - search_issues(jql: str) → list[dict]
  - get_issue(issue_key: str) → dict
  - get_issue_status(issue_key: str) → str
```

## Schemas (`schemas/jira.py`)

```
JiraIssue:
  key: str
  summary: str
  description: str | None
  status: str
  assignee: str | None
  priority: str | None
  issue_type: str
  created: str
  updated: str

JiraStatus:
  key: str
  status: str
```

## Routes (`routers/jira.py`)

Registered with `prefix="/jira"`.

| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/{tenant_id}/search` | `cloud_id`, `jql` | Search issues by JQL |
| GET | `/{tenant_id}/issues/{issue_key}` | `cloud_id` | Get full issue |
| GET | `/{tenant_id}/issues/{issue_key}/status` | `cloud_id` | Get status only |

All routes fetch connector from DB (provider="jira", status="connected"), instantiate `JiraConnector(token, cloud_id)`, call the method, wrap errors as 400.

## Config additions

```python
jira_client_id: str = ""
jira_client_secret: str = ""
```

## Tests (`tests/test_jira_connector.py`)

| Test | What it checks |
|------|---------------|
| `test_search_issues_connector_not_found` | No connector in DB → 404 |
| `test_search_issues_success` | Mocked Jira API → 200 with issue list |
| `test_get_issue_success` | Mocked Jira API → 200 with full issue |
| `test_get_issue_status_success` | Mocked Jira API → 200 with status string |
