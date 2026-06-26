from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class LLMResponse:
    answer: str
    model: str
    input_tokens: int
    output_tokens: int


class BaseLLMProvider(ABC):
    """Abstract base every LLM provider must implement."""

    @abstractmethod
    async def complete(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Return a full (non-streaming) response."""

    @abstractmethod
    async def stream(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Yield response text tokens one by one."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Canonical model identifier used for token logging."""
