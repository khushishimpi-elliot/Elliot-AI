from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.organisation import Organisation, Role, Member
from app.schemas.organisation import (
    OrganisationCreate,
    OrganisationResponse,
    RoleCreate,
    RoleResponse,
    MemberCreate,
    MemberResponse,
)

router = APIRouter(tags=["organisation"])


@router.post("/organisations", response_model=OrganisationResponse)
async def create_organisation(
    org_data: OrganisationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new organisation for a tenant"""
    org = Organisation(
        tenant_id=org_data.tenant_id,
        org_name=org_data.org_name,
        domain=org_data.domain,
        team_size=org_data.team_size,
        data_residency=org_data.data_residency or "US",
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/organisations/{tenant_id}", response_model=OrganisationResponse)
async def get_organisation(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get organisation details for a tenant"""
    result = await db.execute(
        select(Organisation).where(Organisation.tenant_id == tenant_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return org


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new role"""
    role = Role(
        tenant_id=role_data.tenant_id,
        name=role_data.name,
        permissions=role_data.permissions or {},
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.get("/roles/{tenant_id}", response_model=list[RoleResponse])
async def list_roles(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all roles for a tenant"""
    result = await db.execute(
        select(Role).where(Role.tenant_id == tenant_id)
    )
    roles = result.scalars().all()
    return roles


@router.post("/members", response_model=MemberResponse)
async def add_member(
    member_data: MemberCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a member to an organisation"""
    member = Member(
        tenant_id=member_data.tenant_id,
        user_id=member_data.user_id,
        role_id=member_data.role_id,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.get("/members/{tenant_id}", response_model=list[MemberResponse])
async def list_members(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all members in an organisation"""
    result = await db.execute(
        select(Member).where(Member.tenant_id == tenant_id)
    )
    members = result.scalars().all()
    return members
