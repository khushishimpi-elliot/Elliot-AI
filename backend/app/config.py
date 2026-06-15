from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-secret-change-me"
    jwt_algo: str = "HS256"
    jwt_expire_min: int = 60
    magic_link_ttl_min: int = 15
    magic_link_base_url: str = "http://localhost:5173/auth/callback"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    # Restrict logins to a single Google Workspace domain. Empty = allow any.
    google_workspace_domain: str = ""
    # Where to send the browser after we issue our JWT
    google_login_success_url: str = "http://localhost:5173/auth/success"

    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""
    entra_redirect_uri: str = "http://localhost:8000/auth/entra/callback"
    entra_login_success_url: str = "http://localhost:5173/auth/success"


@lru_cache
def get_settings() -> Settings:
    return Settings()
