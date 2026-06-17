from pydantic import BaseModel


class LinearTeam(BaseModel):
    id: str
    key: str
    name: str


class LinearIssue(BaseModel):
    id: str
    identifier: str  # e.g. "ENG-123"
    title: str
    description: str | None
    state: str  # workflow state name
    priority: int  # 0=No priority, 1=Urgent, 2=High, 3=Normal, 4=Low
    url: str
    assignee: str | None
    team_key: str
    created_at: str
    updated_at: str
