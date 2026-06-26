"""Confluence connector via Atlassian Cloud REST API."""
import httpx

from app.services.oauth import decrypt_token


class ConfluenceConnector:
    """Confluence API connector using OAuth access tokens."""

    def __init__(self, encrypted_token: str, cloud_id: str):
        self.access_token = decrypt_token(encrypted_token)
        self.cloud_id = cloud_id
        self.base_url = (
            f"https://api.atlassian.com/ex/confluence/{cloud_id}/rest/api"
        )
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def get_spaces(self) -> list[dict]:
        """List all Confluence spaces."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/space",
                headers=self.headers,
                params={"limit": 50, "type": "global"},
            )
            response.raise_for_status()
            spaces = []
            for space in response.json().get("results", []):
                spaces.append({
                    "key": space.get("key", ""),
                    "name": space.get("name", ""),
                    "description": (
                        space.get("description", {})
                        .get("plain", {})
                        .get("value", "")
                    ),
                    "url": (
                        f"https://api.atlassian.com/ex/confluence/{self.cloud_id}"
                        + space.get("_links", {}).get("webui", "")
                    ),
                })
            return spaces

    async def get_pages(self, space_key: str) -> list[dict]:
        """Get all pages in a Confluence space with full text content."""
        pages = []
        start = 0
        limit = 25

        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                response = await client.get(
                    f"{self.base_url}/content",
                    headers=self.headers,
                    params={
                        "spaceKey": space_key,
                        "type": "page",
                        "expand": "body.storage,version",
                        "start": start,
                        "limit": limit,
                    },
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])

                if not results:
                    break

                for page in results:
                    body = (
                        page.get("body", {})
                        .get("storage", {})
                        .get("value", "")
                    )
                    # Strip basic HTML tags for plain text
                    import re
                    content = re.sub(r"<[^>]+>", " ", body)
                    content = re.sub(r"\s+", " ", content).strip()[:10000]

                    pages.append({
                        "id": page.get("id", ""),
                        "title": page.get("title", ""),
                        "content": content,
                        "space_key": space_key,
                        "url": (
                            f"https://api.atlassian.com/ex/confluence/{self.cloud_id}"
                            + page.get("_links", {}).get("webui", "")
                        ),
                        "last_modified": (
                            page.get("version", {}).get("when", "")
                        ),
                    })

                total = data.get("size", 0)
                start += limit
                if start >= total:
                    break

        return pages
