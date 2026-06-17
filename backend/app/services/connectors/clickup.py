import httpx

from app.services.oauth import decrypt_token

CLICKUP_API_BASE = "https://api.clickup.com/api/v2"


class ClickUpConnector:
    """ClickUp API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": self.access_token,
            "Content-Type": "application/json",
        }

    async def get_tasks(self, list_id: str) -> list[dict]:
        """Get all tasks in a ClickUp list"""
        tasks = []
        page = 0

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{CLICKUP_API_BASE}/list/{list_id}/task",
                    headers=self.headers,
                    params={"page": page, "include_closed": "true"},
                )
                response.raise_for_status()
                data = response.json()

                page_tasks = data.get("tasks", [])
                if not page_tasks:
                    break

                for task in page_tasks:
                    tasks.append(
                        {
                            "id": task.get("id"),
                            "name": task.get("name", ""),
                            "status": task.get("status", {}).get("status", ""),
                            "assignees": [
                                a.get("username", "") for a in task.get("assignees", [])
                            ],
                            "due_date": task.get("due_date"),
                            "priority": (
                                task.get("priority", {}).get("priority")
                                if task.get("priority")
                                else None
                            ),
                            "list_name": task.get("list", {}).get("name", ""),
                            "url": task.get("url", ""),
                        }
                    )

                if data.get("last_page", False):
                    break
                page += 1

        return tasks

    async def get_task(self, task_id: str) -> dict:
        """Get a single ClickUp task by ID"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CLICKUP_API_BASE}/task/{task_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            task = response.json()
            return {
                "id": task.get("id"),
                "name": task.get("name", ""),
                "status": task.get("status", {}).get("status", ""),
                "assignees": [
                    a.get("username", "") for a in task.get("assignees", [])
                ],
                "due_date": task.get("due_date"),
                "priority": (
                    task.get("priority", {}).get("priority")
                    if task.get("priority")
                    else None
                ),
                "list_name": task.get("list", {}).get("name", ""),
                "url": task.get("url", ""),
            }

    async def get_task_comments(self, task_id: str) -> list[dict]:
        """Get all comments on a ClickUp task"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CLICKUP_API_BASE}/task/{task_id}/comment",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
            comments = []
            for comment in data.get("comments", []):
                comments.append(
                    {
                        "id": str(comment.get("id")),
                        "comment_text": comment.get("comment_text", ""),
                        "author": comment.get("user", {}).get("username", ""),
                        "date": str(comment.get("date", "")),
                    }
                )
            return comments
