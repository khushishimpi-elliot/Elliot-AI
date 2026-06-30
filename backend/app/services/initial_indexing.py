"""Background task orchestrator for initial repository indexing.

Handles the full pipeline when a GitHub connector is created:
1. Fetch all repositories and files from GitHub
2. Chunk code intelligently using tree-sitter
3. Generate embeddings for all chunks
4. Store in pgvector for semantic search
"""
import logging
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.connector import Connector
from app.services.connectors.github import GitHubConnector
from app.services.indexer import Indexer

logger = logging.getLogger(__name__)


async def index_github_repositories(
    db: AsyncSession,
    tenant_id: UUID,
    connector_id: int,
) -> dict:
    """Orchestrate full indexing pipeline for GitHub connector.

    Args:
        db: Database session
        tenant_id: Tenant ID
        connector_id: Connector ID to index

    Returns:
        Summary dict with counts of processed files, chunks, embeddings
    """
    try:
        result = await db.execute(
            select(Connector).where(
                (Connector.id == connector_id) & (Connector.tenant_id == tenant_id)
            )
        )
        connector_obj = result.scalar_one_or_none()
        if not connector_obj:
            logger.error(f"Connector {connector_id} not found for tenant {tenant_id}")
            return {"error": "Connector not found"}

        encrypted_token = connector_obj.oauth_token

        # Step 1: Fetch repositories and files from GitHub
        logger.info(f"Fetching GitHub repositories for tenant {tenant_id}")
        connector = GitHubConnector(encrypted_token=encrypted_token)

        repos_response = []
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {connector.access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
                response = await client.get(
                    "https://api.github.com/user/repos",
                    headers=headers,
                    params={"per_page": 100, "type": "owner"},
                )
                response.raise_for_status()
                repos_response = response.json()
        except Exception as e:
            logger.warning(f"Could not fetch user repos: {e}")
            repos_response = []

        if not repos_response:
            logger.info(f"No repositories found for tenant {tenant_id}")
            return {
                "tenant_id": str(tenant_id),
                "repos_processed": 0,
                "files_processed": 0,
                "chunks_created": 0,
                "embeddings_created": 0,
            }

        # Step 2: Fetch all files from each repository
        all_files = []
        for repo in repos_response:
            repo_name = repo.get("name")
            owner = repo.get("owner", {}).get("login")

            if not repo_name or not owner:
                continue

            try:
                logger.info(f"Fetching files from {owner}/{repo_name}")
                files = await connector.get_all_files(owner, repo_name)
                all_files.extend(files)
                logger.info(f"Found {len(files)} files in {owner}/{repo_name}")
            except Exception as e:
                logger.warning(f"Failed to fetch {owner}/{repo_name}: {e}")
                continue

        if not all_files:
            logger.info(f"No files found in repositories for tenant {tenant_id}")
            return {
                "tenant_id": str(tenant_id),
                "repos_processed": len(repos_response),
                "files_processed": 0,
                "chunks_created": 0,
                "embeddings_created": 0,
            }

        # Step 3: Chunk, embed, and index
        logger.info(f"Indexing {len(all_files)} files for tenant {tenant_id}")
        indexer = Indexer()

        index_result = await indexer.index_repository(
            db=db,
            tenant_id=str(tenant_id),
            files=all_files,
        )

        logger.info(
            f"Indexing complete: {index_result['files_processed']} files, "
            f"{index_result['chunks_created']} chunks, "
            f"{index_result['embeddings_created']} embeddings"
        )

        return {
            **index_result,
            "repos_processed": len(repos_response),
        }

    except Exception as e:
        logger.error(f"Index failed for tenant {tenant_id}: {type(e).__name__}: {e}")
        return {
            "error": str(e),
            "tenant_id": str(tenant_id),
        }
