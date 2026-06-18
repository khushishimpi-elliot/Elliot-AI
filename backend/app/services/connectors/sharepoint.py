"""SharePoint connector via Microsoft Graph API."""
import httpx

from app.services.oauth import decrypt_token

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class SharePointConnector:
    """SharePoint connector using Microsoft Graph API OAuth tokens."""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def get_sites(self) -> list[dict]:
        """List all SharePoint sites the user has access to."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{GRAPH_BASE}/sites?search=*",
                headers=self.headers,
            )
            response.raise_for_status()
            sites = []
            for site in response.json().get("value", []):
                sites.append({
                    "id": site.get("id", ""),
                    "name": site.get("displayName", site.get("name", "")),
                    "url": site.get("webUrl", ""),
                    "description": site.get("description", ""),
                })
            return sites

    async def get_documents(self, site_id: str) -> list[dict]:
        """Get documents from a SharePoint site with full text content."""
        documents = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get drive items
            response = await client.get(
                f"{GRAPH_BASE}/sites/{site_id}/drive/root/children",
                headers=self.headers,
            )
            response.raise_for_status()
            items = response.json().get("value", [])

            for item in items:
                if item.get("file") is not None:
                    item_id = item.get("id", "")
                    name = item.get("name", "")
                    url = item.get("webUrl", "")
                    last_modified = item.get("lastModifiedDateTime", "")

                    # Try to get text content via download URL
                    content = ""
                    try:
                        download_url = item.get("@microsoft.graph.downloadUrl", "")
                        if download_url:
                            content_resp = await client.get(download_url)
                            if content_resp.status_code == 200:
                                content = content_resp.text[:10000]
                    except Exception:
                        content = ""

                    documents.append({
                        "id": item_id,
                        "name": name,
                        "content": content,
                        "url": url,
                        "last_modified": last_modified,
                    })

        return documents
