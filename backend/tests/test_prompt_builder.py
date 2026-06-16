from app.orchestration.prompt_builder import (
    build_prompt,
    build_system_prompt,
    build_user_prompt,
)
from app.orchestration.schemas import BuiltPrompt, RetrievedChunk
from app.sdlc.schemas import SdlcProfile

SDLC = SdlcProfile(
    primary_stack="Python 3.11 + FastAPI",
    branching_model="trunk-based",
    test_framework="pytest, 90% coverage",
    ci_cd="GitHub Actions -> Render",
    review_policy="1 approval; 2 for auth",
    arch_style="Hexagonal",
)


# ---- system prompt -------------------------------------------------------


def test_system_prompt_includes_all_sdlc_fields():
    prompt = build_system_prompt(SDLC)
    assert "Python 3.11 + FastAPI" in prompt
    assert "trunk-based" in prompt
    assert "pytest, 90% coverage" in prompt
    assert "GitHub Actions -> Render" in prompt
    assert "1 approval; 2 for auth" in prompt
    assert "Hexagonal" in prompt


def test_system_prompt_includes_elliot_role():
    prompt = build_system_prompt(SDLC)
    assert "Elliot-AI" in prompt
    assert "Elliot Systems" in prompt


def test_system_prompt_forbids_fabrication():
    prompt = build_system_prompt(SDLC)
    assert "Never fabricate" in prompt or "do not fabricate" in prompt.lower()


# ---- user prompt ---------------------------------------------------------


def test_user_prompt_includes_query_and_chunks():
    chunks = [
        RetrievedChunk(source="auth/jwt.py:1-20", content="def issue_token():...", score=0.91),
        RetrievedChunk(source="auth/router.py:5-15", content="@router.post(...)", score=0.83),
    ]
    prompt = build_user_prompt("How does login work?", chunks)
    assert "How does login work?" in prompt
    assert "auth/jwt.py:1-20" in prompt
    assert "def issue_token()" in prompt
    assert "auth/router.py:5-15" in prompt
    assert "@router.post(" in prompt


def test_user_prompt_orders_chunks_by_score_descending():
    chunks = [
        RetrievedChunk(source="a.py", content="A", score=0.40),
        RetrievedChunk(source="b.py", content="B", score=0.90),
        RetrievedChunk(source="c.py", content="C", score=0.65),
    ]
    prompt = build_user_prompt("q", chunks)
    pos_a = prompt.index("source: a.py")
    pos_b = prompt.index("source: b.py")
    pos_c = prompt.index("source: c.py")
    assert pos_b < pos_c < pos_a


def test_user_prompt_handles_empty_chunks():
    prompt = build_user_prompt("What is the meaning of foo?", [])
    assert "What is the meaning of foo?" in prompt
    assert "no chunks retrieved" in prompt.lower()
    assert "no codebase context" in prompt.lower()


# ---- combined ------------------------------------------------------------


def test_build_prompt_returns_built_prompt():
    chunks = [RetrievedChunk(source="x.py", content="x", score=1.0)]
    result = build_prompt(SDLC, "hi", chunks)
    assert isinstance(result, BuiltPrompt)
    assert "Elliot-AI" in result.system
    assert "hi" in result.user
    assert "x.py" in result.user


def test_built_prompt_to_messages_format():
    chunks = [RetrievedChunk(source="x.py", content="x", score=1.0)]
    result = build_prompt(SDLC, "hi", chunks)
    messages = result.to_messages()
    assert messages == [{"role": "user", "content": result.user}]


def test_system_and_user_are_separate():
    """SDLC standards must NOT leak into the user prompt and chunks must NOT
    leak into the system prompt — Claude treats them with different trust
    levels."""
    chunks = [RetrievedChunk(source="evil.py", content="UNTRUSTED", score=1.0)]
    result = build_prompt(SDLC, "q", chunks)
    assert "UNTRUSTED" not in result.system
    assert "Engineering standards" not in result.user.lower()  # standards stay in system
