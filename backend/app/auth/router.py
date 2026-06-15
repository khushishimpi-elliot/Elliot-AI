from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.auth import email as email_sender
from app.auth import magic_link, oauth_state, sso_google
from app.auth.jwt import issue_access_token
from app.auth.schemas import MagicLinkRequest, MagicLinkResponse, TokenResponse
from app.config import get_settings

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


@router.get("/google/callback", response_model=TokenResponse)
def google_callback(code: str = Query(...), state: str = Query(...)) -> TokenResponse:
    if not oauth_state.consume(state):
        raise HTTPException(status_code=400, detail="invalid or expired state")

    try:
        tokens = sso_google.exchange_code_for_tokens(code)
        claims = sso_google.verify_id_token(tokens["id_token"])
    except sso_google.OIDCError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    email = claims["email"]
    access_token, ttl = issue_access_token(email)
    return TokenResponse(
        access_token=access_token,
        expires_in_seconds=ttl,
        email=email,
    )
