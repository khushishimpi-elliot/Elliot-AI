import os
from dataclasses import dataclass

import httpx
from cryptography.fernet import Fernet


@dataclass
class OAuthConfig:
    """OAuth configuration for a provider"""

    provider_name: str
    client_id: str
    client_secret: str
    authorization_url: str
    token_url: str
    scopes: list[str]
    redirect_uri: str


def _get_cipher():
    """Get Fernet cipher for token encryption"""
    key = os.getenv("FERNET_KEY", "")
    if not key:
        raise ValueError("FERNET_KEY environment variable not set")
    return Fernet(key.encode() if isinstance(key, str) else key)


def get_authorization_url(config: OAuthConfig, state: str) -> str:
    """Build OAuth authorization URL for user to visit"""
    params = {
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
        "response_type": "code",
        "state": state,
        "scope": " ".join(config.scopes),
    }
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{config.authorization_url}?{query_string}"


def exchange_code_for_token(config: OAuthConfig, code: str) -> dict:
    """Exchange authorization code for access and refresh tokens"""
    payload = {
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "code": code,
        "redirect_uri": config.redirect_uri,
        "grant_type": "authorization_code",
    }

    response = httpx.post(config.token_url, data=payload)
    response.raise_for_status()
    return response.json()


def refresh_access_token(config: OAuthConfig, refresh_token: str) -> dict:
    """Get new access token using refresh token"""
    payload = {
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }

    response = httpx.post(config.token_url, data=payload)
    response.raise_for_status()
    return response.json()


def encrypt_token(token: str) -> str:
    """Encrypt token using Fernet symmetric encryption"""
    cipher = _get_cipher()
    encrypted = cipher.encrypt(token.encode())
    return encrypted.decode()


def decrypt_token(encrypted: str) -> str:
    """Decrypt token using Fernet"""
    cipher = _get_cipher()
    decrypted = cipher.decrypt(encrypted.encode())
    return decrypted.decode()
