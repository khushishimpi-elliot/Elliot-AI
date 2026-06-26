import os

from app.services.oauth import OAuthConfig

BASE_URL = os.getenv("OAUTH_REDIRECT_BASE_URL", "http://localhost:8000")

CONNECTOR_REGISTRY = {
    "github": OAuthConfig(
        provider_name="github",
        client_id=os.getenv("GITHUB_CLIENT_ID", ""),
        client_secret=os.getenv("GITHUB_CLIENT_SECRET", ""),
        authorization_url="https://github.com/login/oauth/authorize",
        token_url="https://github.com/login/oauth/access_token",
        scopes=["repo", "read:org"],
        redirect_uri=f"{BASE_URL}/connectors/callback/github",
    ),
    "gitlab": OAuthConfig(
        provider_name="gitlab",
        client_id=os.getenv("GITLAB_CLIENT_ID", ""),
        client_secret=os.getenv("GITLAB_CLIENT_SECRET", ""),
        authorization_url="https://gitlab.com/oauth/authorize",
        token_url="https://gitlab.com/oauth/token",
        scopes=["read_repository", "read_api"],
        redirect_uri=f"{BASE_URL}/connectors/callback/gitlab",
    ),
    "bitbucket": OAuthConfig(
        provider_name="bitbucket",
        client_id=os.getenv("BITBUCKET_CLIENT_ID", ""),
        client_secret=os.getenv("BITBUCKET_CLIENT_SECRET", ""),
        authorization_url="https://bitbucket.org/site/oauth2/authorize",
        token_url="https://bitbucket.org/site/oauth2/access_token",
        scopes=["repository", "pullrequest"],
        redirect_uri=f"{BASE_URL}/connectors/callback/bitbucket",
    ),
    "jira": OAuthConfig(
        provider_name="jira",
        client_id=os.getenv("JIRA_CLIENT_ID", ""),
        client_secret=os.getenv("JIRA_CLIENT_SECRET", ""),
        authorization_url="https://auth.atlassian.com/authorize",
        token_url="https://auth.atlassian.com/oauth/token",
        scopes=["read:jira-work", "read:jira-user"],
        redirect_uri=f"{BASE_URL}/connectors/callback/jira",
    ),
    "linear": OAuthConfig(
        provider_name="linear",
        client_id=os.getenv("LINEAR_CLIENT_ID", ""),
        client_secret=os.getenv("LINEAR_CLIENT_SECRET", ""),
        authorization_url="https://linear.app/oauth/authorize",
        token_url="https://api.linear.app/oauth/token",
        scopes=["read"],
        redirect_uri=f"{BASE_URL}/connectors/callback/linear",
    ),
    "slack": OAuthConfig(
        provider_name="slack",
        client_id=os.getenv("SLACK_CLIENT_ID", ""),
        client_secret=os.getenv("SLACK_CLIENT_SECRET", ""),
        authorization_url="https://slack.com/oauth/v2/authorize",
        token_url="https://slack.com/api/oauth.v2.access",
        scopes=["channels:read", "channels:history", "users:read"],
        redirect_uri=f"{BASE_URL}/connectors/callback/slack",
    ),
    "clickup": OAuthConfig(
        provider_name="clickup",
        client_id=os.getenv("CLICKUP_CLIENT_ID", ""),
        client_secret=os.getenv("CLICKUP_CLIENT_SECRET", ""),
        authorization_url="https://app.clickup.com/api/v2/oauth/authorize",
        token_url="https://api.clickup.com/api/v2/oauth/token",
        scopes=["read"],
        redirect_uri=f"{BASE_URL}/connectors/callback/clickup",
    ),
    "notion": OAuthConfig(
        provider_name="notion",
        client_id=os.getenv("NOTION_CLIENT_ID", ""),
        client_secret=os.getenv("NOTION_CLIENT_SECRET", ""),
        authorization_url="https://api.notion.com/v1/oauth/authorize",
        token_url="https://api.notion.com/v1/oauth/token",
        scopes=["read_content", "read_user"],
        redirect_uri=f"{BASE_URL}/connectors/callback/notion",
    ),
    "sharepoint": OAuthConfig(
        provider_name="sharepoint",
        client_id=os.getenv("SHAREPOINT_CLIENT_ID", ""),
        client_secret=os.getenv("SHAREPOINT_CLIENT_SECRET", ""),
        authorization_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes=["Sites.Read.All", "Files.Read.All"],
        redirect_uri=f"{BASE_URL}/connectors/callback/sharepoint",
    ),
    "gdrive": OAuthConfig(
        provider_name="gdrive",
        client_id=os.getenv("GDRIVE_CLIENT_ID", ""),
        client_secret=os.getenv("GDRIVE_CLIENT_SECRET", ""),
        authorization_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/drive.readonly"],
        redirect_uri=f"{BASE_URL}/connectors/callback/gdrive",
    ),
    "confluence": OAuthConfig(
        provider_name="confluence",
        client_id=os.getenv("CONFLUENCE_CLIENT_ID", ""),
        client_secret=os.getenv("CONFLUENCE_CLIENT_SECRET", ""),
        authorization_url="https://auth.atlassian.com/authorize",
        token_url="https://auth.atlassian.com/oauth/token",
        scopes=["read:confluence-content.all", "read:confluence-space.summary"],
        redirect_uri=f"{BASE_URL}/connectors/callback/confluence",
    ),
}


def get_connector_config(provider: str) -> OAuthConfig:
    """Get OAuth config for a provider"""
    if provider not in CONNECTOR_REGISTRY:
        raise ValueError(
            f"Unknown provider: {provider}. "
            f"Available: {', '.join(CONNECTOR_REGISTRY.keys())}"
        )
    return CONNECTOR_REGISTRY[provider]
