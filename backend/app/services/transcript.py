"""Service for fetching video transcripts from YouTube."""

import logging
import re
from dataclasses import dataclass
from typing import Optional

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import httpx

from app.core.config import settings
from app.core.exceptions import (
    VideoNotFoundError,
    TranscriptUnavailableError,
    VideoTooLongError,
)
from app.models.schemas import TranscriptSource

logger = logging.getLogger(__name__)


@dataclass
class VideoMetadata:
    """Basic video metadata from YouTube."""

    video_id: str
    title: str
    channel_name: str
    duration_seconds: int


@dataclass
class TranscriptResult:
    """Result of transcript fetching."""

    text: str
    source: TranscriptSource
    word_count: int


class TranscriptService:
    """
    Service for fetching YouTube video transcripts.

    Tries YouTube captions first, falls back to Whisper STT if unavailable.
    """

    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)

    async def get_video_metadata(self, video_id: str) -> VideoMetadata:
        """
        Fetch basic video metadata from YouTube.

        Uses oEmbed endpoint which doesn't require API key.
        """
        try:
            # Use YouTube's oEmbed endpoint for basic metadata
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            response = await self.http_client.get(oembed_url)

            if response.status_code == 404:
                raise VideoNotFoundError(f"Video {video_id} not found")

            response.raise_for_status()
            data = response.json()

            # Get duration from video page (oEmbed doesn't include it)
            duration = await self._get_video_duration(video_id)

            return VideoMetadata(
                video_id=video_id,
                title=data.get("title", "Unknown Title"),
                channel_name=data.get("author_name", "Unknown Channel"),
                duration_seconds=duration,
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise VideoNotFoundError(f"Video {video_id} not found")
            raise

    async def _get_video_duration(self, video_id: str) -> int:
        """
        Get video duration by parsing the watch page.

        This is a workaround since oEmbed doesn't provide duration.
        """
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            response = await self.http_client.get(url)
            response.raise_for_status()
            html = response.text

            # Look for duration in the page content
            # Pattern: "lengthSeconds":"1234"
            match = re.search(r'"lengthSeconds":"(\d+)"', html)
            if match:
                return int(match.group(1))

            # Alternative pattern: "duration":"PT1H23M45S"
            match = re.search(r'"duration":"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"', html)
            if match:
                hours = int(match.group(1) or 0)
                minutes = int(match.group(2) or 0)
                seconds = int(match.group(3) or 0)
                return hours * 3600 + minutes * 60 + seconds

            # Default to 0 if we can't find duration
            logger.warning(f"Could not extract duration for video {video_id}")
            return 0

        except Exception as e:
            logger.warning(f"Error getting video duration: {e}")
            return 0

    async def get_transcript(self, video_id: str) -> TranscriptResult:
        """
        Fetch transcript for a video.

        Tries YouTube captions first, falls back to Whisper if unavailable.
        """
        # First, check video duration
        metadata = await self.get_video_metadata(video_id)
        if metadata.duration_seconds > settings.MAX_VIDEO_DURATION_SECONDS:
            raise VideoTooLongError(
                f"Video is {metadata.duration_seconds}s, maximum is {settings.MAX_VIDEO_DURATION_SECONDS}s"
            )

        # Try YouTube captions first
        try:
            transcript = await self._get_youtube_transcript(video_id)
            if transcript:
                return transcript
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.info(f"YouTube captions unavailable for {video_id}: {e}")

        # Fall back to Whisper
        try:
            transcript = await self._get_whisper_transcript(video_id)
            if transcript:
                return transcript
        except Exception as e:
            logger.error(f"Whisper transcription failed for {video_id}: {e}")

        raise TranscriptUnavailableError(
            f"Could not obtain transcript for video {video_id}",
            details="Neither YouTube captions nor speech-to-text were available.",
        )

    async def _get_youtube_transcript(self, video_id: str) -> Optional[TranscriptResult]:
        """Fetch transcript from YouTube captions."""
        try:
            # Create API instance (new API requires instantiation)
            ytt_api = YouTubeTranscriptApi()

            # Try the simple fetch method first (handles language selection automatically)
            try:
                transcript_data = ytt_api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
            except NoTranscriptFound:
                # Try to list available transcripts and get any available one
                transcript_list = ytt_api.list(video_id)
                transcript = None

                # Try to find English transcript
                try:
                    transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                except NoTranscriptFound:
                    # Try auto-generated
                    try:
                        transcript = transcript_list.find_generated_transcript(['en'])
                    except NoTranscriptFound:
                        # Get any available transcript and translate
                        for t in transcript_list:
                            transcript = t.translate('en')
                            break

                if not transcript:
                    return None

                transcript_data = transcript.fetch()

            # Combine all text segments
            # The new API returns FetchedTranscript which is iterable
            full_text = " ".join(segment.text for segment in transcript_data)

            # Clean up the text
            full_text = self._clean_transcript_text(full_text)

            word_count = len(full_text.split())

            logger.info(f"Got YouTube transcript for {video_id}: {word_count} words")

            return TranscriptResult(
                text=full_text,
                source=TranscriptSource.YOUTUBE_CAPTIONS,
                word_count=word_count,
            )

        except (TranscriptsDisabled, NoTranscriptFound):
            raise
        except Exception as e:
            logger.error(f"Error fetching YouTube transcript: {e}")
            return None

    async def _get_whisper_transcript(self, video_id: str) -> Optional[TranscriptResult]:
        """
        Transcribe video audio using OpenAI Whisper API.

        This is a fallback when YouTube captions are unavailable.
        """
        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured, Whisper fallback unavailable")
            return None

        try:
            import tempfile
            import subprocess
            import openai

            # Download audio using yt-dlp
            with tempfile.TemporaryDirectory() as tmpdir:
                audio_path = f"{tmpdir}/audio.mp3"

                # Download audio only
                cmd = [
                    "yt-dlp",
                    "-x",  # Extract audio
                    "--audio-format",
                    "mp3",
                    "--audio-quality",
                    "5",  # Medium quality (0-9, 0 is best)
                    "-o",
                    audio_path,
                    f"https://www.youtube.com/watch?v={video_id}",
                ]

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

                if result.returncode != 0:
                    logger.error(f"yt-dlp failed: {result.stderr}")
                    return None

                # Transcribe with Whisper
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

                with open(audio_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text",
                    )

                full_text = self._clean_transcript_text(transcription)
                word_count = len(full_text.split())

                logger.info(f"Got Whisper transcript for {video_id}: {word_count} words")

                return TranscriptResult(
                    text=full_text,
                    source=TranscriptSource.WHISPER_STT,
                    word_count=word_count,
                )

        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return None

    def _clean_transcript_text(self, text: str) -> str:
        """Clean up transcript text."""
        # Remove multiple spaces
        text = re.sub(r"\s+", " ", text)

        # Remove common transcript artifacts
        text = re.sub(r"\[Music\]", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\[Applause\]", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\[Laughter\]", "", text, flags=re.IGNORECASE)

        return text.strip()

    async def check_whisper_health(self) -> bool:
        """Check if Whisper service is available."""
        return bool(settings.OPENAI_API_KEY)

    async def close(self):
        """Close the HTTP client."""
        await self.http_client.aclose()
