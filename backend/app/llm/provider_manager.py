from functools import lru_cache

from app.config import get_settings
from app.llm.base import BaseLLMProvider


def _build_provider(provider: str) -> BaseLLMProvider:
    settings = get_settings()

    if provider == "claude":
        from app.llm.claude import ClaudeProvider
        return ClaudeProvider(
            api_key=settings.anthropic_api_key,
            model=settings.anthropic_model,
        )

    if provider == "openai":
        from app.llm.openai import OpenAIProvider
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            model=getattr(settings, "openai_model", "gpt-4o"),
        )

    if provider == "gemini":
        from app.llm.gemini import GeminiProvider
        return GeminiProvider(
            api_key=getattr(settings, "gemini_api_key", ""),
            model=getattr(settings, "gemini_model", "gemini-1.5-pro"),
        )

    if provider == "groq":
        from app.llm.groq import GroqProvider
        return GroqProvider(
            api_key=getattr(settings, "groq_api_key", ""),
            model=getattr(settings, "groq_model", "llama-3.3-70b-versatile"),
        )

    raise ValueError(f"Unknown LLM provider: {provider!r}")


class ProviderManager:
    """Single entry point for getting the active LLM provider.

    Reads LLM_PROVIDER from settings (defaults to 'claude') and returns
    the matching BaseLLMProvider. Instance is cached per provider name.
    """

    _cache: dict[str, BaseLLMProvider] = {}

    @classmethod
    def get(cls, provider: str | None = None) -> BaseLLMProvider:
        settings = get_settings()
        name = provider or getattr(settings, "llm_provider", "claude")
        if name not in cls._cache:
            cls._cache[name] = _build_provider(name)
        return cls._cache[name]
