import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(tags=["users"])
logger = logging.getLogger(__name__)


@router.post("/users", response_model=UserResponse)
async def create_user(
    request: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Create a new user"""
    try:
        user = User(
            tenant_id=request.tenant_id,
            email=request.email,
            sso_provider=request.sso_provider,
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        logger.info(f"Created user {user.id} for tenant {request.tenant_id}")
        return UserResponse.model_validate(user)

    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create user: {str(e)}",
        ) from e


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get a user by ID"""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user",
        ) from e


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    tenant_id: UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    """List users for a tenant"""
    try:
        result = await db.execute(
            select(User)
            .where(User.tenant_id == tenant_id)
            .order_by(desc(User.created_at))
            .offset(skip)
            .limit(limit)
        )

        users = result.scalars().all()
        return [UserResponse.model_validate(u) for u in users]

    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list users",
        ) from e


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a user"""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await db.delete(user)
        await db.commit()

        logger.info(f"Deleted user {user_id}")
        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete user",
        ) from e
