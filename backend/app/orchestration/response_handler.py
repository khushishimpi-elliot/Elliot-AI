"""Response Handler — call Claude with a BuiltPrompt, return the answer, log tokens.

This is the last step of the orchestration chain:
  Context Planner (#29) -> Prompt Builder (#13, here) -> Response Handler (here)

Inputs:
  - `BuiltPrompt` from `app.orchestration.prompt_builder.build_prompt`
  - identity tuple (user_id, tenant_id, team_id) for token logging
  - optional model override (falls back to settings)

Output: `ResponseHandlerResult` — answer string + token + cost metadata.
Side effect: writes a row to `token_usage_logs` via `token_logger.log_token_usage`.
"""
from dataclasses import dataclass

from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.orchestration.schemas import BuiltPrompt
from app.services.token_logger import calculate_cost, log_token_usage


@dataclass
class ResponseHandlerResult:
    answer: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float


class ResponseHandler:
    """Wraps the Anthropic Messages API call + token usage logging.

    The Anthropic client is injected so tests can mock it cleanly.
    Pass `client=AsyncAnthropic(api_key=...)` in prod, or a mock in tests.
    """

    def __init__(self, client: AsyncAnthropic | None = None, model: str | None = None):
        settings = get_settings()
        self.client = client or AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = model or settings.anthropic_model
        self.max_tokens = settings.anthropic_max_tokens

    async def respond(
        self,
        prompt: BuiltPrompt,
        *,
        db: AsyncSession,
        user_id: str,
        tenant_id: str,
        team_id: str,
        query_type: str = "general",
    ) -> ResponseHandlerResult:
        api_response = await self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=prompt.system,
            messages=prompt.to_messages(),
        )

        answer = self._extract_text(api_response)
        input_tokens = api_response.usage.input_tokens
        output_tokens = api_response.usage.output_tokens

        await log_token_usage(
            db=db,
            user_id=user_id,
            tenant_id=tenant_id,
            team_id=team_id,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            query_type=query_type,
        )

        return ResponseHandlerResult(
            answer=answer,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=calculate_cost(self.model, input_tokens, output_tokens),
        )

    @staticmethod
    def _extract_text(api_response) -> str:
        """Concatenate all text blocks from the response. Anthropic returns a
        list of content blocks; we ignore non-text blocks (e.g. tool_use)
        since this handler is for plain Q&A. Tool-call orchestration is out
        of scope for #31 — add it when we wire LangGraph (#29/#30)."""
        parts = []
        for block in api_response.content:
            if getattr(block, "type", None) == "text":
                parts.append(block.text)
        return "".join(parts)
