from pydantic import BaseModel


class BitbucketRepo(BaseModel):
    name: str
    slug: str
    description: str | None
    workspace: str
    is_private: bool


class BitbucketFile(BaseModel):
    path: str
    content: str


class BitbucketPR(BaseModel):
    id: int
    title: str
    description: str | None
    author: str
    state: str
    created_on: str
    updated_on: str
    source_branch: str | None
    dest_branch: str | None


class BitbucketIndexResponse(BaseModel):
    status: str
    message: str
    files_indexed: int
