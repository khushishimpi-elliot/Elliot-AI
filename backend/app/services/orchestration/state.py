import operator
from typing import Annotated, TypedDict


class AgentState(TypedDict):
    """LangGraph agent state for context planning and LLM orchestration"""

    # Input
    query: str
    tenant_id: str
    user_id: str
    team_id: str
    repo: str | None
    branch: str | None

    # Context planning decisions
    needs_code: bool
    needs_jira: bool
    needs_slack: bool
    needs_docs: bool
    query_type: str

    # Retrieved context — use Annotated with operator.add for parallel updates
    code_chunks: Annotated[list[dict], operator.add]
    jira_tickets: Annotated[list[dict], operator.add]
    slack_messages: Annotated[list[dict], operator.add]
    sdlc_profile: dict | None

    # Output
    prompt: str | None
    response: str | None
    input_tokens: int
    output_tokens: int
    error: str | None
