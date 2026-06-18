# SharePoint Connector Design — v2 Feature

## Overview

SharePoint connector using Microsoft Graph API OAuth2. Extracts sites and documents for RAG indexing. Reuses existing OAuth infrastructure.

## OAuth Config

```
Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
Token URL:        https://login.microsoftonline.com/common/oauth2/v2.0/token
Scopes:           ["Sites.Read.All", "Files.Read.All"]
API Base:         https://graph.microsoft.com/v1.0
```

## SharePointConnector

```python
class SharePointConnector(encrypted_token: str):
    async def get_sites() -> list[dict]      # name, id, url, description
    async def get_documents(site_id: str) -> list[dict]  # name, content, url, last_modified
```

## Schemas

```
SharePointSite      — id, name, url, description
SharePointDocument  — id, name, content, url, last_modified
```

## Routes (`/sharepoint`)

```
GET /{tenant_id}/sites                           → list SharePoint sites
GET /{tenant_id}/sites/{site_id}/documents       → documents with full text
```

## Config

```python
sharepoint_client_id: str = ""
sharepoint_client_secret: str = ""
```

## Tests (5)

| Test | What it checks |
|------|---------------|
| `test_oauth_config_registered` | sharepoint in CONNECTOR_REGISTRY |
| `test_get_sites_connector_not_found` | No connector → 404 |
| `test_get_sites_success` | Mocked Graph API → 200 with sites |
| `test_get_documents_connector_not_found` | No connector → 404 |
| `test_get_documents_success` | Mocked Graph API → 200 with documents |
