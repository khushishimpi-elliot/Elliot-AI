import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_access_token
from app.db.session import get_db
from app.models.connector import Connector
from app.models.knowledge_chunk import KnowledgeChunk
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


@router.get("/config/{tenant_id}")
async def get_onboarding_config(
    tenant_id: UUID,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get full configuration for CLI setup — returns everything needed for auto-configuration"""
    try:
        # Verify JWT token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization.replace("Bearer ", "")
        try:
            token_data = decode_access_token(token)
        except Exception as e:
            logger.error(f"Invalid token: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid or expired token") from e

        # Get organisation
        try:
            org_result = await db.execute(
                select(Organisation).where(Organisation.tenant_id == tenant_id)
            )
            org = org_result.scalar_one_or_none()

            if not org:
                logger.error(f"Organisation not found for tenant {tenant_id}")
                raise HTTPException(status_code=404, detail="Organisation not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching organisation: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch organisation") from e

        # Get SDLC profile
        sdlc_result = await db.execute(
            select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
        )
        sdlc = sdlc_result.scalar_one_or_none()

        # Get connected connectors
        # Note: only query columns that exist in the database schema
        connectors_result = await db.execute(
            select(Connector.provider, Connector.status).where(
                Connector.tenant_id == tenant_id
            )
        )
        connector_rows = connectors_result.all()
        connectors = [
            {"provider": row[0], "status": row[1]} for row in connector_rows
        ]

        # Get chunk count
        chunk_count_result = await db.execute(
            select(func.count(KnowledgeChunk.id)).where(
                KnowledgeChunk.tenant_id == tenant_id
            )
        )
        chunk_count = chunk_count_result.scalar() or 0

        return {
            "jwt_token": token,
            "tenant_id": str(tenant_id),
            "user_id": str(token_data.get("sub", "")),
            "email": token_data.get("email", ""),
            "org_name": org.org_name,
            "domain": org.domain,
            "backend_url": "https://elliot-ai.onrender.com",
            "onboarding_url": "https://elliot-ai-1.onrender.com",
            "stack": sdlc.stack if sdlc else "Not configured",
            "arch_style": sdlc.arch_style if sdlc else "Not configured",
            "test_framework": sdlc.test_framework if sdlc else "Not configured",
            "coverage_gate": sdlc.coverage_gate if sdlc else 0,
            "branching_model": sdlc.branching_model if sdlc else "Not configured",
            "review_policy": sdlc.review_policy if sdlc else "Not configured",
            "ci_cd_platform": sdlc.ci_cd_platform if sdlc else "Not configured",
            "connectors": [
                {
                    "provider": c.provider,
                    "status": "connected" if c.status == "connected" else "not_connected"
                }
                for c in connectors
            ],
            "chunk_count": chunk_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching onboarding config: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch configuration",
        ) from e
