"""FastAPI dependencies for tenant scoping.

Usage in routers:
    @router.get("/things")
    def list_things(ctx: TenantContext = Depends(require_tenant)):
        ...filter queries by ctx.tenant_id...
"""
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status


@dataclass
class TenantContext:
    tenant_id: str
    user_email: str


def get_tenant_context(request: Request) -> TenantContext | None:
    """Returns context if the request has a valid tenant-scoped JWT, else None.

    Useful for routes that behave differently for authed vs anonymous callers.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    user_email = getattr(request.state, "user_email", None)
    if tenant_id and user_email:
        return TenantContext(tenant_id=tenant_id, user_email=user_email)
    return None


def require_tenant(
    ctx: TenantContext | None = Depends(get_tenant_context),
) -> TenantContext:
    """Hard requirement: 401 if no tenant context on the request.

    Once task #08 lands the tenants table, add a DB lookup here to confirm
    the tenant_id still exists and the user is still a member.
    """
    if ctx is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="tenant context required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return ctx
