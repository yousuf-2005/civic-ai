import random
import string
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.complaint import Complaint
from app.models.status_history import StatusHistory
from app.models.user import User
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, VALID_STATUSES


def generate_reference_number(db: Session) -> str:
    """Generate a unique human-friendly reference like CIV-20261025-A8F2."""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    for _ in range(10):
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        ref = f"CIV-{date_str}-{suffix}"
        # Check collision
        existing = db.query(Complaint.id).filter(Complaint.reference_number == ref).first()
        if not existing:
            return ref
    # Fallback with timestamp seconds
    time_sec = int(datetime.now(timezone.utc).timestamp()) % 10000
    return f"CIV-{date_str}-{time_sec:04d}"


def create_complaint(
    db: Session,
    data: ComplaintCreate,
    user: Optional[User] = None,
) -> Complaint:
    """Creates a new complaint and registers the initial timeline history."""
    ref = generate_reference_number(db)
    
    complaint = Complaint(
        reference_number=ref,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        latitude=data.latitude,
        longitude=data.longitude,
        location_address=data.location_address.strip() if data.location_address else None,
        image_filename=data.image_filename,
        complaint_letter=data.complaint_letter,
        status="Submitted",
        citizen_name=data.citizen_name or (user.full_name if user else None),
        citizen_contact=data.citizen_contact or (user.email if user else None),
        user_id=user.id if user else None,
        # AI metadata
        ai_valid_image=data.ai_valid_image,
        ai_relevance=data.ai_relevance,
        ai_confidence=data.ai_confidence,
        ai_detected_category=data.ai_detected_category,
        ai_description=data.ai_description,
        ai_rejection_reason=data.ai_rejection_reason,
        ai_recommended_next_step=data.ai_recommended_next_step,
        is_mock_ai=data.is_mock_ai,
    )
    db.add(complaint)
    db.flush()

    # Initial history timeline
    initial_history = StatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status="Submitted",
        changed_by_user_id=user.id if user else None,
        remarks="Complaint filed by citizen via Civic AI portal.",
    )
    db.add(initial_history)
    db.commit()
    db.refresh(complaint)
    return complaint


def get_complaint_by_reference(db: Session, reference: str) -> Optional[Complaint]:
    """Retrieve complaint by public reference number."""
    return db.query(Complaint).filter(Complaint.reference_number == reference.strip().upper()).first()


def get_complaint_by_id(db: Session, complaint_id: str) -> Optional[Complaint]:
    """Retrieve complaint by primary key UUID."""
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()


def list_complaints(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    search: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Tuple[List[Complaint], int]:
    """List complaints with filters and total count for pagination."""
    query = db.query(Complaint)

    if user_id:
        query = query.filter(Complaint.user_id == user_id)

    if status_filter:
        query = query.filter(Complaint.status == status_filter)

    if category_filter:
        query = query.filter(Complaint.category == category_filter)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_term),
                Complaint.description.ilike(search_term),
                Complaint.reference_number.ilike(search_term),
                Complaint.location_address.ilike(search_term),
            )
        )

    total = query.count()
    items = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def update_complaint_status(
    db: Session,
    complaint_id: str,
    update_data: ComplaintStatusUpdate,
    admin_user: User,
) -> Complaint:
    """Updates complaint lifecycle status and records audit history."""
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if update_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    old_status = complaint.status
    complaint.status = update_data.status
    complaint.updated_at = datetime.now(timezone.utc)

    # Record history
    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=update_data.status,
        changed_by_user_id=admin_user.id,
        remarks=update_data.remarks or f"Status changed from {old_status} to {update_data.status} by administrator.",
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return complaint
