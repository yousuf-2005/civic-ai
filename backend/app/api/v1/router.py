from fastapi import APIRouter

from app.api.v1.endpoints import health, auth, complaints, dashboard

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(complaints.router)
api_router.include_router(dashboard.router)
