"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum
import re


class TranscriptSource(str, Enum):
    YOUTUBE_CAPTIONS = "youtube_captions"
    WHISPER_STT = "whisper_stt"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# Request Models
class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")

    @field_validator("url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        youtube_patterns = [
            r"^https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})",
            r"^https?://youtu\.be/([a-zA-Z0-9_-]{11})",
            r"^https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})",
            r"^https?://(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11})",
        ]
        for pattern in youtube_patterns:
            if re.match(pattern, v):
                return v
        raise ValueError("Invalid YouTube URL format")

    def extract_video_id(self) -> str:
        """Extract the 11-character video ID from the URL."""
        patterns = [
            r"v=([a-zA-Z0-9_-]{11})",
            r"youtu\.be/([a-zA-Z0-9_-]{11})",
            r"embed/([a-zA-Z0-9_-]{11})",
            r"/v/([a-zA-Z0-9_-]{11})",
        ]
        for pattern in patterns:
            match = re.search(pattern, self.url)
            if match:
                return match.group(1)
        raise ValueError("Could not extract video ID")


# Response Models
class Insight(BaseModel):
    id: str = Field(..., description="Unique insight identifier")
    rank: int = Field(..., ge=1, le=30, description="Importance rank (1 = most important)")
    title: str = Field(..., max_length=200, description="Short headline for the insight")
    core_point: str = Field(..., description="1-2 sentence core insight")
    supporting_context: Optional[str] = Field(None, description="Additional transcript context")
    deep_dive_content: Optional[dict] = Field(None, description="Extended explanation")
    is_top_five: bool = Field(..., description="Whether this is a top-5 insight")


class ScoreBreakdown(BaseModel):
    density: int = Field(..., ge=0, le=100)
    clarity: int = Field(..., ge=0, le=100)
    originality: int = Field(..., ge=0, le=100)
    signal_to_noise: int = Field(..., ge=0, le=100)


class LeanScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Content quality score")
    reason: str = Field(..., description="One-line justification for the score")
    breakdown: Optional[ScoreBreakdown] = Field(
        None, description="Optional breakdown of scoring factors"
    )


class VideoMetadata(BaseModel):
    video_id: str
    title: str
    channel_name: str
    duration_seconds: int
    duration_display: str  # e.g., "1:23:45"
    transcript_source: TranscriptSource


class AnalysisResponse(BaseModel):
    status: AnalysisStatus
    metadata: VideoMetadata
    summary_bullets: list[str] = Field(..., min_length=3, max_length=5)
    lean_score: LeanScore
    top_insights: list[Insight] = Field(..., max_length=5)
    additional_insights: list[Insight] = Field(default_factory=list, max_length=15)
    processing_time_ms: int


class ErrorDetail(BaseModel):
    error: str
    error_code: str
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    groq_available: bool
    whisper_available: bool
