"""Compose the prompt Elliot sends to Claude.

Three inputs:
  - SdlcProfile: the team's engineering standards (task #11)
  - list[RetrievedChunk]: top-K results from pgvector (task #22+)
  - query: the developer's question

Output: a BuiltPrompt with `system` + `user` strings, ready for the
Anthropic Messages API.

The system prompt frames Elliot's role and enforces SDLC standards.
The user prompt presents the retrieved context, then the question.
"""
from app.orchestration.schemas import BuiltPrompt, RetrievedChunk
from app.sdlc.schemas import SdlcProfile

ELLIOT_SYSTEM_PREAMBLE = (
    "You are Elliot-AI, an AI coding assistant for engineering teams at "
    "Elliot Systems. Answer grounded in the CODEBASE CONTEXT provided. "
    "Never fabricate file paths, function names, APIs, or behavior. "
    "If the context is insufficient, say so explicitly rather than guessing."
)


def build_system_prompt(sdlc: SdlcProfile) -> str:
    return (
        f"{ELLIOT_SYSTEM_PREAMBLE}\n\n"
        "ENGINEERING STANDARDS (enforce in every suggestion):\n"
        f"- Primary stack: {sdlc.primary_stack}\n"
        f"- Branching model: {sdlc.branching_model}\n"
        f"- Tests: {sdlc.test_framework}\n"
        f"- CI/CD: {sdlc.ci_cd}\n"
        f"- Code review: {sdlc.review_policy}\n"
        f"- Architecture: {sdlc.arch_style}\n\n"
        "Any code you generate MUST follow these standards. "
        "Reference the source of every claim by file path + line range "
        "from the CODEBASE CONTEXT block."
    )


def _format_chunks(chunks: list[RetrievedChunk]) -> str:
    """Render retrieved chunks as a single block.

    Each chunk is fenced with its source so the model can cite it.
    Chunks are presented in descending-score order.
    """
    ordered = sorted(chunks, key=lambda c: c.score, reverse=True)
    blocks = []
    for i, c in enumerate(ordered, 1):
        blocks.append(
            f"[chunk {i} | source: {c.source} | score: {c.score:.3f}]\n{c.content}"
        )
    return "\n\n".join(blocks)


def build_user_prompt(query: str, chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return (
            "CODEBASE CONTEXT: (no chunks retrieved)\n\n"
            f"QUESTION: {query}\n\n"
            "Answer using only general engineering knowledge and the SDLC "
            "standards from the system prompt. State explicitly that no "
            "codebase context was available."
        )

    return (
        f"CODEBASE CONTEXT:\n{_format_chunks(chunks)}\n\n"
        f"QUESTION: {query}"
    )


def build_prompt(
    sdlc: SdlcProfile,
    query: str,
    chunks: list[RetrievedChunk],
) -> BuiltPrompt:
    return BuiltPrompt(
        system=build_system_prompt(sdlc),
        user=build_user_prompt(query, chunks),
    )
