import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router
from app.services.ai_service import ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("civic_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist
    Base.metadata.create_all(bind=engine)
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    
    ai_status = "MOCK MODE (Offline simulation)" if not ai_service.is_live_ai_available else f"LIVE (Model: {settings.GEMINI_MODEL})"
    logger.info("=" * 60)
    logger.info(f"Civic AI Backend initialized successfully!")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    logger.info(f"AI Engine: {ai_status}")
    logger.info(f"CORS Allowed Origins: {settings.cors_origins}")
    logger.info("=" * 60)
    yield
    # Shutdown
    logger.info("Civic AI Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Civic AI — AI-Powered Grievance Redressal Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory for static serving
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")

# Include Core API Routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# Serve Built Frontend in Production (e.g. Docker / Hugging Face Spaces)
frontend_dist_paths = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "static",
]

frontend_dist = None
for p in frontend_dist_paths:
    if p.exists() and (p / "index.html").exists():
        frontend_dist = p
        break

if frontend_dist:
    logger.info(f"Serving built frontend from {frontend_dist}")
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Don't intercept API calls or uploads
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        target_file = frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", include_in_schema=False)
    def root_welcome():
        return {
            "message": "Welcome to Civic AI API",
            "documentation": "/docs",
            "health_check": f"{settings.API_V1_STR}/health",
        }
