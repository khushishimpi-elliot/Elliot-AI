from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-secret-change-me"
    jwt_algo: str = "HS256"
    jwt_expire_min: int = 60
    magic_link_ttl_min: int = 15
    magic_link_base_url: str = "http://localhost:5173/auth/callback"


@lru_cache
def get_settings() -> Settings:
    return Settings()
