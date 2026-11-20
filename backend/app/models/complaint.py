import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_number = Column(String(32), unique=True, index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_address = Column(String(500), nullable=True)
    
    # Image metadata
    image_filename = Column(String(255), nullable=True)
    image_content_type = Column(String(64), nullable=True)
    image_size_bytes = Column(Integer, nullable=True)
    
    # AI validation & analysis fields
    ai_valid_image = Column(Boolean, default=False, nullable=False)
    ai_relevance = Column(String(64), nullable=True)  # "relevant", "irrelevant", "uncertain"
    ai_confidence = Column(Float, nullable=True)
    ai_detected_category = Column(String(100), nullable=True)
    ai_description = Column(Text, nullable=True)
    ai_rejection_reason = Column(Text, nullable=True)
    ai_recommended_next_step = Column(Text, nullable=True)
    is_mock_ai = Column(Boolean, default=False, nullable=False)
    
    # Formal complaint letter
    complaint_letter = Column(Text, nullable=True)
    
    # Status lifecycle
    status = Column(String(32), default="Submitted", nullable=False, index=True)
    # Allowed statuses: Submitted, Under Review, In Progress, Resolved, Rejected
    
    # Citizen details
    citizen_name = Column(String(255), nullable=True)
    citizen_contact = Column(String(255), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    submitter = relationship("User", back_populates="complaints")
    timeline = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.created_at.asc()")
