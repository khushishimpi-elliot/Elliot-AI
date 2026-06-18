from pydantic import BaseModel


class NotionPage(BaseModel):
    id: str
    title: str
    content: str
    url: str
    last_edited: str


class NotionDatabase(BaseModel):
    id: str
    title: str
    entries: list[dict]
    url: str
