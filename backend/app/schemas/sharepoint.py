from pydantic import BaseModel


class SharePointSite(BaseModel):
    id: str
    name: str
    url: str
    description: str


class SharePointDocument(BaseModel):
    id: str
    name: str
    content: str
    url: str
    last_modified: str
