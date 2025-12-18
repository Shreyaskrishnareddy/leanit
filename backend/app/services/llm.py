"""Service for LLM interactions via Groq API."""

import json
import logging
from typing import Optional

from groq import Groq, RateLimitError, APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.exceptions import GroqRateLimitError, GroqAPIError
from app.models.llm_schemas import (
    ChunkExtractionResponse,
    SynthesisResponse,
    DeepDiveResponse,
)
from app.services.chunking import Chunk

logger = logging.getLogger(__name__)


# Prompt Templates
CHUNK_INSIGHT_EXTRACTION_PROMPT = """You are an expert at extracting key insights from educational content. Your task is to identify the most valuable, concrete insights from this transcript segment.

<rules>
1. LITERAL EXTRACTION ONLY: Every insight must be directly stated or clearly implied in the transcript. Never invent, speculate, or add your own conclusions.
2. BE SPECIFIC: Prefer concrete facts, techniques, or claims over vague generalizations.
3. QUOTE WHEN HELPFUL: Include brief direct quotes when they capture the insight well.
4. IGNORE FILLER: Skip small talk, ads, sponsor reads, and repetitive content.
5. CAPTURE ACTIONABLE POINTS: Prioritize insights that teach something or change how someone might think/act.
</rules>

<transcript_segment position="{position_label}" chunk="{chunk_index}_of_{total_chunks}">
{chunk_text}
</transcript_segment>

Extract 2-4 key insights from this segment. For each insight, provide:
- title: A concise headline (5-10 words)
- core_point: The main insight in 1-2 sentences
- verbatim_support: A direct quote or close paraphrase from the transcript that supports this insight
- confidence: Your confidence this insight is accurately extracted (high/medium/low)

Respond with valid JSON only, no other text:
{{"insights": [{{"title": "string", "core_point": "string", "verbatim_support": "string", "confidence": "high|medium|low"}}]}}

If this segment contains no extractable insights (e.g., only small talk or ads), return:
{{"insights": []}}"""


SYNTHESIS_PROMPT = """You are analyzing a video titled "{video_title}" ({duration_display} long).

Your task is to synthesize the extracted insights into a final summary and quality score.

<extracted_insights>
{insights_json}
</extracted_insights>

<transcript_sample>
{transcript_sample}
</transcript_sample>

Generate:

1. SUMMARY (3-5 bullets)
Write 3-5 bullet points that capture the most important takeaways from this video. Each bullet should:
- Be self-contained and valuable on its own
- Reflect what was actually said, not your interpretation
- Be concise but specific (avoid vague statements like "discusses various topics")

2. LEANSCORE (0-100)
Rate the video's learning value on a 0-100 scale based on:
- Information Density (40%): How many distinct, concrete insights per unit time?
- Clarity (30%): How clearly were ideas explained? Was it well-structured?
- Originality (20%): Were the ideas novel/non-obvious, or common knowledge?
- Signal-to-Noise (10%): How much filler, repetition, or off-topic content?

Scoring guide:
- 90-100: Exceptional - dense with novel, clearly explained insights
- 70-89: Strong - good insight density, mostly clear, some original ideas
- 50-69: Average - some valuable content mixed with filler
- 30-49: Below average - sparse insights, unclear, or mostly common knowledge
- 0-29: Poor - very little learning value

3. SCORE JUSTIFICATION
Write ONE sentence explaining the score. Be specific about what made it high or low.

Respond with valid JSON only:
{{"summary_bullets": ["bullet 1", "bullet 2", "bullet 3"], "lean_score": {{"score": 75, "reason": "one sentence explanation", "breakdown": {{"density": 80, "clarity": 75, "originality": 70, "signal_to_noise": 72}}}}}}"""


DEEP_DIVE_PROMPT = """You are expanding on a specific insight from a video transcript.

<insight>
Title: {insight_title}
Core Point: {insight_core_point}
Supporting Quote: {insight_verbatim_support}
</insight>

<surrounding_context>
{local_transcript_context}
</surrounding_context>

Generate a deep dive that helps the user understand this insight more fully. Include:

1. EXTENDED_EXPLANATION (2-3 paragraphs)
Explain the insight in more depth, drawing on what was said in the surrounding context. Include:
- Why this point matters
- Any examples or evidence the speaker provided
- Any nuances or caveats mentioned

2. KEY_ARGUMENTS (2-4 bullets)
List the main arguments or supporting points made around this insight.

3. LOCAL_CONTEXT
Provide a brief summary of what was being discussed immediately before and after this insight, so the user understands the conversational flow.

Respond with valid JSON only:
{{"extended_explanation": "2-3 paragraphs here", "key_arguments": ["argument 1", "argument 2"], "local_context": {{"before": "what was discussed before", "after": "what was discussed after"}}}}"""


class GroqService:
    """
    Service for LLM interactions via Groq API.

    Uses fast model (8B) for chunk extraction and quality model (70B) for synthesis.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.fast_model = settings.GROQ_MODEL_FAST
        self.quality_model = settings.GROQ_MODEL_QUALITY

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(RateLimitError),
    )
    async def extract_chunk_insights(
        self, chunk: Chunk, total_chunks: int
    ) -> list[dict]:
        """
        Extract insights from a single transcript chunk.

        Args:
            chunk: The transcript chunk to process
            total_chunks: Total number of chunks for context

        Returns:
            List of insight dictionaries
        """
        if not self.client:
            raise GroqAPIError("Groq API key not configured")

        prompt = CHUNK_INSIGHT_EXTRACTION_PROMPT.format(
            position_label=chunk.position_label,
            chunk_index=chunk.index + 1,
            total_chunks=total_chunks,
            chunk_text=chunk.text,
        )

        try:
            response = self.client.chat.completions.create(
                model=self.fast_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise insight extractor. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            # Validate with Pydantic
            validated = ChunkExtractionResponse(**parsed)

            # Add chunk metadata to each insight
            insights = []
            for insight in validated.insights:
                insights.append(
                    {
                        **insight.model_dump(),
                        "chunk_index": chunk.index,
                        "position_label": chunk.position_label,
                    }
                )

            logger.debug(f"Extracted {len(insights)} insights from chunk {chunk.index}")
            return insights

        except RateLimitError:
            logger.warning("Groq rate limit hit, will retry")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            return []
        except Exception as e:
            logger.error(f"Error extracting insights from chunk {chunk.index}: {e}")
            return []

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(RateLimitError),
    )
    async def generate_synthesis(
        self,
        transcript_text: str,
        insights: list[dict],
        video_title: str,
        video_duration: int,
    ) -> tuple[list[str], dict]:
        """
        Generate summary bullets and LeanScore.

        Args:
            transcript_text: Full transcript
            insights: List of extracted insights
            video_title: Video title
            video_duration: Duration in seconds

        Returns:
            Tuple of (summary_bullets, lean_score_dict)
        """
        if not self.client:
            raise GroqAPIError("Groq API key not configured")

        # Format duration for display
        hours, remainder = divmod(video_duration, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours:
            duration_display = f"{hours}h {minutes}m"
        else:
            duration_display = f"{minutes}m {seconds}s"

        # Prepare insights JSON (limit to avoid token overflow)
        insights_for_prompt = insights[:20]  # Top insights only
        insights_json = json.dumps(
            [
                {"title": i.get("title"), "core_point": i.get("core_point")}
                for i in insights_for_prompt
            ],
            indent=2,
        )

        # Get transcript sample (beginning, middle, end)
        text_len = len(transcript_text)
        sample_size = 1000
        transcript_sample = f"""[Beginning]: {transcript_text[:sample_size]}...

[Middle]: ...{transcript_text[text_len//2 - sample_size//2 : text_len//2 + sample_size//2]}...

[End]: ...{transcript_text[-sample_size:]}"""

        prompt = SYNTHESIS_PROMPT.format(
            video_title=video_title,
            duration_display=duration_display,
            insights_json=insights_json,
            transcript_sample=transcript_sample,
        )

        try:
            response = self.client.chat.completions.create(
                model=self.quality_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a content analyst. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            # Validate with Pydantic
            validated = SynthesisResponse(**parsed)

            return validated.summary_bullets, validated.lean_score.model_dump()

        except RateLimitError:
            logger.warning("Groq rate limit hit during synthesis, will retry")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse synthesis response: {e}")
            # Return defaults
            return (
                ["Summary unavailable due to processing error"],
                {
                    "score": 50,
                    "reason": "Score unavailable due to processing error",
                    "breakdown": {
                        "density": 50,
                        "clarity": 50,
                        "originality": 50,
                        "signal_to_noise": 50,
                    },
                },
            )

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=15),
        retry=retry_if_exception_type(RateLimitError),
    )
    async def generate_deep_dive(
        self,
        insight: dict,
        context_before: str,
        context_after: str,
    ) -> Optional[dict]:
        """
        Generate deep dive content for an insight.

        Args:
            insight: The insight to expand
            context_before: Transcript text before the insight
            context_after: Transcript text after the insight

        Returns:
            Deep dive content dictionary
        """
        if not self.client:
            return None

        local_context = f"""[Before]: {context_before}

[The insight appears here]

[After]: {context_after}"""

        prompt = DEEP_DIVE_PROMPT.format(
            insight_title=insight.get("title", ""),
            insight_core_point=insight.get("core_point", ""),
            insight_verbatim_support=insight.get("verbatim_support", ""),
            local_transcript_context=local_context,
        )

        try:
            response = self.client.chat.completions.create(
                model=self.fast_model,  # Use fast model for deep dives
                messages=[
                    {
                        "role": "system",
                        "content": "You are an educational content expander. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            # Validate with Pydantic
            validated = DeepDiveResponse(**parsed)
            return validated.model_dump()

        except Exception as e:
            logger.error(f"Error generating deep dive: {e}")
            return None

    async def check_health(self) -> bool:
        """Check if Groq API is available."""
        if not self.client:
            return False

        try:
            # Simple test call
            self.client.chat.completions.create(
                model=self.fast_model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
            )
            return True
        except Exception:
            return False
