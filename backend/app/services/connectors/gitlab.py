"""GitLab API connector.

Uses the OAuth access token stored on the Connector row (encrypted).
Mirrors the Bitbucket connector pattern.

GitLab REST API v4: https://docs.gitlab.com/ee/api/
- List projects: GET /api/v4/projects?membership=true
- Repo tree:    GET /api/v4/projects/:id/repository/tree?recursive=true&ref=:branch
- File raw:     GET /api/v4/projects/:id/repository/files/:url-encoded-path/raw?ref=:branch
- MRs:          GET /api/v4/projects/:id/merge_requests?state=opened
"""
from urllib.parse import quote

import httpx

from app.services.oauth import decrypt_token

GITLAB_API_BASE = "https://gitlab.com/api/v4"
SUPPORTED_FILE_TYPES = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".java", ".rs", ".rb"}
SKIP_FOLDERS = {
    "node_modules", ".git", "__pycache__", "dist", "build", ".venv", "venv", "target",
}
MAX_FILE_BYTES = 500_000  # skip files larger than 500 KB


class GitLabConnector:
    """GitLab API connector using OAuth tokens."""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def get_projects(self) -> list[dict]:
        """Return projects the authenticated user is a member of."""
        projects: list[dict] = []
        page = 1
        per_page = 50

        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                resp = await client.get(
                    f"{GITLAB_API_BASE}/projects",
                    headers=self.headers,
                    params={
                        "membership": "true",
                        "per_page": per_page,
                        "page": page,
                        "order_by": "last_activity_at",
                    },
                )
                resp.raise_for_status()
                batch = resp.json()
                if not batch:
                    break
                projects.extend(batch)
                if len(batch) < per_page:
                    break
                page += 1

        return [
            {
                "id": p["id"],
                "name": p["name"],
                "path_with_namespace": p["path_with_namespace"],
                "description": p.get("description"),
                "default_branch": p.get("default_branch"),
                "visibility": p["visibility"],
                "web_url": p["web_url"],
            }
            for p in projects
        ]

    async def get_repository_tree(
        self, project_id: int, ref: str | None = None
    ) -> list[dict]:
        """Return a recursive tree of files for a project."""
        params: dict = {"recursive": "true", "per_page": 100}
        if ref:
            params["ref"] = ref

        entries: list[dict] = []
        page = 1
        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                resp = await client.get(
                    f"{GITLAB_API_BASE}/projects/{project_id}/repository/tree",
                    headers=self.headers,
                    params={**params, "page": page},
                )
                resp.raise_for_status()
                batch = resp.json()
                if not batch:
                    break
                entries.extend(batch)
                if len(batch) < params["per_page"]:
                    break
                page += 1
        return entries

    async def get_file_content(
        self, project_id: int, file_path: str, ref: str = "main"
    ) -> str:
        """Fetch raw file content. Returns empty string if the file is too large
        or non-text."""
        encoded = quote(file_path, safe="")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GITLAB_API_BASE}/projects/{project_id}/repository/files/{encoded}/raw",
                headers=self.headers,
                params={"ref": ref},
            )
            if resp.status_code == 404:
                return ""
            resp.raise_for_status()
            content_length = int(resp.headers.get("content-length") or 0)
            if content_length > MAX_FILE_BYTES:
                return ""
            try:
                return resp.text
            except UnicodeDecodeError:
                return ""

    async def get_all_files(
        self, project_id: int, ref: str | None = None
    ) -> list[dict]:
        """Walk the repo tree and return [{path, content}] for supported file
        types only, skipping junk folders + oversized files."""
        tree = await self.get_repository_tree(project_id, ref)

        if ref is None:
            # Fetch default branch from the project record.
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    f"{GITLAB_API_BASE}/projects/{project_id}",
                    headers=self.headers,
                )
                resp.raise_for_status()
                ref = resp.json().get("default_branch") or "main"

        files: list[dict] = []
        for entry in tree:
            if entry.get("type") != "blob":
                continue
            path = entry["path"]
            if any(skip in path.split("/") for skip in SKIP_FOLDERS):
                continue
            if not any(path.endswith(ext) for ext in SUPPORTED_FILE_TYPES):
                continue
            content = await self.get_file_content(project_id, path, ref)
            if content:
                files.append({"path": path, "content": content})
        return files

    async def get_merge_requests(
        self, project_id: int, state: str = "opened"
    ) -> list[dict]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GITLAB_API_BASE}/projects/{project_id}/merge_requests",
                headers=self.headers,
                params={"state": state, "per_page": 100},
            )
            resp.raise_for_status()
            data = resp.json()

        return [
            {
                "iid": mr["iid"],
                "title": mr["title"],
                "description": mr.get("description"),
                "author": mr["author"]["username"],
                "state": mr["state"],
                "created_at": mr["created_at"],
                "updated_at": mr["updated_at"],
                "source_branch": mr["source_branch"],
                "target_branch": mr["target_branch"],
                "web_url": mr["web_url"],
            }
            for mr in data
        ]
