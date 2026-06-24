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

from openai import AsyncOpenAI
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
    """Wraps the OpenRouter API call + token usage logging.

    The OpenAI client is injected so tests can mock it cleanly.
    Pass `client=AsyncOpenAI(api_key=...)` in prod, or a mock in tests.
    """

    def __init__(self, client: AsyncOpenAI | None = None, model: str | None = None):
        settings = get_settings()
        self.client = client or AsyncOpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.openrouter_api_key,
        )
        self.model = model or settings.claude_model
        self.max_tokens = settings.max_tokens

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
        api_response = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[
                {"role": "system", "content": prompt.system},
                *prompt.to_messages(),
            ],
            extra_headers={
                "HTTP-Referer": "https://elliot-ai.onrender.com",
                "X-Title": "Elliot-AI",
            },
        )

        answer = api_response.choices[0].message.content
        input_tokens = api_response.usage.prompt_tokens
        output_tokens = api_response.usage.completion_tokens

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
        """Extract text from OpenAI-compatible response."""
        return api_response.choices[0].message.content
