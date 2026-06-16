import logging
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Header,
    HTTPException,
    Request,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.connector import Connector
from app.schemas.webhook import TestWebhookRequest, WebhookResponse
from app.services.oauth import decrypt_token
from app.services.webhook import WebhookService

router = APIRouter(tags=["webhook"])
logger = logging.getLogger(__name__)


async def get_raw_body(request: Request) -> bytes:
    """Get raw request body for signature verification"""
    return await request.body()


@router.post("/github", response_model=WebhookResponse)
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    raw_body: bytes = Depends(get_raw_body),
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    """Handle GitHub push webhooks for real-time re-indexing"""
    settings = get_settings()

    # Check event type
    if x_github_event != "push":
        logger.info(f"Ignoring non-push event: {x_github_event}")
        return WebhookResponse(
            files_updated=0,
            files_deleted=0,
            chunks_created=0,
            chunks_deleted=0,
            repo="",
            pusher="",
            status="ignored",
        )

    # Verify signature
    webhook_service = WebhookService()
    if not webhook_service.verify_github_signature(
        raw_body, x_hub_signature_256, settings.github_webhook_secret
    ):
        logger.warning("Invalid GitHub webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse payload
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Error parsing webhook payload: {str(e)}")
        raise HTTPException(
            status_code=400, detail="Invalid JSON payload"
        ) from e

    # Find tenant by repository name
    repo_full_name = payload.get("repository", {}).get("full_name", "")
    if not repo_full_name:
        logger.error("No repository name in webhook payload")
        raise HTTPException(
            status_code=400, detail="Missing repository name"
        )

    # Look up connector to find tenant
    result = await db.execute(
        select(Connector).where(
            (Connector.provider == "github")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        logger.warning(
            f"No GitHub connector found for repo {repo_full_name}"
        )
        raise HTTPException(
            status_code=404,
            detail="GitHub connector not configured for this repository",
        )

    tenant_id = str(connector.tenant_id)

    # Decrypt token
    try:
        github_token = decrypt_token(connector.oauth_token)
    except Exception as e:
        logger.error(f"Error decrypting GitHub token: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Token decryption failed"
        ) from e

    # Process webhook asynchronously
    background_tasks.add_task(
        _process_webhook_background,
        webhook_service,
        db,
        tenant_id,
        payload,
        github_token,
    )

    # Return immediate response (GitHub expects response within 30s)
    return WebhookResponse(
        files_updated=0,
        files_deleted=0,
        chunks_created=0,
        chunks_deleted=0,
        repo=repo_full_name,
        pusher=payload.get("pusher", {}).get("name", "unknown"),
        status="processing",
    )


async def _process_webhook_background(
    webhook_service: WebhookService,
    db: AsyncSession,
    tenant_id: str,
    payload: dict,
    github_token: str,
) -> None:
    """Process webhook in background without blocking GitHub response"""
    try:
        await webhook_service.process_push_event(
            db, tenant_id, payload, github_token
        )
        logger.info(
            f"Successfully processed webhook for tenant {tenant_id}"
        )
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")


@router.post("/test/{tenant_id}", response_model=WebhookResponse)
async def test_webhook(
    tenant_id: UUID,
    request: TestWebhookRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    """Manually trigger re-indexing for testing (without GitHub webhook)"""
    webhook_service = WebhookService()

    # Find GitHub connector for tenant
    result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.provider == "github")
            & (Connector.status == "connected")
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        raise HTTPException(
            status_code=404,
            detail="GitHub connector not found for this tenant",
        )

    # Process files
    try:
        # Chunk and embed files
        chunks = []
        for file_data in request.files:
            file_chunks = webhook_service.chunker.chunk_file(
                file_data["content"], file_data["filepath"]
            )
            chunks.extend(file_chunks)

        if chunks:
            chunks = await webhook_service.embedder.embed_chunks(chunks)
            indexed = await webhook_service.indexer.index_chunks(
                db, str(tenant_id), chunks
            )
        else:
            indexed = 0

        await db.commit()

        return WebhookResponse(
            files_updated=len(request.files),
            files_deleted=0,
            chunks_created=indexed,
            chunks_deleted=0,
            repo=request.repo,
            pusher="test",
            status="success",
        )

    except Exception as e:
        logger.error(f"Error processing test webhook: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Processing failed: {str(e)}"
        ) from e
