"""Main FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Path to static frontend files
STATIC_DIR = Path(__file__).parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Extract key insights from YouTube videos",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Serve static files if they exist (production)
if STATIC_DIR.exists():
    # Mount static assets
    app.mount("/_next", StaticFiles(directory=STATIC_DIR / "_next"), name="next-static")

    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        """Serve frontend static files."""
        # Try to serve the exact file
        file_path = STATIC_DIR / full_path

        # If it's a directory, look for index.html
        if file_path.is_dir():
            file_path = file_path / "index.html"

        # If file exists, serve it
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # Fallback to index.html for SPA routing
        index_path = STATIC_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)

        return {"error": "Not found"}
else:
    @app.get("/")
    async def root():
        """Root endpoint (dev mode)."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "note": "Frontend not built. Run build script for production.",
        }
