# Civic AI REST API Specification

Interactive Swagger UI documentation is automatically hosted at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

Base URL: `/api`

---

## 1. Health & System Status

### `GET /api/health`
Checks server health, database connectivity, and AI configuration mode.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "ai_mode": "mock",
  "gemini_model": "gemini-3.8-flash"
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Registers a new citizen or municipal user.

**Request Body**:
```json
{
  "full_name": "Jane Citizen",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "phone": "+1-555-0199"
}
```

**Response `201 Created`**:
```json
{
  "user": {
    "id": "e44d3345-4202-4fc8-a92c-54a861d9cb42",
    "email": "jane@example.com",
    "full_name": "Jane Citizen",
    "role": "citizen"
  },
  "token": {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
}
```

### `POST /api/auth/login`
Authenticates a user and returns an access token.

**Request Body** (`application/json` or form-data):
```json
{
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```

**Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "e44d3345-4202-4fc8-a92c-54a861d9cb42",
    "email": "jane@example.com",
    "full_name": "Jane Citizen",
    "role": "citizen"
  }
}
```

### `GET /api/auth/me`
Retrieves profile of the currently logged-in user. Requires `Authorization: Bearer <token>`.

---

## 3. AI Verification & Assistance

### `POST /api/complaints/validate-image`
Uploads and validates an image using Gemini Vision (or mock engine if `AI_MOCK_MODE=true`).

**Request**: `multipart/form-data`
- `file`: Binary image file (JPEG, PNG, WebP ≤ 10MB)

**Response `200 OK`**:
```json
{
  "valid_image": true,
  "relevance": "relevant",
  "detected_category": "Potholes and Damaged Roads",
  "description": "Deep asphalt fissure and crater-like pothole located near a pedestrian crossing.",
  "confidence": 0.94,
  "rejection_reason": null,
  "recommended_next_step": "Proceed to generate formal complaint letter.",
  "image_temp_id": "908d13b2-938b-4977-9df0-e69623be875e.jpg",
  "is_mock": false
}
```

### `POST /api/complaints/generate-letter`
Generates a formal, respectful municipal grievance letter.

**Request Body**:
```json
{
  "title": "Severe pothole causing vehicle damage",
  "category": "Potholes and Damaged Roads",
  "description": "A deep crater formed in the middle of Main Street after rain.",
  "location_address": "Main Street, Block 4, Ward 12",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "ai_image_description": "Deep asphalt fissure and pothole.",
  "citizen_name": "Jane Citizen",
  "contact_info": "jane@example.com"
}
```

**Response `200 OK`**:
```json
{
  "letter_subject": "Formal Complaint Regarding Hazardous Pothole on Main Street",
  "letter_body": "To,\nThe Commissioner / Executive Engineer,\nDepartment of Public Works / Municipal Corporation...",
  "is_mock": false
}
```

---

## 4. Complaints Management

### `POST /api/complaints`
Creates and registers a complaint record.

**Request Body**:
```json
{
  "title": "Severe pothole causing vehicle damage",
  "description": "A deep crater formed in the middle of Main Street after rain.",
  "category": "Potholes and Damaged Roads",
  "image_filename": "908d13b2-938b-4977-9df0-e69623be875e.jpg",
  "location_address": "Main Street, Block 4, Ward 12",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "complaint_letter": "To,\nThe Municipal Commissioner...",
  "citizen_name": "Jane Citizen",
  "citizen_contact": "jane@example.com",
  "ai_metadata": {
    "detected_category": "Potholes and Damaged Roads",
    "confidence": 0.94,
    "description": "Deep asphalt fissure and pothole."
  }
}
```

**Response `201 Created`**:
```json
{
  "id": "713ba6b8-c304-4d89-9a25-a134d193d508",
  "reference_number": "CIV-20261025-A9B4",
  "status": "Submitted",
  "title": "Severe pothole causing vehicle damage",
  "category": "Potholes and Damaged Roads",
  "location_address": "Main Street, Block 4, Ward 12",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "created_at": "2026-10-25T12:00:00Z"
}
```

### `GET /api/complaints/track/{reference}`
Public lookup of complaint status, timeline, and details.

### `GET /api/complaints`
Lists complaints with optional pagination and filters (`status`, `category`, `search`).

### `GET /api/complaints/{id}`
Retrieves complete complaint record.

### `PATCH /api/complaints/{id}/status` *(Admin Only)*
Updates the complaint lifecycle status (`Submitted` -> `Under Review` -> `In Progress` -> `Resolved` / `Rejected`) with an administrative remark.

---

## 5. Dashboard & Analytics

### `GET /api/dashboard/stats`
Returns aggregated count metrics: `total`, `submitted`, `under_review`, `in_progress`, `resolved`, `rejected`.

### `GET /api/dashboard/categories`
Returns complaint frequency breakdown by category.

### `GET /api/dashboard/map-points`
Returns geo-coordinates and brief info for complaints plotted on the civic overview map.
