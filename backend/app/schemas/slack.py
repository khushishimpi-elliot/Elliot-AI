from pydantic import BaseModel


class SlackChannel(BaseModel):
    id: str
    name: str
    topic: str | None
    num_members: int


class SlackMessage(BaseModel):
    text: str
    user: str
    timestamp: str
    channel: str | None
    thread_ts: str | None


class SlackSearchResult(BaseModel):
    text: str
    channel: str
    user: str
    timestamp: str
    permalink: str


class SlackIndexResponse(BaseModel):
    status: str
    message: str
    messages_indexed: int
