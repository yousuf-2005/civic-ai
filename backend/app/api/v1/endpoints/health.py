from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.services.ai_service import ai_service

router = APIRouter(tags=["Health"])


@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    """Health check endpoint providing runtime and dependency status."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "ai_mode": "mock" if not ai_service.is_live_ai_available else "live",
        "gemini_model": settings.GEMINI_MODEL,
        "mock_mode_flag": settings.AI_MOCK_MODE,
        "gemini_key_configured": bool(settings.GEMINI_API_KEY),
    }
