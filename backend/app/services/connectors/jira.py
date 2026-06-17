import httpx

from app.services.oauth import decrypt_token

JIRA_API_BASE = "https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"


class JiraConnector:
    """Jira Cloud API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str, cloud_id: str):
        self.access_token = decrypt_token(encrypted_token)
        self.cloud_id = cloud_id
        self.base_url = JIRA_API_BASE.format(cloud_id=cloud_id)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def search_issues(self, jql: str) -> list[dict]:
        """Search Jira issues using JQL"""
        issues = []
        start_at = 0
        max_results = 100

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    params={
                        "jql": jql,
                        "startAt": start_at,
                        "maxResults": max_results,
                        "fields": (
                            "summary,description,status,assignee,"
                            "priority,issuetype,created,updated"
                        ),
                    },
                )
                response.raise_for_status()
                data = response.json()

                for issue in data.get("issues", []):
                    fields = issue.get("fields", {})
                    issues.append(
                        {
                            "key": issue.get("key"),
                            "summary": fields.get("summary", ""),
                            "description": fields.get("description"),
                            "status": fields.get("status", {}).get("name", ""),
                            "assignee": (
                                fields.get("assignee", {}).get("displayName")
                                if fields.get("assignee")
                                else None
                            ),
                            "priority": (
                                fields.get("priority", {}).get("name")
                                if fields.get("priority")
                                else None
                            ),
                            "issue_type": fields.get("issuetype", {}).get("name", ""),
                            "created": fields.get("created", ""),
                            "updated": fields.get("updated", ""),
                        }
                    )

                total = data.get("total", 0)
                start_at += max_results
                if start_at >= total:
                    break

        return issues

    async def get_issue(self, issue_key: str) -> dict:
        """Get a single Jira issue by key"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/issue/{issue_key}",
                headers=self.headers,
                params={
                    "fields": (
                        "summary,description,status,assignee,"
                        "priority,issuetype,created,updated"
                    )
                },
            )
            response.raise_for_status()
            issue = response.json()
            fields = issue.get("fields", {})
            return {
                "key": issue.get("key"),
                "summary": fields.get("summary", ""),
                "description": fields.get("description"),
                "status": fields.get("status", {}).get("name", ""),
                "assignee": (
                    fields.get("assignee", {}).get("displayName")
                    if fields.get("assignee")
                    else None
                ),
                "priority": (
                    fields.get("priority", {}).get("name")
                    if fields.get("priority")
                    else None
                ),
                "issue_type": fields.get("issuetype", {}).get("name", ""),
                "created": fields.get("created", ""),
                "updated": fields.get("updated", ""),
            }

    async def get_issue_status(self, issue_key: str) -> str:
        """Get just the status of a Jira issue"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/issue/{issue_key}",
                headers=self.headers,
                params={"fields": "status"},
            )
            response.raise_for_status()
            issue = response.json()
            return issue.get("fields", {}).get("status", {}).get("name", "")
