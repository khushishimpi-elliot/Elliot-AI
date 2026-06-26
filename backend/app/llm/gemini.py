from typing import AsyncIterator

import google.generativeai as genai

from app.llm.base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        genai.configure(api_key=api_key)
        self._model_name = model
        self._client = genai.GenerativeModel(
            model_name=model,
            generation_config=genai.GenerationConfig(
                max_output_tokens=2048,
            ),
        )

    @property
    def model_name(self) -> str:
        return self._model_name

    async def complete(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        prompt = f"{system}\n\n{user}"
        response = await self._client.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
        )
        answer = response.text or ""
        input_tokens = response.usage_metadata.prompt_token_count or 0
        output_tokens = response.usage_metadata.candidates_token_count or 0
        return LLMResponse(
            answer=answer,
            model=self._model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    async def stream(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        prompt = f"{system}\n\n{user}"
        async for chunk in await self._client.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
            stream=True,
        ):
            if chunk.text:
                yield chunk.text
