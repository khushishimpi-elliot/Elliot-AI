from pydantic import BaseModel


class ClickUpTask(BaseModel):
    id: str
    name: str
    status: str
    assignees: list[str]
    due_date: str | None
    priority: str | None
    list_name: str
    url: str


class ClickUpComment(BaseModel):
    id: str
    comment_text: str
    author: str
    date: str
