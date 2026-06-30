from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import magic_link, oauth_state, sso_entra, sso_google
from app.auth.jwt import issue_access_token
from app.auth.schemas import MagicLinkRequest, MagicLinkResponse, TokenResponse
from app.config import get_settings
from app.db.session import get_db
from app.services.auth0 import Auth0Service
from app.services.email import send_magic_link_email

router = APIRouter(prefix="/auth", tags=["auth"])


ALLOWED_DOMAIN = "elliotsystems.com"


@router.post("/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(payload: MagicLinkRequest) -> MagicLinkResponse:
    email_domain = payload.email.split("@")[-1].lower()
    if email_domain != ALLOWED_DOMAIN:
        raise HTTPException(
            status_code=403,
            detail="Only Elliot Systems employees can sign in."
        )
    token, ttl = magic_link.issue_link(payload.email)
    link_url = magic_link.build_link_url(token)
    sent = await send_magic_link_email(payload.email, link_url)
    if not sent:
        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery failed. Check SMTP_HOST, SMTP_USER, and SMTP_PASS "
                "are configured on the server."
            ),
        )
    return MagicLinkResponse(sent=True, expires_in_seconds=ttl)


@router.get("/callback", response_model=TokenResponse)
def redeem_magic_link(token: str = Query(...)) -> TokenResponse:
    try:
        email = magic_link.redeem(token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    access_token, ttl = issue_access_token(email)
    return TokenResponse(
        access_token=access_token,
        expires_in_seconds=ttl,
        email=email,
    )


@router.get("/google/login")
def google_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="google sso not configured")
    state = oauth_state.issue()
    url = sso_google.build_authorization_url(state)
    return RedirectResponse(url=url, status_code=302)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    from uuid import uuid4

    from sqlalchemy import select

    from app.models.tenant import Tenant
    from app.models.user import User

    settings = get_settings()
    if not oauth_state.consume(state):
        raise HTTPException(status_code=400, detail="invalid or expired state")

    try:
        tokens = sso_google.exchange_code_for_tokens(code)
        claims = sso_google.verify_id_token(tokens["id_token"])
    except sso_google.OIDCError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    email = claims["email"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        tenant_id = user.tenant_id
    else:
        tenant_id = uuid4()
        tenant = Tenant(
            id=tenant_id,
            org_name=email.split("@")[0],
            domain=email.split("@")[1],
        )
        db.add(tenant)

        user = User(
            tenant_id=tenant_id,
            email=email,
            sso_provider="google",
            role="owner",
        )
        db.add(user)
        await db.commit()

    access_token, ttl = issue_access_token(email, tenant_id=tenant_id)

    frontend_url = settings.frontend_url or "http://localhost:5173"
    redirect_url = (
        f"{frontend_url}/onboarding?jwt={access_token}&step=2&email={email}"
    )
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/entra/login")
def entra_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.entra_client_id:
        raise HTTPException(status_code=503, detail="entra sso not configured")
    state = oauth_state.issue()
    url = sso_entra.build_authorization_url(state)
    return RedirectResponse(url=url, status_code=302)


@router.get("/entra/callback")
async def entra_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    from uuid import uuid4

    from sqlalchemy import select

    from app.models.tenant import Tenant
    from app.models.user import User

    settings = get_settings()
    if not oauth_state.consume(state):
        raise HTTPException(status_code=400, detail="invalid or expired state")

    try:
        tokens = sso_entra.exchange_code_for_tokens(code)
        claims = sso_entra.verify_id_token(tokens["id_token"])
    except sso_entra.OIDCError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    email = claims["email"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        tenant_id = user.tenant_id
    else:
        tenant_id = uuid4()
        tenant = Tenant(
            id=tenant_id,
            org_name=email.split("@")[0],
            domain=email.split("@")[1],
        )
        db.add(tenant)

        user = User(
            tenant_id=tenant_id,
            email=email,
            sso_provider="entra",
            role="owner",
        )
        db.add(user)
        await db.commit()

    access_token, ttl = issue_access_token(email, tenant_id=tenant_id)

    frontend_url = settings.frontend_url or "http://localhost:5173"
    redirect_url = (
        f"{frontend_url}/onboarding?jwt={access_token}&step=2&email={email}"
    )
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/auth0/login", response_model=None)
def auth0_login():
    """Auth0 SSO login with mock fallback"""
    settings = get_settings()
    auth0_service = Auth0Service()

    # Mock mode when Auth0 is not configured
    if not settings.auth0_domain:
        return {
            "jwt_token": "mock-jwt-token-dev-mode",
            "user": {
                "email": "dev@elliotsystems.com",
                "role": "developer",
                "tenant_id": "00000000-0000-0000-0000-000000000001",
            },
            "message": "Mock SSO — set AUTH0_DOMAIN for real login",
            "mode": "mock",
        }

    # Real Auth0 flow
    state = oauth_state.issue()
    auth_url = auth0_service.get_authorization_url(state)
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/auth0/callback")
async def auth0_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Auth0 OAuth callback handler"""
    settings = get_settings()
    auth0_service = Auth0Service()

    if not settings.auth0_domain:
        raise HTTPException(status_code=503, detail="Auth0 not configured")

    if not oauth_state.consume(state):
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    try:
        # Exchange code for tokens
        token_response = await auth0_service.exchange_code_for_token(code)
        access_token = token_response.get("access_token")

        # Get user info
        user_info = await auth0_service.get_user_info(access_token)

        # Use default tenant for Auth0 users
        default_tenant_id = UUID("00000000-0000-0000-0000-000000000001")

        # Create or get user
        user = await auth0_service.create_or_get_user(
            db, default_tenant_id, user_info
        )

        # Create JWT
        jwt_token = auth0_service.create_jwt(user)

        return {
            "jwt_token": jwt_token,
            "user": {
                "email": user["email"],
                "role": user["role"],
                "tenant_id": user["tenant_id"],
            },
            "message": "Successfully authenticated with Auth0",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Auth0 login failed") from e


@router.get("/auth0/logout")
def auth0_logout(return_to: str | None = None) -> RedirectResponse:
    """Auth0 logout"""
    auth0_service = Auth0Service()
    logout_url = auth0_service.get_logout_url(return_to)
    return RedirectResponse(url=logout_url, status_code=302)



@router.get("/test-email")
async def test_email_config() -> dict:
    """Debug endpoint — shows SMTP config state and attempts a test send."""
    settings = get_settings()
    config_status = {
        "smtp_host_set": bool(settings.smtp_host),
        "smtp_port": settings.smtp_port,
        "smtp_user_set": bool(settings.smtp_user),
        "smtp_pass_set": bool(settings.smtp_pass),
        "email_from": settings.email_from,
        "magic_link_base_url": settings.magic_link_base_url,
        "smtp_host": settings.smtp_host if settings.smtp_host else "(not set)",
    }

    test_target = settings.smtp_user or "test@elliotsystems.com"
    sent = await send_magic_link_email(test_target, "https://example.com/auth/callback?token=test")

    return {
        "config": config_status,
        "test_send_succeeded": sent,
        "test_sent_to": test_target,
    }
