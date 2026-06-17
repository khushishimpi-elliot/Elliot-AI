from pydantic import BaseModel, ConfigDict


class WebhookResponse(BaseModel):
    """Response from webhook processing"""

    files_updated: int
    files_deleted: int
    chunks_created: int
    chunks_deleted: int
    repo: str
    pusher: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class TestWebhookRequest(BaseModel):
    """Request for manual webhook testing"""

    repo: str
    files: list[dict]  # [{ filepath, content }]
