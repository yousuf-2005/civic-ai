import io
import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple
from fastapi import UploadFile, HTTPException, status
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings

# Supported Pillow formats mapping
ALLOWED_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
}

# Dimension constraints
MIN_DIMENSION = 50
MAX_DIMENSION = 8192


class ImageValidationError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


async def validate_and_save_upload(file: UploadFile) -> Dict[str, Any]:
    """
    Validates uploaded image file securely:
    - Checks file size against configured MAX_UPLOAD_MB
    - Checks file extension
    - Verifies actual image bytes using Pillow
    - Rejects corrupt, empty, or oversized images
    - Generates a safe unique filename (UUID)
    - Saves image to the configured upload directory
    """
    if not file.filename:
        raise ImageValidationError("No filename provided with upload.")

    # 1. Check extension from filename
    original_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if original_ext not in settings.allowed_extensions_list:
        raise ImageValidationError(
            f"Invalid file extension '.{original_ext}'. Allowed formats: {', '.join(settings.allowed_extensions_list)}."
        )

    # 2. Read bytes with size limit guard
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    content = await file.read(max_bytes + 1024)
    if len(content) > max_bytes:
        raise ImageValidationError(
            f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_MB} MB."
        )
    if len(content) == 0:
        raise ImageValidationError("Uploaded file is empty (0 bytes).")

    # 3. Validate image using Pillow
    try:
        image_stream = io.BytesIO(content)
        with Image.open(image_stream) as img:
            # Check format
            format_name = img.format
            if format_name not in ALLOWED_FORMATS:
                raise ImageValidationError(
                    f"Unsupported image format '{format_name}'. Allowed: JPEG, PNG, WEBP."
                )

            # Check dimensions
            width, height = img.size
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                raise ImageValidationError(
                    f"Image resolution too small ({width}x{height}px). Minimum required is {MIN_DIMENSION}x{MIN_DIMENSION}px."
                )
            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                raise ImageValidationError(
                    f"Image resolution exceeds maximum allowed ({width}x{height}px > {MAX_DIMENSION}x{MAX_DIMENSION}px)."
                )

            # Re-orient image according to EXIF tags if present
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass  # Ignore EXIF errors

            # Safe destination filename
            safe_ext = ALLOWED_FORMATS[format_name]
            unique_name = f"{uuid.uuid4().hex}.{safe_ext}"
            target_path = settings.upload_path / unique_name

            # Save sanitized image
            if format_name == "JPEG":
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(target_path, format="JPEG", quality=85, optimize=True)
            elif format_name == "PNG":
                img.save(target_path, format="PNG", optimize=True)
            elif format_name == "WEBP":
                img.save(target_path, format="WEBP", quality=85)
            else:
                img.save(target_path)

            file_size = os.path.getsize(target_path)

            return {
                "filename": unique_name,
                "file_path": str(target_path),
                "content_type": f"image/{safe_ext}",
                "size_bytes": file_size,
                "width": width,
                "height": height,
                "format": format_name,
            }

    except UnidentifiedImageError:
        raise ImageValidationError("The uploaded file is not a valid or readable image.")
    except ImageValidationError:
        raise
    except Exception as e:
        raise ImageValidationError(f"Image processing failed: {str(e)}")
