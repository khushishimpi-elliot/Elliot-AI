import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_workspace_invalid_residency():
    r = client.post(
        "/workspace",
        json={"name": "Acme", "domain": "acme.com", "residency": "MARS"},
    )
    assert r.status_code == 422


def test_create_workspace_missing_required_fields():
    r = client.post("/workspace", json={"domain": "acme.com"})
    assert r.status_code == 422
