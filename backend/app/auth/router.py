from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import email as email_sender
from app.auth import magic_link, oauth_state, sso_entra, sso_google
from app.auth.jwt import issue_access_token
from app.auth.schemas import MagicLinkRequest, MagicLinkResponse, TokenResponse
from app.config import get_settings
from app.db.session import get_db
from app.services.auth0 import Auth0Service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/magic-link", response_model=MagicLinkResponse)
def request_magic_link(payload: MagicLinkRequest) -> MagicLinkResponse:
    token, ttl = magic_link.issue_link(payload.email)
    link_url = magic_link.build_link_url(token)
    email_sender.send_magic_link(payload.email, link_url)
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
def google_callback(code: str = Query(...), state: str = Query(...)):
    settings = get_settings()

    if not oauth_state.consume(state):
        # Redirect back to frontend with error parameter instead of returning error JSON
        # Frontend will detect error parameter and use fallback auth
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_state_expired",
            status_code=302
        )

    try:
        tokens = sso_google.exchange_code_for_tokens(code)
        claims = sso_google.verify_id_token(tokens["id_token"])
    except sso_google.OIDCError as e:
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_failed",
            status_code=302
        )

    email = claims["email"]
    access_token, ttl = issue_access_token(email)

    # Redirect back to frontend with JWT token
    return RedirectResponse(
        url=f"{settings.terminal_url}/?jwt_token={access_token}",
        status_code=302
    )


@router.get("/entra/login")
def entra_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.entra_client_id:
        raise HTTPException(status_code=503, detail="entra sso not configured")
    state = oauth_state.issue()
    url = sso_entra.build_authorization_url(state)
    return RedirectResponse(url=url, status_code=302)


@router.get("/entra/callback")
def entra_callback(code: str = Query(...), state: str = Query(...)):
    settings = get_settings()

    if not oauth_state.consume(state):
        # Redirect back to frontend with error parameter
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_state_expired",
            status_code=302
        )

    try:
        tokens = sso_entra.exchange_code_for_tokens(code)
        claims = sso_entra.verify_id_token(tokens["id_token"])
    except sso_entra.OIDCError as e:
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_failed",
            status_code=302
        )

    email = claims["email"]
    access_token, ttl = issue_access_token(email)

    # Redirect back to frontend with JWT token
    return RedirectResponse(
        url=f"{settings.terminal_url}/?jwt_token={access_token}",
        status_code=302
    )


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
        # Redirect back to frontend with error parameter
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_state_expired",
            status_code=302
        )

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

        # Redirect back to frontend with JWT token
        return RedirectResponse(
            url=f"{settings.terminal_url}/?jwt_token={jwt_token}",
            status_code=302
        )

    except ValueError as e:
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_failed",
            status_code=302
        )
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.terminal_url}/?error=oauth_failed",
            status_code=302
        )


@router.get("/auth0/logout")
def auth0_logout(return_to: str | None = None) -> RedirectResponse:
    """Auth0 logout"""
    auth0_service = Auth0Service()
    logout_url = auth0_service.get_logout_url(return_to)
    return RedirectResponse(url=logout_url, status_code=302)
