import httpx

from app.services.oauth import decrypt_token

GITHUB_API_BASE = "https://api.github.com"
SUPPORTED_FILE_TYPES = {".py", ".ts", ".js", ".go", ".java", ".rs"}
SKIP_FOLDERS = {"node_modules", ".git", "__pycache__", "dist", "build", ".venv", "venv"}


class GitHubConnector:
    """GitHub API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str):
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def get_repositories(self, owner: str) -> list[dict]:
        """Get all repositories for a user or organisation"""
        repos = []
        page = 1

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{owner}/repos",
                    headers=self.headers,
                    params={"page": page, "per_page": 100, "type": "all"},
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    break

                for repo in data:
                    repos.append(
                        {
                            "name": repo.get("name"),
                            "full_name": repo.get("full_name"),
                            "description": repo.get("description"),
                            "owner": repo.get("owner", {}).get("login"),
                            "is_private": repo.get("private", False),
                            "default_branch": repo.get("default_branch", "main"),
                        }
                    )

                if len(data) < 100:
                    break
                page += 1

        return repos

    async def get_file_content(self, owner: str, repo: str, path: str) -> str:
        """Get raw file content from repository"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}",
                headers={**self.headers, "Accept": "application/vnd.github.raw+json"},
            )
            response.raise_for_status()
            return response.text

    async def get_all_files(self, owner: str, repo: str) -> list[dict]:
        """Get all files in repository filtered by type and skip folders"""
        files = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/HEAD",
                headers=self.headers,
                params={"recursive": "1"},
            )
            response.raise_for_status()
            data = response.json()

            for item in data.get("tree", []):
                if item.get("type") != "blob":
                    continue

                path = item.get("path", "")

                if any(folder in path.split("/") for folder in SKIP_FOLDERS):
                    continue

                if not any(path.endswith(ext) for ext in SUPPORTED_FILE_TYPES):
                    continue

                try:
                    content = await self.get_file_content(owner, repo, path)
                    files.append({"path": path, "content": content})
                except httpx.HTTPStatusError:
                    continue

        return files

    async def get_pull_requests(self, owner: str, repo: str) -> list[dict]:
        """Get open pull requests for a repository"""
        prs = []
        page = 1

        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls",
                    headers=self.headers,
                    params={"state": "open", "page": page, "per_page": 100},
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    break

                for pr in data:
                    prs.append(
                        {
                            "id": pr.get("number"),
                            "title": pr.get("title"),
                            "body": pr.get("body"),
                            "author": pr.get("user", {}).get("login"),
                            "state": pr.get("state"),
                            "created_at": pr.get("created_at"),
                            "updated_at": pr.get("updated_at"),
                            "head_branch": pr.get("head", {}).get("ref"),
                            "base_branch": pr.get("base", {}).get("ref"),
                        }
                    )

                if len(data) < 100:
                    break
                page += 1

        return prs
