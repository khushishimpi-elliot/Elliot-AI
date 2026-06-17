from pydantic import BaseModel


class GitHubRepo(BaseModel):
    name: str
    full_name: str
    description: str | None
    owner: str
    is_private: bool
    default_branch: str


class GitHubFile(BaseModel):
    path: str
    content: str


class GitHubPR(BaseModel):
    id: int
    title: str
    body: str | None
    author: str
    state: str
    created_at: str
    updated_at: str
    head_branch: str | None
    base_branch: str | None


class GitHubWebhookResponse(BaseModel):
    status: str


class GitHubIndexResponse(BaseModel):
    status: str
    message: str
    files_indexed: int
