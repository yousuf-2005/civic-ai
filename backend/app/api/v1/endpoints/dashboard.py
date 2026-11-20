from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.dashboard import (
    DashboardStatsResponse,
    CategoryStatsResponse,
    CategoryCount,
    MapPointItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Computes real-time statistics for the authenticated user (or platform-wide for administrators)."""
    base_query = db.query(Complaint)
    if current_user.role == "citizen":
        base_query = base_query.filter(Complaint.user_id == current_user.id)

    total = base_query.count()
    submitted = base_query.filter(Complaint.status == "Submitted").count()
    under_review = base_query.filter(Complaint.status == "Under Review").count()
    in_progress = base_query.filter(Complaint.status == "In Progress").count()
    resolved = base_query.filter(Complaint.status == "Resolved").count()
    rejected = base_query.filter(Complaint.status == "Rejected").count()

    return DashboardStatsResponse(
        total=total,
        submitted=submitted,
        under_review=under_review,
        in_progress=in_progress,
        resolved=resolved,
        rejected=rejected,
    )


@router.get("/categories", response_model=CategoryStatsResponse)
def get_category_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Computes distribution of reported civic issues grouped by category for the authenticated user."""
    if current_user.role == "citizen":
        total = db.query(Complaint).filter(Complaint.user_id == current_user.id).count()
        rows = (
            db.query(Complaint.category, func.count(Complaint.id).label("count"))
            .filter(Complaint.user_id == current_user.id)
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
            .all()
        )
    else:
        total = db.query(Complaint).count()
        rows = (
            db.query(Complaint.category, func.count(Complaint.id).label("count"))
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
            .all()
        )

    categories = []
    for cat_name, count in rows:
        pct = round((count / total * 100), 1) if total > 0 else 0.0
        categories.append(CategoryCount(category=cat_name, count=count, percentage=pct))

    return CategoryStatsResponse(categories=categories, total=total)


@router.get("/map-points", response_model=List[MapPointItem])
def get_map_points(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns geolocation markers for complaints with recorded coordinates for the authenticated user."""
    query = db.query(Complaint).filter(
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None),
    )
    if current_user.role == "citizen":
        query = query.filter(Complaint.user_id == current_user.id)

    records = (
        query.order_by(Complaint.created_at.desc())
        .limit(200)
        .all()
    )

    points = []
    for r in records:
        points.append(
            MapPointItem(
                id=r.id,
                reference_number=r.reference_number,
                title=r.title,
                category=r.category,
                status=r.status,
                latitude=r.latitude,
                longitude=r.longitude,
                location_address=r.location_address,
                created_at=r.created_at,
                image_url=f"/api/complaints/image/{r.image_filename}" if r.image_filename else None,
            )
        )
    return points
