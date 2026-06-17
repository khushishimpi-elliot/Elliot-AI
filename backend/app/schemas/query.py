from pydantic import BaseModel, ConfigDict


class QueryRequest(BaseModel):
    """Request to query Elliot"""

    query: str
    tenant_id: str
    user_id: str
    team_id: str
    repo: str | None = None
    branch: str | None = None


class SourceUsage(BaseModel):
    """Sources used in the response"""

    code_chunks: int
    jira_tickets: int
    slack_messages: int


class TokenUsage(BaseModel):
    """Token usage statistics"""

    input: int
    output: int
    cost_usd: float


class QueryResponse(BaseModel):
    """Response from Elliot"""

    response: str
    query_type: str
    sources_used: SourceUsage
    tokens: TokenUsage

    model_config = ConfigDict(from_attributes=True)
