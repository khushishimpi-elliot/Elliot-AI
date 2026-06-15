from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.config import get_settings


def issue_access_token(email: str) -> tuple[str, int]:
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.jwt_expire_min)
    expire = datetime.now(UTC) + expires_delta
    payload = {
        "sub": email,
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(UTC).timestamp()),
        "typ": "access",
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algo)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algo])
    except JWTError as e:
        raise ValueError(f"invalid token: {e}") from e
