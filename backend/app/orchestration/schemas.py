"""Shared types for the orchestration layer."""
from dataclasses import dataclass


@dataclass
class RetrievedChunk:
    """A chunk returned from the pgvector index (task #22 onwards)."""

    source: str  # e.g. "github://elliotsystems/payments/src/auth/jwt.py:42-78"
    content: str
    score: float = 0.0


@dataclass
class BuiltPrompt:
    """A prompt ready to send to Claude.

    `system` goes in the Anthropic API `system` field.
    `to_messages()` returns the `messages` field.
    """

    system: str
    user: str

    def to_messages(self) -> list[dict]:
        return [{"role": "user", "content": self.user}]
