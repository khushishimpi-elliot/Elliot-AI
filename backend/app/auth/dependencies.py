from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import decode_access_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and verify JWT token from Authorization header.

    Args:
        credentials: HTTP Bearer token from request header

    Returns:
        Decoded JWT payload with user info

    Raises:
        HTTPException: If token is missing, invalid, or expired
    """
    try:
        payload = decode_access_token(credentials.credentials)
        return payload
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail="invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
