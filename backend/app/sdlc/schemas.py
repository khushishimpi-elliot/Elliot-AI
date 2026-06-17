"""SDLC profile — the team's engineering standards.

Minimal Pydantic model used by the prompt builder (task #13).
Canonical DB schema + CRUD endpoint land in tasks #11 and #12. Keep this
model in sync with the SQLAlchemy model when #11 lands.
"""
from pydantic import BaseModel, Field


class SdlcProfile(BaseModel):
    """The engineering standards Elliot enforces in every suggestion.

    All fields are short free-text — they're injected verbatim into the
    system prompt, so phrase them as you'd want Claude to read them.
    """

    primary_stack: str = Field(
        ..., description="e.g. 'Python 3.11 + FastAPI + SQLAlchemy 2 + Postgres'"
    )
    branching_model: str = Field(
        ..., description="e.g. 'trunk-based; short-lived feature branches off main'"
    )
    test_framework: str = Field(
        ..., description="e.g. 'pytest with 90% line coverage gate'"
    )
    ci_cd: str = Field(..., description="e.g. 'GitHub Actions -> Render'")
    review_policy: str = Field(
        ...,
        description="e.g. '1 approval; 2 for auth and orchestration modules'",
    )
    arch_style: str = Field(..., description="e.g. 'Hexagonal' or 'Layered'")
