from pydantic import BaseModel


class GDriveFile(BaseModel):
    id: str
    name: str
    mime_type: str
    content: str
    url: str
    modified_at: str
