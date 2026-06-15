from pydantic import BaseModel, EmailStr


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkResponse(BaseModel):
    sent: bool
    expires_in_seconds: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    email: EmailStr
