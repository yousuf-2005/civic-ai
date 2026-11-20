from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_user_optional, get_current_admin
from app.core.config import settings
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ImageValidationResponse,
    LetterGenerationRequest,
    LetterGenerationResponse,
    ComplaintCreate,
    ComplaintOut,
    ComplaintListResponse,
    ComplaintStatusUpdate,
)
from app.services.image_service import validate_and_save_upload
from app.services.ai_service import ai_service
from app.services.complaint_service import (
    create_complaint,
    get_complaint_by_id,
    get_complaint_by_reference,
    list_complaints,
    update_complaint_status,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def enrich_complaint_out(c: Complaint) -> ComplaintOut:
    """Helper to convert Complaint ORM to Pydantic and populate image_url."""
    data = ComplaintOut.model_validate(c)
    if c.image_filename:
        data.image_url = f"/api/complaints/image/{c.image_filename}"
    return data


@router.post("/validate-image", response_model=ImageValidationResponse)
async def validate_complaint_image(file: UploadFile = File(...)):
    """
    Uploads and analyzes an image using Gemini Vision (or mock offline engine).
    Validates file format, resolution, civic relevance, and detects category.
    """
    # 1. Server-side validation and safe storage
    upload_result = await validate_and_save_upload(file)
    filename = upload_result["filename"]
    file_path = Path(upload_result["file_path"])

    # 2. AI visual verification
    analysis = await ai_service.validate_image(file_path, filename, original_filename=file.filename)
    analysis.image_filename = filename
    analysis.image_url = f"/api/complaints/image/{filename}"

    return analysis


@router.post("/generate-letter", response_model=LetterGenerationResponse)
async def generate_letter(payload: LetterGenerationRequest):
    """
    Generates a formal, respectful municipal grievance letter draft based
    strictly on user-provided issue details and photographic evidence.
    """
    return await ai_service.generate_complaint_letter(payload)


@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Submits and records a new citizen complaint with location coordinates,
    category, photo evidence, and generated letter.
    """
    complaint = create_complaint(db, payload, current_user)
    return enrich_complaint_out(complaint)


@router.get("", response_model=ComplaintListResponse)
def get_complaints(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by complaint status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term for title/desc/reference"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists complaints with optional search and filtering.
    Citizens can only view their own reported grievances.
    Administrators are authorized to view all complaints across the platform.
    """
    skip = (page - 1) * page_size
    user_id_filter = current_user.id if current_user.role == "citizen" else None
    items, total = list_complaints(
        db,
        skip=skip,
        limit=page_size,
        status_filter=status,
        category_filter=category,
        search=search,
        user_id=user_id_filter,
    )
    return ComplaintListResponse(
        items=[enrich_complaint_out(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/track/{reference}", response_model=ComplaintOut)
def track_complaint(reference: str, db: Session = Depends(get_db)):
    """Public tracking endpoint to look up complaint status and timeline by reference number."""
    complaint = get_complaint_by_reference(db, reference)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No complaint found matching reference number '{reference}'. Please check the format (e.g. CIV-20261025-ABCD).",
        )
    return enrich_complaint_out(complaint)


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    """Retrieves complete details of a specific complaint by ID."""
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )
    return enrich_complaint_out(complaint)


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def change_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Administrative endpoint to update complaint lifecycle status and log audit remarks.
    Only accessible by authenticated users with 'admin' role.
    """
    updated = update_complaint_status(db, complaint_id, payload, admin_user)
    return enrich_complaint_out(updated)


@router.get("/image/{filename}")
def serve_complaint_image(filename: str):
    """Securely serves an uploaded complaint image."""
    # Prevent directory traversal
    clean_name = Path(filename).name
    image_file = settings.upload_path / clean_name
    if not image_file.exists() or not image_file.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found.")

    ext = clean_name.rsplit(".", 1)[-1].lower() if "." in clean_name else "jpg"
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    return FileResponse(image_file, media_type=media_types.get(ext, "image/jpeg"))
