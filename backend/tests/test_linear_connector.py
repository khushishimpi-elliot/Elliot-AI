"""Unit tests for the Linear GraphQL connector. Mocks httpx."""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.connectors.linear import LinearAPIError, LinearConnector


@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setattr(
        "app.services.connectors.linear.decrypt_token", lambda _enc: "linear-token"
    )
    return LinearConnector(encrypted_token="encrypted-blob")


class _Resp:
    def __init__(self, json_body):
        self._json = json_body
        self.status_code = 200

    def raise_for_status(self):
        pass

    def json(self):
        return self._json


def _patch_post(side_effects):
    client_mock = AsyncMock()
    if callable(side_effects):
        client_mock.post.side_effect = side_effects
    else:
        client_mock.post.side_effect = side_effects
    cm = AsyncMock()
    cm.__aenter__.return_value = client_mock
    cm.__aexit__.return_value = False
    return patch(
        "app.services.connectors.linear.httpx.AsyncClient", return_value=cm
    )


# ---- teams ---------------------------------------------------------------


async def test_get_teams_maps_fields(connector):
    body = {
        "data": {
            "teams": {
                "nodes": [
                    {"id": "team-1", "key": "ENG", "name": "Engineering"},
                    {"id": "team-2", "key": "DESIGN", "name": "Design"},
                ]
            }
        }
    }
    with _patch_post([_Resp(body)]):
        teams = await connector.get_teams()

    assert teams == [
        {"id": "team-1", "key": "ENG", "name": "Engineering"},
        {"id": "team-2", "key": "DESIGN", "name": "Design"},
    ]


async def test_raises_linear_error_on_graphql_errors(connector):
    body = {"data": None, "errors": [{"message": "auth failed"}]}
    with _patch_post([_Resp(body)]):
        with pytest.raises(LinearAPIError, match="auth failed"):
            await connector.get_teams()


# ---- issues --------------------------------------------------------------


def _issue_node(**overrides):
    base = {
        "id": "issue-1",
        "identifier": "ENG-7",
        "title": "Ship Linear connector",
        "description": "task #19",
        "url": "https://linear.app/x/issue/ENG-7",
        "priority": 2,
        "createdAt": "2026-06-15T00:00:00Z",
        "updatedAt": "2026-06-15T01:00:00Z",
        "state": {"name": "In Progress"},
        "assignee": {"name": "Khushi Shimpi", "email": "khushi@elliotsystems.com"},
        "team": {"key": "ENG"},
    }
    base.update(overrides)
    return base


async def test_list_issues_normalizes_nested_fields(connector):
    body = {
        "data": {
            "issues": {
                "pageInfo": {"hasNextPage": False, "endCursor": None},
                "nodes": [_issue_node()],
            }
        }
    }
    with _patch_post([_Resp(body)]):
        issues = await connector.list_issues()

    assert len(issues) == 1
    issue = issues[0]
    assert issue["identifier"] == "ENG-7"
    assert issue["state"] == "In Progress"
    assert issue["assignee"] == "Khushi Shimpi"
    assert issue["team_key"] == "ENG"


async def test_list_issues_paginates_until_limit(connector):
    page1 = {
        "data": {
            "issues": {
                "pageInfo": {"hasNextPage": True, "endCursor": "cursor-1"},
                "nodes": [_issue_node(id=f"i{i}", identifier=f"ENG-{i}") for i in range(50)],
            }
        }
    }
    page2 = {
        "data": {
            "issues": {
                "pageInfo": {"hasNextPage": False, "endCursor": None},
                "nodes": [_issue_node(id="i50", identifier="ENG-50")],
            }
        }
    }
    with _patch_post([_Resp(page1), _Resp(page2)]):
        issues = await connector.list_issues(limit=75)

    assert len(issues) == 51


async def test_list_issues_respects_limit_mid_page(connector):
    nodes = [_issue_node(id=f"i{i}", identifier=f"ENG-{i}") for i in range(50)]
    body = {
        "data": {
            "issues": {
                "pageInfo": {"hasNextPage": True, "endCursor": "x"},
                "nodes": nodes,
            }
        }
    }
    with _patch_post([_Resp(body)]):
        issues = await connector.list_issues(limit=10)

    assert len(issues) == 10


async def test_list_issues_handles_missing_assignee(connector):
    body = {
        "data": {
            "issues": {
                "pageInfo": {"hasNextPage": False, "endCursor": None},
                "nodes": [_issue_node(assignee=None)],
            }
        }
    }
    with _patch_post([_Resp(body)]):
        issues = await connector.list_issues()

    assert issues[0]["assignee"] is None


# ---- get single issue ---------------------------------------------------


async def test_get_issue_returns_none_when_missing(connector):
    body = {"data": {"issue": None}}
    with _patch_post([_Resp(body)]):
        issue = await connector.get_issue("nonexistent")
    assert issue is None


async def test_get_issue_returns_normalized_node(connector):
    body = {"data": {"issue": _issue_node()}}
    with _patch_post([_Resp(body)]):
        issue = await connector.get_issue("issue-1")
    assert issue is not None
    assert issue["identifier"] == "ENG-7"
    assert issue["assignee"] == "Khushi Shimpi"
