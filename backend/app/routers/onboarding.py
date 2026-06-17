import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.connector import Connector
from app.models.organisation import Organisation
from app.models.sdlc import SDLCProfile
from app.models.tenant import Tenant
from app.schemas.sdlc import SDLCCreate
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter(prefix="/onboarding", tags=["onboarding"])
logger = logging.getLogger(__name__)


@router.post("/workspace", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    """Create workspace — onboarding step 1"""
    try:
        tenant = Tenant(
            org_name=payload.name,
            domain=payload.domain,
            team_size=payload.team_size,
            data_residency=payload.residency,
        )
        db.add(tenant)

        org = Organisation(
            tenant_id=tenant.id,
            org_name=payload.name,
            domain=payload.domain,
            team_size=payload.team_size,
            data_residency=payload.residency,
        )
        db.add(org)

        await db.commit()
        await db.refresh(tenant)

        logger.info(f"Created workspace {tenant.id}")

        return WorkspaceResponse(
            tenant_id=tenant.id,
            name=tenant.org_name,
            domain=tenant.domain,
            team_size=tenant.team_size,
            residency=tenant.data_residency,
            created_at=tenant.created_at,
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating workspace: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create workspace: {str(e)}",
        ) from e


@router.post("/sdlc", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_sdlc(
    request: SDLCCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Configure SDLC — onboarding step 2"""
    try:
        sdlc = SDLCProfile(
            tenant_id=request.tenant_id,
            stack=request.stack,
            branching_model=request.branching_model,
            test_framework=request.test_framework,
            coverage_gate=request.coverage_gate,
            ci_cd_platform=request.ci_cd_platform,
            review_policy=request.review_policy,
            arch_style=request.arch_style,
        )

        db.add(sdlc)
        await db.commit()
        await db.refresh(sdlc)

        logger.info(f"Created SDLC profile for tenant {request.tenant_id}")

        return {
            "id": str(sdlc.id),
            "tenant_id": str(sdlc.tenant_id),
            "stack": sdlc.stack,
            "branching_model": sdlc.branching_model,
            "test_framework": sdlc.test_framework,
            "coverage_gate": sdlc.coverage_gate,
            "ci_cd_platform": sdlc.ci_cd_platform,
            "review_policy": sdlc.review_policy,
            "arch_style": sdlc.arch_style,
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating SDLC profile: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create SDLC profile: {str(e)}",
        ) from e


@router.get("/connectors/{tenant_id}/{provider}/authorize")
async def initiate_oauth(
    tenant_id: UUID,
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Initiate OAuth for a connector — onboarding step 3"""
    try:
        from app.services.connector_registry import CONNECTOR_REGISTRY
        from app.services.oauth import get_authorization_url

        if provider not in CONNECTOR_REGISTRY:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported provider: {provider}",
            )

        config = CONNECTOR_REGISTRY[provider]
        auth_url = get_authorization_url(provider, config)

        logger.info(f"Initiated OAuth for {provider} on tenant {tenant_id}")

        return {
            "provider": provider,
            "authorization_url": auth_url,
            "tenant_id": str(tenant_id),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating OAuth: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate OAuth: {str(e)}",
        ) from e


@router.post("/connectors/{tenant_id}/{provider}/callback")
async def handle_oauth_callback(
    tenant_id: UUID,
    provider: str,
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Handle OAuth callback — completes connector setup"""
    try:
        from app.services.connector_registry import CONNECTOR_REGISTRY
        from app.services.oauth import encrypt_token, exchange_code_for_token

        if provider not in CONNECTOR_REGISTRY:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported provider: {provider}",
            )

        config = CONNECTOR_REGISTRY[provider]
        token_data = exchange_code_for_token(code, config)

        encrypted_token = encrypt_token(token_data["access_token"])
        encrypted_refresh = None
        if "refresh_token" in token_data:
            encrypted_refresh = encrypt_token(token_data["refresh_token"])

        connector = Connector(
            tenant_id=tenant_id,
            provider=provider,
            status="connected",
            oauth_token=encrypted_token,
            oauth_refresh_token=encrypted_refresh,
            scopes=token_data.get("scopes", []),
        )

        db.add(connector)
        await db.commit()
        await db.refresh(connector)

        logger.info(f"Connected {provider} for tenant {tenant_id}")

        return {
            "provider": provider,
            "status": "connected",
            "tenant_id": str(tenant_id),
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error handling OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete OAuth: {str(e)}",
        ) from e
