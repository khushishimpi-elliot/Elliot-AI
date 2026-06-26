from pydantic import BaseModel


class ConfluenceSpace(BaseModel):
    key: str
    name: str
    description: str
    url: str


class ConfluencePage(BaseModel):
    id: str
    title: str
    content: str
    space_key: str
    url: str
    last_modified: str
