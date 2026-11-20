def test_generate_letter(client):
    payload = {
        "title": "Severe road cavity on Main Boulevard",
        "category": "Potholes and Damaged Roads",
        "description": "A deep crater formed across the left lane causing hazards for motorists.",
        "location_address": "Main Boulevard, Ward 15",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "citizen_name": "Jane Doe",
    }
    response = client.post("/api/complaints/generate-letter", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "letter_subject" in data
    assert "letter_body" in data
    assert "To," in data["letter_body"]
    assert "Ward 15" in data["letter_body"]


def test_create_complaint_and_track(client):
    payload = {
        "title": "Uncollected organic waste",
        "category": "Overflowing Garbage and Illegal Dumping",
        "description": "Garbage bins are overflowing onto the footpath for three days.",
        "location_address": "Market Street, Block 2",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "citizen_name": "Alex Smith",
        "citizen_contact": "alex@example.com",
        "ai_valid_image": True,
        "ai_detected_category": "Overflowing Garbage and Illegal Dumping",
        "is_mock_ai": True,
    }
    
    # 1. Create complaint
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    complaint_data = create_res.json()
    
    assert "id" in complaint_data
    assert "reference_number" in complaint_data
    assert complaint_data["status"] == "Submitted"
    assert len(complaint_data["timeline"]) == 1
    
    ref = complaint_data["reference_number"]
    
    # 2. Public track complaint
    track_res = client.get(f"/api/complaints/track/{ref}")
    assert track_res.status_code == 200
    tracked = track_res.json()
    assert tracked["reference_number"] == ref
    assert tracked["title"] == payload["title"]


def test_track_nonexistent_reference(client):
    response = client.get("/api/complaints/track/CIV-20261025-XXXX")
    assert response.status_code == 404
    assert "No complaint found" in response.json()["detail"]


def test_admin_update_status_flow(client, admin_auth_headers, user_auth_headers):
    # 1. Create complaint
    payload = {
        "title": "Broken street pole fixture",
        "category": "Broken Streetlights",
        "description": "Streetlight fixture hanging precariously from pole.",
        "latitude": 12.9915,
        "longitude": 77.5712,
    }
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    cid = create_res.json()["id"]

    # 2. Regular citizen tries to update status -> 403 Forbidden
    non_admin_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "Under Review", "remarks": "Citizen attempt"},
        headers=user_auth_headers,
    )
    assert non_admin_res.status_code == 403

    # 3. Admin updates status to Under Review
    admin_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "Under Review", "remarks": "Assigned to electrical team."},
        headers=admin_auth_headers,
    )
    assert admin_res.status_code == 200
    updated_data = admin_res.json()
    assert updated_data["status"] == "Under Review"
    assert len(updated_data["timeline"]) == 2
    assert updated_data["timeline"][1]["new_status"] == "Under Review"

    # 4. Admin updates to Invalid status -> 422 or 400
    bad_status_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "SuperInvalidStatus", "remarks": "Test"},
        headers=admin_auth_headers,
    )
    assert bad_status_res.status_code in [400, 422]
