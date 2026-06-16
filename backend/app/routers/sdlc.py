from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.sdlc import SDLCProfile
from app.schemas.sdlc import SDLCCreate, SDLCResponse, SDLCUpdate

router = APIRouter(tags=["sdlc"])


@router.post("/sdlc", response_model=SDLCResponse)
async def create_sdlc_profile(
    sdlc_data: SDLCCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create SDLC profile for a tenant"""
    profile = SDLCProfile(
        tenant_id=sdlc_data.tenant_id,
        stack=sdlc_data.stack,
        branching_model=sdlc_data.branching_model,
        test_framework=sdlc_data.test_framework,
        coverage_gate=sdlc_data.coverage_gate,
        ci_cd_platform=sdlc_data.ci_cd_platform,
        review_policy=sdlc_data.review_policy,
        arch_style=sdlc_data.arch_style,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/sdlc/{tenant_id}", response_model=SDLCResponse)
async def get_sdlc_profile(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get SDLC profile for a tenant"""
    result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="SDLC profile not found")
    return profile


@router.put("/sdlc/{tenant_id}", response_model=SDLCResponse)
async def update_sdlc_profile(
    tenant_id: UUID,
    sdlc_data: SDLCUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update SDLC profile for a tenant"""
    result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="SDLC profile not found")

    update_data = sdlc_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/sdlc/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sdlc_profile(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete SDLC profile for a tenant"""
    result = await db.execute(
        select(SDLCProfile).where(SDLCProfile.tenant_id == tenant_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="SDLC profile not found")
    await db.delete(profile)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
