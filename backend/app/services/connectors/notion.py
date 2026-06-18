"""Notion connector — fetches pages and databases via Notion API."""
import httpx

from app.services.oauth import decrypt_token

NOTION_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionConnector:
    """Notion API connector using OAuth access tokens."""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }

    def _extract_text(self, blocks: list) -> str:
        """Extract plain text from Notion block objects."""
        TEXT_BLOCK_TYPES = {
            "paragraph", "heading_1", "heading_2", "heading_3",
            "bulleted_list_item", "numbered_list_item", "toggle",
            "quote", "callout", "code",
        }
        lines = []
        for block in blocks:
            block_type = block.get("type", "")
            if block_type in TEXT_BLOCK_TYPES:
                rich_text = block.get(block_type, {}).get("rich_text", [])
                text = "".join(rt.get("plain_text", "") for rt in rich_text)
                if text.strip():
                    lines.append(text.strip())
        return "\n".join(lines)

    async def get_pages(self, query: str = "") -> list[dict]:
        """Search Notion pages and return title + full text content."""
        pages = []
        payload: dict = {"filter": {"value": "page", "property": "object"}}
        if query:
            payload["query"] = query

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{NOTION_BASE}/search",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            results = response.json().get("results", [])

            for page in results:
                page_id = page.get("id", "")
                title = ""
                props = page.get("properties", {})
                for prop in props.values():
                    if prop.get("type") == "title":
                        title_parts = prop.get("title", [])
                        title = "".join(t.get("plain_text", "") for t in title_parts)
                        break

                blocks_resp = await client.get(
                    f"{NOTION_BASE}/blocks/{page_id}/children",
                    headers=self.headers,
                )
                blocks_resp.raise_for_status()
                blocks = blocks_resp.json().get("results", [])
                content = self._extract_text(blocks)

                pages.append({
                    "id": page_id,
                    "title": title or "Untitled",
                    "content": content,
                    "url": page.get("url", ""),
                    "last_edited": page.get("last_edited_time", ""),
                })

        return pages

    async def get_databases(self) -> list[dict]:
        """List Notion databases and their entries."""
        databases = []
        payload = {"filter": {"value": "database", "property": "object"}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{NOTION_BASE}/search",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            results = response.json().get("results", [])

            for db in results:
                db_id = db.get("id", "")
                title_parts = db.get("title", [])
                title = "".join(t.get("plain_text", "") for t in title_parts)

                query_resp = await client.post(
                    f"{NOTION_BASE}/databases/{db_id}/query",
                    headers=self.headers,
                    json={},
                )
                query_resp.raise_for_status()
                entries = query_resp.json().get("results", [])

                databases.append({
                    "id": db_id,
                    "title": title or "Untitled",
                    "entries": entries,
                    "url": db.get("url", ""),
                })

        return databases
