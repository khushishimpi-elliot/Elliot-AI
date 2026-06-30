"""Background task orchestrator for connector content indexing.

Handles the full pipeline when any connector is created:
1. Fetch real content from the connector (repos, tasks, messages, etc.)
2. Chunk intelligently (code via tree-sitter, text via line breaks)
3. Generate embeddings via OpenAI
4. Store in pgvector with tenant isolation
"""
import logging
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.connector import Connector
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.connectors.github import GitHubConnector
from app.services.embedder import Embedder
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


async def _save_chunk_to_db(
    db: AsyncSession,
    tenant_id: UUID,
    filepath: str,
    content: str,
    chunk_type: str,
) -> bool:
    """Helper: chunk, embed, and save to pgvector."""
    try:
        if not content or len(content.strip()) < 20:
            return False

        embedder = Embedder()
        embedding = await embedder.embed_text(content[:8000])

        chunk = KnowledgeChunk(
            tenant_id=tenant_id,
            source=filepath,
            content=content,
            chunk_index=0,
            chunk_type=chunk_type,
            chunk_name=filepath.split("/")[-1],
            language="text",
            embedding=embedding,
            char_count=len(content),
            token_estimate=len(content) // 4,
        )
        db.add(chunk)
        await db.flush()
        return True
    except Exception as e:
        logger.warning(f"Failed to save chunk {filepath}: {e}")
        return False


async def index_slack_messages(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Slack messages from last 30 days."""
    try:
        from app.services.connectors.slack import SlackConnector

        logger.info(f"Starting Slack indexing for tenant {tenant_id}")

        slack = SlackConnector(encrypted_token)
        messages = await slack.get_all_messages_for_indexing(days_back=30)

        saved = 0
        for msg in messages:
            filepath = f"slack/{msg['channel']}/{msg['timestamp']}"
            content = f"#{msg['channel']}: {msg['text']} (by {msg['user']})"
            if await _save_chunk_to_db(db, tenant_id, filepath, content, "slack_message"):
                saved += 1

        await db.commit()
        logger.info(f"Slack indexing complete: {saved}/{len(messages)} messages indexed")
        return {"indexed": saved, "total": len(messages), "provider": "slack"}

    except Exception as e:
        logger.error(f"Slack indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "slack"}


async def index_jira_tickets(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Jira tickets (recent issues)."""
    try:
        logger.info(f"Starting Jira indexing for tenant {tenant_id}")

        logger.warning("Jira indexing requires cloud_id - skipping for now")
        return {"indexed": 0, "provider": "jira", "note": "cloud_id required"}

    except Exception as e:
        logger.error(f"Jira indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "jira"}


async def index_confluence_pages(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Confluence pages."""
    try:
        logger.info(f"Starting Confluence indexing for tenant {tenant_id}")

        logger.warning("Confluence indexing requires cloud_id - skipping for now")
        return {"indexed": 0, "provider": "confluence", "note": "cloud_id required"}

    except Exception as e:
        logger.error(f"Confluence indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "confluence"}


async def index_notion_pages(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Notion database pages."""
    try:
        from app.services.connectors.notion import NotionConnector

        logger.info(f"Starting Notion indexing for tenant {tenant_id}")

        notion = NotionConnector(encrypted_token)
        databases = await notion.get_databases()

        saved = 0
        for db_item in databases[:10]:
            try:
                pages = await notion.get_pages(f"parent.database_id = '{db_item['id']}'")
                for page in pages:
                    filepath = f"notion/{db_item['title']}/{page['id']}"
                    content = page.get("content", "")
                    if await _save_chunk_to_db(
                        db, tenant_id, filepath, content, "notion_page"
                    ):
                        saved += 1
            except Exception as e:
                logger.warning(f"Failed to fetch pages from database {db_item['title']}: {e}")
                continue

        await db.commit()
        logger.info(f"Notion indexing complete: {saved} pages indexed")
        return {"indexed": saved, "provider": "notion"}

    except Exception as e:
        logger.error(f"Notion indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "notion"}


async def index_google_drive_docs(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Google Drive documents."""
    try:
        from app.services.connectors.gdrive import GoogleDriveConnector

        logger.info(f"Starting Google Drive indexing for tenant {tenant_id}")

        drive = GoogleDriveConnector(encrypted_token)
        files = await drive.get_files(
            query="trashed=false and mimeType contains 'document' or mimeType contains 'sheet'"
        )

        saved = 0
        for file in files[:100]:
            try:
                filepath = f"gdrive/{file['name']}"
                content = await drive.get_file(file["id"])
                if await _save_chunk_to_db(db, tenant_id, filepath, content, "gdrive_doc"):
                    saved += 1
            except Exception as e:
                logger.warning(f"Failed to fetch {file['name']}: {e}")
                continue

        await db.commit()
        logger.info(f"Google Drive indexing complete: {saved}/{len(files)} documents indexed")
        return {"indexed": saved, "total": len(files), "provider": "gdrive"}

    except Exception as e:
        logger.error(f"Google Drive indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "gdrive"}


async def index_clickup_tasks(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index ClickUp tasks."""
    try:
        logger.info(f"Starting ClickUp indexing for tenant {tenant_id}")
        logger.warning("ClickUp indexing requires team_id context - skipping for now")
        return {"indexed": 0, "provider": "clickup", "note": "team_id required"}

    except Exception as e:
        logger.error(f"ClickUp indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "clickup"}


async def index_linear_issues(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Linear issues."""
    try:
        from app.services.connectors.linear import LinearConnector

        logger.info(f"Starting Linear indexing for tenant {tenant_id}")

        linear = LinearConnector(encrypted_token)
        issues = await linear.list_issues()

        saved = 0
        for issue in issues:
            filepath = f"linear/{issue['id']}"
            content = (
                f"Linear {issue['identifier']}: {issue['title']}\n"
                f"Status: {issue.get('status', 'unknown')}\n"
                f"Description: {issue.get('description', '')}"
            )
            if await _save_chunk_to_db(db, tenant_id, filepath, content, "linear_issue"):
                saved += 1

        await db.commit()
        logger.info(f"Linear indexing complete: {saved}/{len(issues)} issues indexed")
        return {"indexed": saved, "total": len(issues), "provider": "linear"}

    except Exception as e:
        logger.error(f"Linear indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "linear"}


async def index_gitlab_projects(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index GitLab repositories (code)."""
    try:
        from app.services.connectors.gitlab import GitLabConnector

        logger.info(f"Starting GitLab indexing for tenant {tenant_id}")

        gitlab = GitLabConnector(encrypted_token)
        projects = await gitlab.get_projects()

        indexer = Indexer()
        total_indexed = 0

        for project in projects[:10]:
            try:
                files = await gitlab.get_all_files(project["id"])
                result = await indexer.index_repository(
                    db=db,
                    tenant_id=str(tenant_id),
                    files=files,
                )
                total_indexed += result.get("embeddings_created", 0)
            except Exception as e:
                logger.warning(f"Failed to index project {project['name']}: {e}")
                continue

        await db.commit()
        logger.info(f"GitLab indexing complete: {total_indexed} chunks indexed")
        return {"indexed": total_indexed, "provider": "gitlab"}

    except Exception as e:
        logger.error(f"GitLab indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "gitlab"}


async def index_bitbucket_repos(
    db: AsyncSession,
    tenant_id: UUID,
    encrypted_token: str,
) -> dict:
    """Index Bitbucket repositories (code)."""
    try:
        from app.services.connectors.bitbucket import BitbucketConnector

        logger.info(f"Starting Bitbucket indexing for tenant {tenant_id}")

        bitbucket = BitbucketConnector(encrypted_token)

        # Bitbucket requires workspace - try to get it from user workspace
        try:
            workspace_info = await bitbucket.get_workspace_info(".")
            workspace = workspace_info.get("slug", "")
        except Exception:
            logger.warning("Could not determine Bitbucket workspace")
            return {"indexed": 0, "provider": "bitbucket", "note": "workspace required"}

        if not workspace:
            return {"indexed": 0, "provider": "bitbucket", "note": "workspace required"}

        repositories = await bitbucket.get_repositories(workspace)

        indexer = Indexer()
        total_indexed = 0

        for repo in repositories[:10]:
            try:
                files = await bitbucket.get_all_files(repo["name"])
                result = await indexer.index_repository(
                    db=db,
                    tenant_id=str(tenant_id),
                    files=files,
                )
                total_indexed += result.get("embeddings_created", 0)
            except Exception as e:
                logger.warning(f"Failed to index repo {repo['name']}: {e}")
                continue

        await db.commit()
        logger.info(f"Bitbucket indexing complete: {total_indexed} chunks indexed")
        return {"indexed": total_indexed, "provider": "bitbucket"}

    except Exception as e:
        logger.error(f"Bitbucket indexing failed: {e}")
        await db.rollback()
        return {"error": str(e), "provider": "bitbucket"}
