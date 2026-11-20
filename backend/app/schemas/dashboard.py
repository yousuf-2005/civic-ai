from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total: int
    submitted: int
    under_review: int
    in_progress: int
    resolved: int
    rejected: int


class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class CategoryStatsResponse(BaseModel):
    categories: List[CategoryCount]
    total: int


class MapPointItem(BaseModel):
    id: str
    reference_number: str
    title: str
    category: str
    status: str
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    created_at: datetime
    image_url: Optional[str] = None
