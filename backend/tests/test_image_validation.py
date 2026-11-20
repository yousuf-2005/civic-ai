import io
from PIL import Image


def create_test_image(format="JPEG", size=(200, 200), color=(100, 150, 200)):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


def test_validate_image_success(client):
    img_bytes = create_test_image(format="JPEG")
    files = {"file": ("pothole_street.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/complaints/validate-image", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["valid_image"] is True
    assert data["is_mock"] is True  # In test environment mock mode is active
    assert "detected_category" in data
    assert "image_filename" in data
    assert data["image_filename"].endswith(".jpg")


def test_validate_image_invalid_extension(client):
    files = {"file": ("script.py", b"print('malicious')", "text/plain")}
    response = client.post("/api/complaints/validate-image", files=files)
    assert response.status_code == 400
    assert "Invalid file extension" in response.json()["detail"]


def test_validate_image_corrupted_data(client):
    files = {"file": ("corrupt.jpg", b"NOT_A_REAL_IMAGE_BYTES_12345", "image/jpeg")}
    response = client.post("/api/complaints/validate-image", files=files)
    assert response.status_code == 400
    assert "not a valid or readable image" in response.json()["detail"].lower()


def test_validate_image_too_small(client):
    tiny_img = create_test_image(size=(10, 10))
    files = {"file": ("tiny.jpg", tiny_img, "image/jpeg")}
    response = client.post("/api/complaints/validate-image", files=files)
    assert response.status_code == 400
    assert "resolution too small" in response.json()["detail"].lower()


def test_validate_image_selfie_rejection(client):
    # Filename includes 'selfie' which triggers mock detection rejection
    img_bytes = create_test_image(format="JPEG")
    files = {"file": ("my_selfie_portrait.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/complaints/validate-image", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["valid_image"] is False
    assert data["relevance"] == "irrelevant"
    assert data["rejection_reason"] is not None
