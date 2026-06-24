"""Unit tests for the Response Handler.

Mocks the Anthropic client and the token logger so no real API call or DB
write happens. Verifies: prompt is passed through correctly, tokens flow
into the logger, cost is computed, text blocks are extracted, non-text
blocks are ignored.
"""
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.orchestration.prompt_builder import build_prompt
from app.orchestration.response_handler import ResponseHandler, ResponseHandlerResult
from app.orchestration.schemas import RetrievedChunk
from app.sdlc.schemas import SdlcProfile

SDLC = SdlcProfile(
    primary_stack="Python 3.11 + FastAPI",
    branching_model="trunk-based",
    test_framework="pytest 90%",
    ci_cd="GitHub Actions",
    review_policy="1 approval",
    arch_style="Hexagonal",
)


def _api_response(text="Here is the answer.", input_tokens=120, output_tokens=45):
    """Build a fake OpenAI chat completions API response with the shape the SDK returns."""
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=text))],
        usage=SimpleNamespace(prompt_tokens=input_tokens, completion_tokens=output_tokens),
        model="anthropic/claude-sonnet-4-6",
    )


def _make_client(response):
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=response)
    return client


def _ids():
    return {
        "user_id": str(uuid.uuid4()),
        "tenant_id": str(uuid.uuid4()),
        "team_id": str(uuid.uuid4()),
    }


# ---- happy path ----------------------------------------------------------


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_respond_returns_text_and_token_counts(mock_log):
    client = _make_client(_api_response(text="JWT auth uses AuthGuard.ts."))
    handler = ResponseHandler(client=client, model="claude-sonnet-4-6")

    prompt = build_prompt(
        SDLC,
        "How does auth work?",
        [RetrievedChunk(source="auth/jwt.py:1-10", content="def issue(): ...", score=0.9)],
    )

    result = await handler.respond(
        prompt, db=AsyncMock(), **_ids(), query_type="code"
    )

    assert isinstance(result, ResponseHandlerResult)
    assert result.answer == "JWT auth uses AuthGuard.ts."
    assert result.model == "claude-sonnet-4-6"
    assert result.input_tokens == 120
    assert result.output_tokens == 45
    assert result.cost_usd > 0  # 120 input + 45 output at $3 + $15 / 1M = real number


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_respond_logs_tokens_with_correct_identity(mock_log):
    client = _make_client(_api_response(input_tokens=200, output_tokens=80))
    handler = ResponseHandler(client=client, model="claude-sonnet-4-6")

    ids = _ids()
    prompt = build_prompt(SDLC, "q?", [])

    await handler.respond(prompt, db=AsyncMock(), **ids, query_type="docs")

    assert mock_log.await_count == 1
    call_kwargs = mock_log.call_args.kwargs
    assert call_kwargs["user_id"] == ids["user_id"]
    assert call_kwargs["tenant_id"] == ids["tenant_id"]
    assert call_kwargs["team_id"] == ids["team_id"]
    assert call_kwargs["model"] == "claude-sonnet-4-6"
    assert call_kwargs["input_tokens"] == 200
    assert call_kwargs["output_tokens"] == 80
    assert call_kwargs["query_type"] == "docs"


# ---- prompt passthrough --------------------------------------------------


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_respond_passes_built_prompt_to_anthropic(mock_log):
    client = _make_client(_api_response())
    handler = ResponseHandler(client=client)

    prompt = build_prompt(SDLC, "how is auth done?", [])
    await handler.respond(prompt, db=AsyncMock(), **_ids())

    call_kwargs = client.chat.completions.create.call_args.kwargs
    # OpenAI format: system message is included in messages array
    assert call_kwargs["messages"][0]["role"] == "system"
    assert call_kwargs["messages"][0]["content"] == prompt.system
    assert "max_tokens" in call_kwargs


# ---- text extraction ----------------------------------------------------


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_concatenates_multiple_text_blocks(mock_log):
    # OpenAI API returns single text in message.content
    multi_response = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="Part 1. Part 2."))],
        usage=SimpleNamespace(prompt_tokens=1, completion_tokens=1),
    )
    handler = ResponseHandler(client=_make_client(multi_response))

    result = await handler.respond(
        build_prompt(SDLC, "q", []), db=AsyncMock(), **_ids()
    )

    assert result.answer == "Part 1. Part 2."


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_ignores_non_text_blocks(mock_log):
    # OpenAI API returns text directly in message.content
    response = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="real answer"))],
        usage=SimpleNamespace(prompt_tokens=1, completion_tokens=1),
    )
    handler = ResponseHandler(client=_make_client(response))

    result = await handler.respond(
        build_prompt(SDLC, "q", []), db=AsyncMock(), **_ids()
    )

    assert result.answer == "real answer"


# ---- cost calculation ----------------------------------------------------


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_cost_matches_pricing_table(mock_log):
    """1_000_000 input + 1_000_000 output on anthropic/claude-sonnet-4-6 (3 + 15 per 1M) = $18."""
    client = _make_client(
        _api_response(input_tokens=1_000_000, output_tokens=1_000_000)
    )
    handler = ResponseHandler(client=client, model="anthropic/claude-sonnet-4-6")

    result = await handler.respond(
        build_prompt(SDLC, "q", []), db=AsyncMock(), **_ids()
    )

    assert result.cost_usd == pytest.approx(18.0, rel=1e-6)


@patch("app.orchestration.response_handler.log_token_usage", new_callable=AsyncMock)
async def test_unknown_model_falls_back_to_default_pricing(mock_log):
    """An unknown model id should still produce a real (non-zero) cost via the
    default pricing in token_logger.calculate_cost."""
    client = _make_client(
        _api_response(input_tokens=1_000_000, output_tokens=1_000_000)
    )
    handler = ResponseHandler(client=client, model="claude-future-99")

    result = await handler.respond(
        build_prompt(SDLC, "q", []), db=AsyncMock(), **_ids()
    )

    assert result.cost_usd > 0
