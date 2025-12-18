"""API routes for LeanIt backend."""

import logging
import time

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.core.exceptions import (
    VideoNotFoundError,
    VideoTooLongError,
    TranscriptUnavailableError,
    GroqRateLimitError,
    InvalidURLError,
)
from app.models.schemas import (
    AnalyzeRequest,
    AnalysisResponse,
    ErrorDetail,
    HealthResponse,
)
from app.services.orchestrator import AnalysisOrchestrator
from app.services.transcript import TranscriptService
from app.services.llm import GroqService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analysis"])

# Initialize services (singleton pattern)
transcript_service = TranscriptService()
groq_service = GroqService()
orchestrator = AnalysisOrchestrator(
    transcript_service=transcript_service,
    groq_service=groq_service,
)


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={
        400: {"model": ErrorDetail, "description": "Invalid request"},
        404: {"model": ErrorDetail, "description": "Video not found"},
        422: {"model": ErrorDetail, "description": "Video cannot be processed"},
        500: {"model": ErrorDetail, "description": "Internal server error"},
        503: {"model": ErrorDetail, "description": "Service unavailable"},
    },
)
async def analyze_video(request: AnalyzeRequest) -> AnalysisResponse:
    """
    Analyze a YouTube video and extract insights.

    This endpoint:
    1. Fetches the video transcript (YouTube captions or Whisper STT)
    2. Chunks the transcript for parallel processing
    3. Extracts insights from each chunk via LLM
    4. Deduplicates and ranks insights
    5. Generates summary and LeanScore

    Processing time: 30-90 seconds depending on video length.
    Maximum video length: 2 hours.
    """
    start_time = time.time()

    try:
        video_id = request.extract_video_id()
        logger.info(f"Starting analysis for video: {video_id}")

        # Run the full analysis pipeline
        result = await orchestrator.analyze(video_id=video_id, url=request.url)

        processing_time_ms = int((time.time() - start_time) * 1000)
        result.processing_time_ms = processing_time_ms

        logger.info(f"Analysis completed for {video_id} in {processing_time_ms}ms")
        return result

    except ValueError as e:
        # URL validation error
        logger.warning(f"Invalid URL: {request.url} - {e}")
        raise HTTPException(
            status_code=400,
            detail=ErrorDetail(
                error="Invalid YouTube URL",
                error_code="INVALID_URL",
                details=str(e),
            ).model_dump(),
        )

    except VideoNotFoundError as e:
        logger.warning(f"Video not found: {request.url}")
        raise HTTPException(
            status_code=404,
            detail=ErrorDetail(
                error="Video not found",
                error_code="VIDEO_NOT_FOUND",
                details=e.details,
            ).model_dump(),
        )

    except VideoTooLongError as e:
        logger.warning(f"Video too long: {request.url}")
        raise HTTPException(
            status_code=422,
            detail=ErrorDetail(
                error=f"Video exceeds maximum length ({settings.MAX_VIDEO_DURATION_SECONDS // 3600} hours)",
                error_code="VIDEO_TOO_LONG",
                details=e.details,
            ).model_dump(),
        )

    except TranscriptUnavailableError as e:
        logger.error(f"Transcript unavailable: {request.url}")
        raise HTTPException(
            status_code=422,
            detail=ErrorDetail(
                error="Could not obtain transcript",
                error_code="TRANSCRIPT_UNAVAILABLE",
                details=e.details,
            ).model_dump(),
        )

    except GroqRateLimitError as e:
        logger.error(f"Groq rate limit hit: {e}")
        raise HTTPException(
            status_code=503,
            detail=ErrorDetail(
                error="Analysis service temporarily unavailable",
                error_code="RATE_LIMITED",
                details="Please try again in a few minutes",
            ).model_dump(),
        )

    except Exception as e:
        logger.exception(f"Unexpected error analyzing {request.url}")
        raise HTTPException(
            status_code=500,
            detail=ErrorDetail(
                error="Internal server error",
                error_code="INTERNAL_ERROR",
                details=str(e) if settings.DEBUG else None,
            ).model_dump(),
        )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check service health and dependency availability."""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        groq_available=await groq_service.check_health(),
        whisper_available=await transcript_service.check_whisper_health(),
    )
