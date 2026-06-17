"""Linear API connector (GraphQL).

Linear is GraphQL-only. We hand-write small queries rather than pull in a
GraphQL client library. Auth is a Bearer token from OAuth.
Docs: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
"""
import httpx

from app.services.oauth import decrypt_token

LINEAR_API_URL = "https://api.linear.app/graphql"

_LIST_TEAMS_QUERY = """
query {
  teams(first: 100) {
    nodes { id key name }
  }
}
"""

_LIST_ISSUES_QUERY = """
query ListIssues($first: Int!, $filter: IssueFilter, $after: String) {
  issues(first: $first, filter: $filter, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      identifier
      title
      description
      url
      priority
      createdAt
      updatedAt
      state { name }
      assignee { name email }
      team { key }
    }
  }
}
"""

_GET_ISSUE_QUERY = """
query GetIssue($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    url
    priority
    createdAt
    updatedAt
    state { name }
    assignee { name email }
    team { key }
  }
}
"""


class LinearAPIError(Exception):
    pass


class LinearConnector:
    """Linear GraphQL connector using an OAuth bearer token."""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def _post(self, query: str, variables: dict | None = None) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                LINEAR_API_URL,
                headers=self.headers,
                json={"query": query, "variables": variables or {}},
            )
            resp.raise_for_status()
            body = resp.json()
        if "errors" in body and body["errors"]:
            raise LinearAPIError(body["errors"][0].get("message", "unknown linear error"))
        return body["data"]

    async def get_teams(self) -> list[dict]:
        data = await self._post(_LIST_TEAMS_QUERY)
        return [
            {"id": t["id"], "key": t["key"], "name": t["name"]}
            for t in data["teams"]["nodes"]
        ]

    async def list_issues(
        self,
        *,
        team_key: str | None = None,
        state: str | None = None,
        assignee_email: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """Return issues, optionally filtered. Paginates until `limit` reached
        or no more pages."""
        filter_clauses: dict = {}
        if team_key:
            filter_clauses["team"] = {"key": {"eq": team_key}}
        if state:
            filter_clauses["state"] = {"name": {"eq": state}}
        if assignee_email:
            filter_clauses["assignee"] = {"email": {"eq": assignee_email}}

        collected: list[dict] = []
        cursor: str | None = None
        page_size = min(50, limit)

        while True:
            data = await self._post(
                _LIST_ISSUES_QUERY,
                variables={
                    "first": page_size,
                    "filter": filter_clauses or None,
                    "after": cursor,
                },
            )
            page = data["issues"]
            for node in page["nodes"]:
                collected.append(self._normalize_issue(node))
                if len(collected) >= limit:
                    return collected
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return collected

    async def get_issue(self, issue_id: str) -> dict | None:
        data = await self._post(_GET_ISSUE_QUERY, variables={"id": issue_id})
        node = data.get("issue")
        return self._normalize_issue(node) if node else None

    @staticmethod
    def _normalize_issue(node: dict) -> dict:
        assignee = node.get("assignee")
        return {
            "id": node["id"],
            "identifier": node["identifier"],
            "title": node["title"],
            "description": node.get("description"),
            "url": node["url"],
            "priority": node.get("priority", 0),
            "state": (node.get("state") or {}).get("name", "Unknown"),
            "assignee": assignee.get("name") if assignee else None,
            "team_key": (node.get("team") or {}).get("key", ""),
            "created_at": node["createdAt"],
            "updated_at": node["updatedAt"],
        }
