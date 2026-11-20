from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

VALID_CATEGORIES = [
    "Potholes and Damaged Roads",
    "Overflowing Garbage and Illegal Dumping",
    "Broken Streetlights",
    "Water Leakage and Drainage",
    "Damaged Public Infrastructure",
    "Other Legitimate Public Service Problems",
]

VALID_STATUSES = [
    "Submitted",
    "Under Review",
    "In Progress",
    "Resolved",
    "Rejected",
]


class ImageValidationResponse(BaseModel):
    valid_image: bool
    relevance: str  # "relevant" | "irrelevant" | "uncertain"
    detected_category: Optional[str] = None
    description: Optional[str] = None
    confidence: Optional[float] = None
    rejection_reason: Optional[str] = None
    recommended_next_step: Optional[str] = None
    image_filename: Optional[str] = None
    image_url: Optional[str] = None
    is_mock: bool = False


class LetterGenerationRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: str
    description: str = Field(..., min_length=10)
    location_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ai_image_description: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_contact: Optional[str] = None


class LetterGenerationResponse(BaseModel):
    letter_subject: str
    letter_body: str
    is_mock: bool = False


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: str
    
    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    
    # Image
    image_filename: Optional[str] = None
    
    # Formal letter
    complaint_letter: Optional[str] = None
    
    # Submitter info
    citizen_name: Optional[str] = None
    citizen_contact: Optional[str] = None
    
    # AI Analysis
    ai_valid_image: bool = False
    ai_relevance: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_detected_category: Optional[str] = None
    ai_description: Optional[str] = None
    ai_rejection_reason: Optional[str] = None
    ai_recommended_next_step: Optional[str] = None
    is_mock_ai: bool = False

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES and not v.startswith("Other"):
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v


class StatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    old_status: Optional[str] = None
    new_status: str
    remarks: Optional[str] = None
    created_at: datetime
    changed_by_user_id: Optional[str] = None


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reference_number: str
    title: str
    description: str
    category: str
    
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    
    image_filename: Optional[str] = None
    image_url: Optional[str] = None
    
    complaint_letter: Optional[str] = None
    status: str
    
    citizen_name: Optional[str] = None
    citizen_contact: Optional[str] = None
    user_id: Optional[str] = None
    
    ai_valid_image: bool
    ai_relevance: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_detected_category: Optional[str] = None
    ai_description: Optional[str] = None
    ai_rejection_reason: Optional[str] = None
    ai_recommended_next_step: Optional[str] = None
    is_mock_ai: bool
    
    created_at: datetime
    updated_at: datetime
    timeline: List[StatusHistoryOut] = []


class ComplaintListResponse(BaseModel):
    items: List[ComplaintOut]
    total: int
    page: int
    page_size: int


class ComplaintStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_STATUSES)}")
        return v
