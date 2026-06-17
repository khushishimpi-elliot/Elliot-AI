"""Unit tests for the GitLab connector service.

Mocks httpx so no real network calls. Verifies:
- list-projects pagination + field mapping
- repository tree walking
- file content size + 404 handling
- get_all_files filters by extension + skips junk folders
- MR list field mapping
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.connectors.gitlab import GitLabConnector


@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setattr(
        "app.services.connectors.gitlab.decrypt_token", lambda _enc: "real-access-token"
    )
    return GitLabConnector(encrypted_token="encrypted-blob")


class _Resp:
    def __init__(self, status=200, json_body=None, text="", headers=None):
        self.status_code = status
        self._json = json_body if json_body is not None else []
        self.text = text
        self.headers = headers or {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def json(self):
        return self._json


def _patch_client(side_effects):
    """Return a patch context that mocks httpx.AsyncClient.get with the given
    sequence of responses (or a single callable)."""
    client_mock = AsyncMock()
    if callable(side_effects):
        client_mock.get.side_effect = side_effects
    else:
        client_mock.get.side_effect = side_effects

    cm = AsyncMock()
    cm.__aenter__.return_value = client_mock
    cm.__aexit__.return_value = False

    return patch(
        "app.services.connectors.gitlab.httpx.AsyncClient",
        return_value=cm,
    )


# ---- get_projects --------------------------------------------------------


async def test_get_projects_maps_fields(connector):
    project_payload = [
        {
            "id": 1,
            "name": "Elliot-AI",
            "path_with_namespace": "khushi/elliot-ai",
            "description": "the assistant",
            "default_branch": "main",
            "visibility": "private",
            "web_url": "https://gitlab.com/khushi/elliot-ai",
        }
    ]
    with _patch_client([_Resp(json_body=project_payload), _Resp(json_body=[])]):
        projects = await connector.get_projects()

    assert len(projects) == 1
    p = projects[0]
    assert p["id"] == 1
    assert p["path_with_namespace"] == "khushi/elliot-ai"
    assert p["default_branch"] == "main"


async def test_get_projects_paginates(connector):
    page1 = [{"id": i, "name": f"p{i}", "path_with_namespace": f"o/p{i}",
              "description": None, "default_branch": "main",
              "visibility": "private", "web_url": f"u{i}"} for i in range(50)]
    page2 = [{"id": 50, "name": "p50", "path_with_namespace": "o/p50",
              "description": None, "default_branch": "main",
              "visibility": "private", "web_url": "u50"}]

    with _patch_client([_Resp(json_body=page1), _Resp(json_body=page2), _Resp(json_body=[])]):
        projects = await connector.get_projects()

    assert len(projects) == 51


# ---- file walk + filtering ----------------------------------------------


async def test_get_all_files_filters_by_extension(connector):
    tree = [
        {"type": "blob", "path": "src/main.py"},
        {"type": "blob", "path": "README.md"},     # skipped: extension
        {"type": "blob", "path": "node_modules/lib/x.js"},  # skipped: folder
        {"type": "tree", "path": "src/sub"},       # skipped: not a blob
        {"type": "blob", "path": "src/app.ts"},
    ]
    project_meta = {"default_branch": "main"}
    file_responses = {
        "src/main.py": _Resp(text="print('hi')"),
        "src/app.ts": _Resp(text="export const x = 1"),
    }

    call_count = {"i": 0}

    def side_effect(url, **kwargs):
        i = call_count["i"]
        call_count["i"] += 1
        if "/repository/tree" in url:
            return _Resp(json_body=tree if i == 0 else [])
        if url.endswith("/projects/42") or url.endswith("/projects/42/"):
            return _Resp(json_body=project_meta)
        # raw file fetch
        for path, resp in file_responses.items():
            from urllib.parse import quote
            if quote(path, safe="") in url:
                return resp
        return _Resp(status=404)

    with _patch_client(side_effect):
        files = await connector.get_all_files(42)

    paths = sorted(f["path"] for f in files)
    assert paths == ["src/app.ts", "src/main.py"]


async def test_get_file_content_returns_empty_on_404(connector):
    with _patch_client([_Resp(status=404)]):
        content = await connector.get_file_content(1, "missing.py", ref="main")
    assert content == ""


async def test_get_file_content_returns_empty_when_too_large(connector):
    huge_headers = {"content-length": str(10_000_000)}
    with _patch_client([_Resp(text="x" * 100, headers=huge_headers)]):
        content = await connector.get_file_content(1, "big.py", ref="main")
    assert content == ""


# ---- merge requests ------------------------------------------------------


async def test_get_merge_requests_maps_fields(connector):
    mr_payload = [
        {
            "iid": 7,
            "title": "Add gitlab connector",
            "description": "task #16",
            "author": {"username": "khushi"},
            "state": "opened",
            "created_at": "2026-06-15T00:00:00Z",
            "updated_at": "2026-06-15T01:00:00Z",
            "source_branch": "connectors/16-gitlab-connector",
            "target_branch": "main",
            "web_url": "https://gitlab.com/.../merge_requests/7",
        }
    ]
    with _patch_client([_Resp(json_body=mr_payload)]):
        mrs = await connector.get_merge_requests(1)

    assert len(mrs) == 1
    assert mrs[0]["iid"] == 7
    assert mrs[0]["author"] == "khushi"  # nested user.username flattened
    assert mrs[0]["source_branch"] == "connectors/16-gitlab-connector"
