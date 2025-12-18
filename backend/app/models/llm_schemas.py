"""Pydantic models for LLM response parsing."""

from pydantic import BaseModel, Field
from typing import Literal, Optional


class ChunkInsight(BaseModel):
    """A single insight extracted from a transcript chunk."""

    title: str = Field(..., min_length=3, max_length=150)
    core_point: str = Field(..., min_length=10, max_length=600)
    verbatim_support: str = Field(..., min_length=5, max_length=400)
    confidence: Literal["high", "medium", "low"]


class ChunkExtractionResponse(BaseModel):
    """Response from chunk-level insight extraction."""

    insights: list[ChunkInsight] = Field(default_factory=list, max_length=5)


class ScoreBreakdownLLM(BaseModel):
    """LeanScore breakdown from LLM."""

    density: int = Field(..., ge=0, le=100)
    clarity: int = Field(..., ge=0, le=100)
    originality: int = Field(..., ge=0, le=100)
    signal_to_noise: int = Field(..., ge=0, le=100)


class LeanScoreResultLLM(BaseModel):
    """LeanScore result from LLM."""

    score: int = Field(..., ge=0, le=100)
    reason: str = Field(..., min_length=10, max_length=300)
    breakdown: ScoreBreakdownLLM


class SynthesisResponse(BaseModel):
    """Response from global synthesis (summary + LeanScore)."""

    summary_bullets: list[str] = Field(..., min_length=3, max_length=5)
    lean_score: LeanScoreResultLLM


class LocalContext(BaseModel):
    """Context around an insight for deep dive."""

    before: str
    after: str


class DeepDiveResponse(BaseModel):
    """Response from deep dive generation."""

    extended_explanation: str
    key_arguments: list[str] = Field(..., min_length=1, max_length=5)
    local_context: LocalContext
