from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── JWT & Magic Link ───────────────────────────────
    jwt_secret: str = "dev-secret-change-me"
    jwt_algo: str = "HS256"
    jwt_expire_min: int = 60
    magic_link_ttl_min: int = 15

    # ── App URLs ───────────────────────────────────────
    backend_url: str = "http://localhost:8000"
    terminal_url: str = "http://localhost:5173"
    dashboard_url: str = "http://localhost:5174"
    oauth_redirect_base_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    # ── Magic Link ────────────────────────────────────
    magic_link_base_url: str = "http://localhost:5173/auth/callback"

    # ── Google OAuth ───────────────────────────────────
    # redirect_uri is left blank by default and derived from
    # oauth_redirect_base_url in model_post_init (see below) so production
    # never accidentally sends the localhost callback to Google. Set the
    # *_REDIRECT_URI / *_CALLBACK_URL env var to override the derived value.
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    google_workspace_domain: str = ""
    google_login_success_url: str = "http://localhost:5173/auth/success"

    # ── Microsoft Entra ────────────────────────────────
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""
    entra_redirect_uri: str = ""
    entra_login_success_url: str = "http://localhost:5173/auth/success"

    # ── Auth0 SSO ──────────────────────────────────────
    auth0_domain: str = ""
    auth0_client_id: str = ""
    auth0_client_secret: str = ""
    auth0_callback_url: str = ""
    auth0_audience: str = ""

    # ── GitHub ────────────────────────────────────────
    github_client_id: str = ""
    github_client_secret: str = ""
    github_webhook_secret: str = ""

    # ── GitLab ────────────────────────────────────────
    gitlab_client_id: str = ""
    gitlab_client_secret: str = ""

    # ── Bitbucket ────────────────────────────────────
    bitbucket_client_id: str = ""
    bitbucket_client_secret: str = ""

    # ── Jira ──────────────────────────────────────────
    jira_client_id: str = ""
    jira_client_secret: str = ""

    # ── Linear ───────────────────────────────────────
    linear_client_id: str = ""
    linear_client_secret: str = ""

    # ── Slack ────────────────────────────────────────
    slack_client_id: str = ""
    slack_client_secret: str = ""

    # ── ClickUp ──────────────────────────────────────
    clickup_client_id: str = ""
    clickup_client_secret: str = ""

    # ── Notion ───────────────────────────────────────
    notion_client_id: str = ""
    notion_client_secret: str = ""

    # ── SharePoint ───────────────────────────────────
    sharepoint_client_id: str = ""
    sharepoint_client_secret: str = ""

    # ── Google Drive ─────────────────────────────────────
    gdrive_client_id: str = ""
    gdrive_client_secret: str = ""

    # ── Confluence ───────────────────────────────────────
    confluence_client_id: str = ""
    confluence_client_secret: str = ""

    # ── AI APIs ──────────────────────────────────────
    llm_provider: str = "claude"          # claude | openai | gemini | groq
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"
    anthropic_max_tokens: int = 2048
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Email (Resend) ───────────────────────────────
    resend_api_key: str = ""

    # ── Security ─────────────────────────────────────
    fernet_key: str = ""

    # ── Environment ──────────────────────────────────
    app_env: str = "development"

    def model_post_init(self, __context) -> None:
        """Derive SSO callback URLs from oauth_redirect_base_url when not set.

        The connector OAuth flows already build their redirect_uri from
        OAUTH_REDIRECT_BASE_URL (see connector_registry.py); SSO must do the
        same, otherwise production sends the localhost callback to the IdP and
        the provider rejects it with redirect_uri_mismatch. An explicit
        GOOGLE_REDIRECT_URI / ENTRA_REDIRECT_URI / AUTH0_CALLBACK_URL still wins.
        """
        base = self.oauth_redirect_base_url.rstrip("/")
        if not self.google_redirect_uri:
            self.google_redirect_uri = f"{base}/auth/google/callback"
        if not self.entra_redirect_uri:
            self.entra_redirect_uri = f"{base}/auth/entra/callback"
        if not self.auth0_callback_url:
            self.auth0_callback_url = f"{base}/auth/auth0/callback"


@lru_cache
def get_settings() -> Settings:
    return Settings()
