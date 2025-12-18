"""Orchestrator service that coordinates the full analysis pipeline."""

import asyncio
import logging
import time
from typing import Optional

from app.core.config import settings
from app.core.exceptions import VideoTooLongError
from app.models.schemas import (
    AnalysisResponse,
    VideoMetadata,
    Insight,
    LeanScore,
    ScoreBreakdown,
    AnalysisStatus,
)
from app.services.transcript import TranscriptService, TranscriptResult
from app.services.chunking import ChunkingService, Chunk
from app.services.llm import GroqService
from app.services.insight_processor import InsightProcessor

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    """
    Coordinates the full video analysis pipeline.

    Responsibilities:
    - Orchestrate service calls in correct order
    - Handle parallel processing of chunks
    - Aggregate results into final response
    """

    def __init__(
        self,
        transcript_service: Optional[TranscriptService] = None,
        groq_service: Optional[GroqService] = None,
        chunking_service: Optional[ChunkingService] = None,
        insight_processor: Optional[InsightProcessor] = None,
    ):
        self.transcript_service = transcript_service or TranscriptService()
        self.groq_service = groq_service or GroqService()
        self.chunking_service = chunking_service or ChunkingService()
        self.insight_processor = insight_processor or InsightProcessor()

    async def analyze(self, video_id: str, url: str) -> AnalysisResponse:
        """Execute the full analysis pipeline."""
        start_time = time.time()

        # Step 1: Get video metadata
        logger.info(f"Step 1: Fetching metadata for {video_id}")
        metadata = await self.transcript_service.get_video_metadata(video_id)
        self._validate_video_length(metadata.duration_seconds)

        # Step 2: Fetch transcript
        logger.info(f"Step 2: Fetching transcript for {video_id}")
        transcript_result = await self.transcript_service.get_transcript(video_id)

        # Step 3: Chunk transcript
        logger.info(f"Step 3: Chunking transcript ({transcript_result.word_count} words)")
        chunks = self.chunking_service.chunk_transcript(
            text=transcript_result.text,
            target_tokens=settings.CHUNK_TARGET_TOKENS,
            overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
        )
        logger.info(f"Split transcript into {len(chunks)} chunks")

        # Step 4: Extract insights from chunks (parallel)
        logger.info(f"Step 4: Extracting insights from {len(chunks)} chunks")
        raw_insights = await self._extract_insights_parallel(chunks)
        logger.info(f"Extracted {len(raw_insights)} raw insights")

        # Step 5: Deduplicate and rank insights
        logger.info("Step 5: Processing and ranking insights")
        processed_insights = self.insight_processor.process(
            raw_insights=raw_insights,
            max_top=settings.MAX_TOP_INSIGHTS,
            max_additional=settings.MAX_ADDITIONAL_INSIGHTS,
        )

        # Step 6: Generate summary and LeanScore
        logger.info("Step 6: Generating summary and LeanScore")
        summary_bullets, lean_score_data = await self.groq_service.generate_synthesis(
            transcript_text=transcript_result.text,
            insights=[i.model_dump() for i in processed_insights.all_insights],
            video_title=metadata.title,
            video_duration=metadata.duration_seconds,
        )

        # Step 7: Generate deep dive content for top insights
        logger.info("Step 7: Generating deep dive content")
        top_insights_with_deep_dive = await self._enrich_with_deep_dives(
            insights=processed_insights.top_insights,
            chunks=chunks,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Analysis completed in {processing_time_ms}ms")

        return AnalysisResponse(
            status=AnalysisStatus.COMPLETED,
            metadata=VideoMetadata(
                video_id=video_id,
                title=metadata.title,
                channel_name=metadata.channel_name,
                duration_seconds=metadata.duration_seconds,
                duration_display=self._format_duration(metadata.duration_seconds),
                transcript_source=transcript_result.source,
            ),
            summary_bullets=summary_bullets,
            lean_score=LeanScore(
                score=lean_score_data["score"],
                reason=lean_score_data["reason"],
                breakdown=ScoreBreakdown(**lean_score_data.get("breakdown", {
                    "density": 50,
                    "clarity": 50,
                    "originality": 50,
                    "signal_to_noise": 50,
                })),
            ),
            top_insights=top_insights_with_deep_dive,
            additional_insights=processed_insights.additional_insights,
            processing_time_ms=processing_time_ms,
        )

    async def _extract_insights_parallel(
        self,
        chunks: list[Chunk],
        batch_size: int = 5,
    ) -> list[dict]:
        """Extract insights from chunks with controlled parallelism."""
        all_insights = []
        total_chunks = len(chunks)

        # Process in batches to respect rate limits
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            tasks = [
                self.groq_service.extract_chunk_insights(chunk, total_chunks)
                for chunk in batch
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in batch_results:
                if isinstance(result, Exception):
                    logger.warning(f"Chunk extraction failed: {result}")
                    continue
                all_insights.extend(result)

            # Small delay between batches to avoid rate limits
            if i + batch_size < len(chunks):
                await asyncio.sleep(0.5)

        return all_insights

    async def _enrich_with_deep_dives(
        self,
        insights: list[Insight],
        chunks: list[Chunk],
    ) -> list[Insight]:
        """Add deep dive content to insights."""
        enriched = []

        for insight in insights:
            # Find the source chunk for this insight
            # For now, use a simple heuristic based on rank
            chunk_index = min(insight.rank - 1, len(chunks) - 1)

            # Get context around the chunk
            context_before, context_after = self.chunking_service.get_context_around_chunk(
                chunks, chunk_index, context_chars=500
            )

            # Generate deep dive
            deep_dive = await self.groq_service.generate_deep_dive(
                insight={
                    "title": insight.title,
                    "core_point": insight.core_point,
                    "verbatim_support": insight.supporting_context or "",
                },
                context_before=context_before or chunks[chunk_index].text[:500],
                context_after=context_after or chunks[chunk_index].text[-500:],
            )

            # Create new insight with deep dive content
            enriched.append(
                Insight(
                    id=insight.id,
                    rank=insight.rank,
                    title=insight.title,
                    core_point=insight.core_point,
                    supporting_context=insight.supporting_context,
                    deep_dive_content=deep_dive,
                    is_top_five=insight.is_top_five,
                )
            )

        return enriched

    def _validate_video_length(self, duration_seconds: int) -> None:
        """Validate video is within allowed duration."""
        if duration_seconds > settings.MAX_VIDEO_DURATION_SECONDS:
            raise VideoTooLongError(
                f"Video is {duration_seconds}s, max is {settings.MAX_VIDEO_DURATION_SECONDS}s"
            )

    @staticmethod
    def _format_duration(seconds: int) -> str:
        """Format duration in human-readable format."""
        hours, remainder = divmod(seconds, 3600)
        minutes, secs = divmod(remainder, 60)
        if hours:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        return f"{minutes}:{secs:02d}"
