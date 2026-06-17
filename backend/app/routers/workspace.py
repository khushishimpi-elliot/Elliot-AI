from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.organisation import Organisation
from app.models.tenant import Tenant
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter(tags=["workspace"])


@router.post("/workspace", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
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

    try:
        await db.commit()
        await db.refresh(tenant)
    except Exception:
        await db.rollback()
        raise

    return WorkspaceResponse(
        tenant_id=tenant.id,
        name=tenant.org_name,
        domain=tenant.domain,
        team_size=tenant.team_size,
        residency=tenant.data_residency,
        created_at=tenant.created_at,
    )
