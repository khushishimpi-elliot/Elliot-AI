import hashlib
import hmac
import logging
from urllib.parse import quote

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.chunker import CodeChunker
from app.services.embedder import Embedder
from app.services.indexer import Indexer

logger = logging.getLogger(__name__)

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".zip",
    ".exe",
    ".bin",
    ".o",
    ".a",
    ".so",
    ".dylib",
}

SKIP_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    "dist",
    "build",
    ".venv",
    "venv",
}


class WebhookService:
    """GitHub webhook handler for real-time re-indexing"""

    def __init__(self):
        """Initialize webhook service"""
        self.chunker = CodeChunker()
        self.embedder = Embedder()
        self.indexer = Indexer()

    def verify_github_signature(
        self, payload: bytes, signature: str, secret: str
    ) -> bool:
        """Verify GitHub webhook signature using HMAC-SHA256"""
        if not secret:
            logger.warning("GITHUB_WEBHOOK_SECRET not configured")
            return False

        expected_signature = hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()

        provided_signature = signature.replace("sha256=", "")

        return hmac.compare_digest(expected_signature, provided_signature)

    def should_skip_file(self, filepath: str) -> bool:
        """Check if file should be skipped during indexing"""
        _, ext = filepath.lower().split(".", 1) if "." in filepath else ("", "")

        if f".{ext}" in BINARY_EXTENSIONS:
            return True

        for skip_dir in SKIP_DIRS:
            if skip_dir in filepath:
                return True

        return False

    def extract_changed_files(self, payload: dict) -> list[str]:
        """Extract all added and modified files from GitHub push payload"""
        changed_files = set()

        for commit in payload.get("commits", []):
            for filepath in commit.get("added", []):
                if not self.should_skip_file(filepath):
                    changed_files.add(filepath)

            for filepath in commit.get("modified", []):
                if not self.should_skip_file(filepath):
                    changed_files.add(filepath)

        return list(changed_files)

    def extract_removed_files(self, payload: dict) -> list[str]:
        """Extract all deleted files from GitHub push payload"""
        removed_files = set()

        for commit in payload.get("commits", []):
            for filepath in commit.get("removed", []):
                removed_files.add(filepath)

        return list(removed_files)

    async def get_file_content_from_github(
        self,
        repo_full_name: str,
        filepath: str,
        github_token: str,
    ) -> str | None:
        """Fetch file content from GitHub API"""
        try:
            encoded_path = quote(filepath, safe="")
            url = (
                f"https://api.github.com/repos/{repo_full_name}"
                f"/contents/{encoded_path}"
            )

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"token {github_token}",
                        "Accept": "application/vnd.github.v3.raw",
                    },
                    timeout=10,
                )

                if response.status_code == 404:
                    logger.warning(f"File not found: {filepath}")
                    return None

                if response.status_code != 200:
                    logger.error(
                        f"GitHub API error for {filepath}: "
                        f"{response.status_code}"
                    )
                    return None

                content = response.text
                if len(content) > 1_000_000:  # 1MB limit
                    logger.warning(
                        f"File too large, skipping: {filepath}"
                    )
                    return None

                return content

        except Exception as e:
            logger.error(
                f"Error fetching {filepath} from GitHub: {str(e)}"
            )
            return None

    async def process_push_event(
        self,
        db: AsyncSession,
        tenant_id: str,
        payload: dict,
        github_token: str,
    ) -> dict:
        """Process GitHub push event and re-index changed files"""
        repo_full_name = payload.get("repository", {}).get("full_name", "")
        pusher = payload.get("pusher", {}).get("name", "unknown")

        logger.info(
            f"Processing push event: repo={repo_full_name}, "
            f"pusher={pusher}"
        )

        changed_files = self.extract_changed_files(payload)
        removed_files = self.extract_removed_files(payload)

        files_updated = 0
        files_deleted = 0
        chunks_created = 0
        chunks_deleted = 0

        # Process removed files
        for filepath in removed_files:
            try:
                deleted = await self.indexer.delete_chunks_for_file(
                    db, tenant_id, filepath
                )
                chunks_deleted += deleted
                files_deleted += 1
                logger.info(f"Deleted {deleted} chunks for {filepath}")
            except Exception as e:
                logger.error(
                    f"Error deleting chunks for {filepath}: {str(e)}"
                )

        # Process changed/added files
        for filepath in changed_files:
            try:
                # Fetch file content from GitHub
                content = await self.get_file_content_from_github(
                    repo_full_name, filepath, github_token
                )

                if not content:
                    continue

                # Delete old chunks for this file
                deleted = await self.indexer.delete_chunks_for_file(
                    db, tenant_id, filepath
                )
                chunks_deleted += deleted

                # Chunk new content
                chunks = self.chunker.chunk_file(content, filepath)
                if not chunks:
                    logger.warning(f"No chunks produced for {filepath}")
                    continue

                # Embed chunks
                chunks = await self.embedder.embed_chunks(chunks)

                # Index chunks
                indexed = await self.indexer.index_chunks(
                    db, tenant_id, chunks
                )
                chunks_created += indexed
                files_updated += 1

                logger.info(
                    f"Re-indexed {filepath}: "
                    f"{indexed} chunks created"
                )

            except Exception as e:
                logger.error(
                    f"Error re-indexing {filepath}: {str(e)}"
                )

        await db.commit()

        result = {
            "files_updated": files_updated,
            "files_deleted": files_deleted,
            "chunks_created": chunks_created,
            "chunks_deleted": chunks_deleted,
            "repo": repo_full_name,
            "pusher": pusher,
            "status": "success",
        }

        logger.info(
            f"Webhook processing complete: {files_updated} files "
            f"updated, {files_deleted} files deleted, "
            f"{chunks_created} chunks created"
        )

        return result
