"""Custom exceptions for LeanIt backend."""


class LeanItException(Exception):
    """Base exception for LeanIt."""

    def __init__(self, message: str, details: str | None = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class VideoNotFoundError(LeanItException):
    """Raised when a YouTube video cannot be found."""

    pass


class VideoTooLongError(LeanItException):
    """Raised when a video exceeds the maximum allowed duration."""

    pass


class TranscriptUnavailableError(LeanItException):
    """Raised when transcript cannot be obtained (neither captions nor Whisper)."""

    pass


class InvalidURLError(LeanItException):
    """Raised when the provided URL is not a valid YouTube URL."""

    pass


class GroqRateLimitError(LeanItException):
    """Raised when Groq API rate limit is hit."""

    pass


class GroqAPIError(LeanItException):
    """Raised when Groq API returns an error."""

    pass


class ProcessingError(LeanItException):
    """Raised when an error occurs during video processing."""

    pass
