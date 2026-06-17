from pydantic import BaseModel


class OrgSummary(BaseModel):
    name: str
    domain: str
    team_size: str | None
    residency: str


class SDLCSummary(BaseModel):
    stack: str | None
    branching_model: str | None
    test_framework: str | None
    coverage_gate: int | None
    ci_cd_platform: str | None
    review_policy: str | None
    arch_style: str | None


class LaunchSummary(BaseModel):
    org: OrgSummary
    sdlc: SDLCSummary | None
    connectors: list[str]
    chunk_count: int
