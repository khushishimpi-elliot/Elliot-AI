from pydantic import BaseModel


class JiraIssue(BaseModel):
    key: str
    summary: str
    description: str | None
    status: str
    assignee: str | None
    priority: str | None
    issue_type: str
    created: str
    updated: str


class JiraStatus(BaseModel):
    key: str
    status: str
