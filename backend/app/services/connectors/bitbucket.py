import httpx

from app.services.oauth import decrypt_token

BITBUCKET_API_BASE = "https://api.bitbucket.org/2.0"
SUPPORTED_FILE_TYPES = {".py", ".ts", ".js", ".go", ".java", ".rs"}
SKIP_FOLDERS = {"node_modules", ".git", "__pycache__", "dist", "build", ".venv", "venv"}


class BitbucketConnector:
    """Bitbucket API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str):
        """Initialize with encrypted access token"""
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    async def get_workspace_info(self, workspace: str) -> dict:
        """Get workspace information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BITBUCKET_API_BASE}/workspaces/{workspace}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
            return {
                "name": data.get("name"),
                "slug": data.get("slug"),
                "uuid": data.get("uuid"),
            }

    async def get_repositories(self, workspace: str) -> list[dict]:
        """Get all repositories in a workspace"""
        repos = []
        page = 1
        pagelen = 50

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{BITBUCKET_API_BASE}/repositories/{workspace}",
                    headers=self.headers,
                    params={"page": page, "pagelen": pagelen},
                )
                response.raise_for_status()
                data = response.json()

                for repo in data.get("values", []):
                    repos.append(
                        {
                            "name": repo.get("name"),
                            "slug": repo.get("slug"),
                            "description": repo.get("description", ""),
                            "workspace": workspace,
                            "is_private": repo.get("is_private", False),
                            "links": repo.get("links", {}),
                        }
                    )

                if not data.get("next"):
                    break
                page += 1

        return repos

    async def get_file_content(
        self, workspace: str, repo_slug: str, filepath: str
    ) -> str:
        """Get raw file content from repository"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BITBUCKET_API_BASE}/repositories/{workspace}/{repo_slug}/src/HEAD/{filepath}",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.text

    async def get_all_files(
        self, workspace: str, repo_slug: str
    ) -> list[dict]:
        """Get all files in repository (filtered by type and folders)"""
        files = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BITBUCKET_API_BASE}/repositories/{workspace}/{repo_slug}/src/HEAD",
                headers=self.headers,
                params={"pagelen": 100},
            )
            response.raise_for_status()
            data = response.json()

            for item in data.get("values", []):
                if item.get("type") == "commit_file":
                    path = item.get("path", "")

                    # Skip if in excluded folders
                    if any(folder in path.split("/") for folder in SKIP_FOLDERS):
                        continue

                    # Skip if not a supported file type
                    if not any(path.endswith(ext) for ext in SUPPORTED_FILE_TYPES):
                        continue

                    try:
                        content = await self.get_file_content(
                            workspace, repo_slug, path
                        )
                        files.append({"path": path, "content": content})
                    except httpx.HTTPStatusError:
                        continue

        return files

    async def get_pull_requests(
        self, workspace: str, repo_slug: str
    ) -> list[dict]:
        """Get open pull requests"""
        prs = []
        page = 1
        pagelen = 50

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{BITBUCKET_API_BASE}/repositories/{workspace}/{repo_slug}/pullrequests",
                    headers=self.headers,
                    params={
                        "state": "OPEN",
                        "page": page,
                        "pagelen": pagelen,
                    },
                )
                response.raise_for_status()
                data = response.json()

                for pr in data.get("values", []):
                    prs.append(
                        {
                            "id": pr.get("id"),
                            "title": pr.get("title"),
                            "description": pr.get("description", ""),
                            "author": pr.get("author", {}).get("display_name", ""),
                            "state": pr.get("state"),
                            "created_on": pr.get("created_on"),
                            "updated_on": pr.get("updated_on"),
                            "source_branch": pr.get("source", {}).get("branch", {}).get("name"),
                            "dest_branch": pr.get("destination", {}).get("branch", {}).get("name"),
                        }
                    )

                if not data.get("next"):
                    break
                page += 1

        return prs
