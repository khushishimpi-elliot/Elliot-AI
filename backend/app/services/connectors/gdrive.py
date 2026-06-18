"""Google Drive connector via Drive API v3."""
import httpx

from app.services.oauth import decrypt_token

DRIVE_BASE = "https://www.googleapis.com/drive/v3"

# MIME types we can extract text from
EXPORTABLE_TYPES = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}


class GDriveConnector:
    """Google Drive connector using OAuth access tokens."""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {"Authorization": f"Bearer {self.access_token}"}

    async def get_files(self, query: str = "") -> list[dict]:
        """List files in Google Drive with optional search query."""
        files = []
        params = {
            "pageSize": 100,
            "fields": "files(id,name,mimeType,webViewLink,modifiedTime)",
        }
        if query:
            params["q"] = f"name contains '{query}' and trashed=false"
        else:
            params["q"] = "trashed=false"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{DRIVE_BASE}/files",
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            items = response.json().get("files", [])

            for item in items:
                file_id = item.get("id", "")
                mime_type = item.get("mimeType", "")
                content = await self._get_content(client, file_id, mime_type)
                files.append({
                    "id": file_id,
                    "name": item.get("name", ""),
                    "mime_type": mime_type,
                    "content": content,
                    "url": item.get("webViewLink", ""),
                    "modified_at": item.get("modifiedTime", ""),
                })

        return files

    async def get_file(self, file_id: str) -> dict:
        """Get a single file with full content."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{DRIVE_BASE}/files/{file_id}",
                headers=self.headers,
                params={"fields": "id,name,mimeType,webViewLink,modifiedTime"},
            )
            response.raise_for_status()
            item = response.json()
            mime_type = item.get("mimeType", "")
            content = await self._get_content(client, file_id, mime_type)
            return {
                "id": file_id,
                "name": item.get("name", ""),
                "mime_type": mime_type,
                "content": content,
                "url": item.get("webViewLink", ""),
                "modified_at": item.get("modifiedTime", ""),
            }

    async def _get_content(
        self, client: httpx.AsyncClient, file_id: str, mime_type: str
    ) -> str:
        """Download and return text content from a Drive file."""
        try:
            if mime_type in EXPORTABLE_TYPES:
                export_mime = EXPORTABLE_TYPES[mime_type]
                response = await client.get(
                    f"{DRIVE_BASE}/files/{file_id}/export",
                    headers=self.headers,
                    params={"mimeType": export_mime},
                )
                response.raise_for_status()
                return response.text[:10000]
            elif not mime_type.startswith("application/vnd.google-apps"):
                response = await client.get(
                    f"{DRIVE_BASE}/files/{file_id}",
                    headers=self.headers,
                    params={"alt": "media"},
                )
                response.raise_for_status()
                return response.text[:10000]
        except Exception:
            return ""
        return ""
