from fastapi import APIRouter, HTTPException, Query

from app.auth import email as email_sender
from app.auth import magic_link
from app.auth.jwt import issue_access_token
from app.auth.schemas import MagicLinkRequest, MagicLinkResponse, TokenResponse

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
