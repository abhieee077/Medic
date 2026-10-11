"""Provider-independent AI interface for Medic.

Everything the AI produces is a draft for a qualified radiologist to review.
Swap providers (e.g. MedGemma) by adding another class with the same methods
and returning it from get_provider().
"""

import os
from dataclasses import dataclass
from typing import Literal, Protocol

from pydantic import BaseModel, Field


class Observation(BaseModel):
    title: str = Field(description="Short name of the observation.")
    description: str = Field(description="What is seen and where, in radiology language.")
    body_region: str = Field(description="Anatomical region, e.g. 'right lower lobe'.")
    significance: Literal["normal", "incidental", "needs_attention", "urgent"]
    confidence: float = Field(description="0 to 1: how confident the observation is, given the limited slices.")


class DraftReport(BaseModel):
    findings: str = Field(description="Draft FINDINGS section, written as a radiology report.")
    impression: str = Field(description="Draft IMPRESSION section: concise, numbered if several points.")
    observations: list[Observation]
    limitations: str = Field(description="What limits this draft (slices reviewed, missing history, image quality).")
    recommendations: list[str] = Field(description="Suggested next steps for the radiologist; may be empty.")


@dataclass
class AnalysisResult:
    draft: DraftReport
    model: str


@dataclass
class ChatTurn:
    role: Literal["user", "assistant"]
    content: str


class AIError(Exception):
    """A provider failure with a message that is safe to show to the user."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AIProvider(Protocol):
    name: str
    model: str

    def analyze_study(self, images: list[bytes], context: str) -> AnalysisResult: ...

    def chat(self, turns: list[ChatTurn], context: str) -> str: ...


def get_provider() -> AIProvider | None:
    """Return the configured provider, or None when AI is not set up."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        return None

    from app.ai.claude_provider import ClaudeProvider

    return ClaudeProvider()
