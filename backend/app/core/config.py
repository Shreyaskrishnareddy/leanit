from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App settings
    APP_NAME: str = "LeanIt"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # API Keys
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""  # For Whisper fallback

    # Processing settings
    MAX_VIDEO_DURATION_SECONDS: int = 7200  # 2 hours
    CHUNK_TARGET_TOKENS: int = 2000
    CHUNK_OVERLAP_TOKENS: int = 200
    MAX_TOP_INSIGHTS: int = 5
    MAX_ADDITIONAL_INSIGHTS: int = 15

    # LLM settings
    GROQ_MODEL_FAST: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_QUALITY: str = "llama-3.3-70b-versatile"

    # CORS settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://leanit.vercel.app"]

    # Feature flags
    USE_MOCK_DATA: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
