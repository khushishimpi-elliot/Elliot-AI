from pydantic import BaseModel


class GitLabProject(BaseModel):
    id: int
    name: str
    path_with_namespace: str
    description: str | None
    default_branch: str | None
    visibility: str
    web_url: str


class GitLabFile(BaseModel):
    path: str
    content: str


class GitLabMR(BaseModel):
    iid: int
    title: str
    description: str | None
    author: str
    state: str
    created_at: str
    updated_at: str
    source_branch: str
    target_branch: str
    web_url: str


class GitLabIndexResponse(BaseModel):
    status: str
    message: str
    files_indexed: int
