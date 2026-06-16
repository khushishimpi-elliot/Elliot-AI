from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.connector import Connector
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.organisation import Organisation
from app.models.sdlc import SDLCProfile
from app.schemas.launch import LaunchSummary, OrgSummary, SDLCSummary

router = APIRouter(tags=["launch"])


@router.get("/{tenant_id}", response_model=LaunchSummary)
async def get_launch_summary(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
) -> LaunchSummary:
    # 1. Organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.tenant_id == tenant_id)
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="organisation not found")

    # 2. SDLC profile
    sdlc_result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    sdlc = sdlc_result.scalar_one_or_none()

    # 3. Connected connectors
    conn_result = await db.execute(
        select(Connector).where(
            (Connector.tenant_id == tenant_id)
            & (Connector.status == "connected")
        )
    )
    connectors = conn_result.scalars().all()

    # 4. Chunk count
    count_result = await db.execute(
        select(func.count()).select_from(KnowledgeChunk).where(
            KnowledgeChunk.tenant_id == tenant_id
        )
    )
    chunk_count = count_result.scalar() or 0

    return LaunchSummary(
        org=OrgSummary(
            name=org.org_name,
            domain=org.domain,
            team_size=org.team_size,
            residency=org.data_residency or "US",
        ),
        sdlc=SDLCSummary(
            stack=sdlc.stack,
            branching_model=sdlc.branching_model,
            test_framework=sdlc.test_framework,
            coverage_gate=sdlc.coverage_gate,
            ci_cd_platform=sdlc.ci_cd_platform,
            review_policy=sdlc.review_policy,
            arch_style=sdlc.arch_style,
        ) if sdlc else None,
        connectors=[c.provider for c in connectors],
        chunk_count=chunk_count,
    )
