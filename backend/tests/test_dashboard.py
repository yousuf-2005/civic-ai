def test_dashboard_two_users_data_isolation(client, user_auth_headers, user_b_auth_headers, admin_auth_headers):
    """
    Verifies that citizen dashboard data is strictly isolated by authenticated user ID:
    - User A files complaints and sees their stats, categories, map-points, and complaints list.
    - User B (new user) sees 0 counts and empty lists, never User A's complaints or demo records.
    - User B submits a complaint; User B now sees only their 1 complaint, and User A's data remains unchanged.
    - Admin portal can view all complaints across citizens.
    """
    # 1. User A files 2 complaints
    c1 = {
        "title": "Road Cavity on 5th Cross",
        "category": "Potholes and Damaged Roads",
        "description": "Large road cavity causing traffic hazard.",
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    c2 = {
        "title": "Commercial Garbage Dump",
        "category": "Overflowing Garbage and Illegal Dumping",
        "description": "Garbage bins overflowing near intersection.",
        "latitude": 12.9352,
        "longitude": 77.6245,
    }

    res_c1 = client.post("/api/complaints", json=c1, headers=user_auth_headers)
    assert res_c1.status_code == 201
    res_c2 = client.post("/api/complaints", json=c2, headers=user_auth_headers)
    assert res_c2.status_code == 201

    # 2. Check User A dashboard
    stats_a = client.get("/api/dashboard/stats", headers=user_auth_headers).json()
    assert stats_a["total"] == 2
    assert stats_a["submitted"] == 2
    assert stats_a["resolved"] == 0

    cats_a = client.get("/api/dashboard/categories", headers=user_auth_headers).json()
    assert cats_a["total"] == 2
    assert len(cats_a["categories"]) == 2

    maps_a = client.get("/api/dashboard/map-points", headers=user_auth_headers).json()
    assert len(maps_a) == 2

    complaints_a = client.get("/api/complaints", headers=user_auth_headers).json()
    assert complaints_a["total"] == 2
    assert len(complaints_a["items"]) == 2
    titles_a = [item["title"] for item in complaints_a["items"]]
    assert "Road Cavity on 5th Cross" in titles_a
    assert "Commercial Garbage Dump" in titles_a

    # 3. Check User B dashboard (Brand new citizen - should see 0 counts and empty states)
    stats_b = client.get("/api/dashboard/stats", headers=user_b_auth_headers).json()
    assert stats_b["total"] == 0
    assert stats_b["submitted"] == 0
    assert stats_b["in_progress"] == 0
    assert stats_b["resolved"] == 0

    cats_b = client.get("/api/dashboard/categories", headers=user_b_auth_headers).json()
    assert cats_b["total"] == 0
    assert cats_b["categories"] == []

    maps_b = client.get("/api/dashboard/map-points", headers=user_b_auth_headers).json()
    assert maps_b == []

    complaints_b = client.get("/api/complaints", headers=user_b_auth_headers).json()
    assert complaints_b["total"] == 0
    assert complaints_b["items"] == []

    # 4. User B submits their own complaint
    c_user_b = {
        "title": "Broken Streetlight on Park Lane",
        "category": "Broken Streetlights",
        "description": "Streetlight fixture is dead for over a week.",
        "latitude": 12.9915,
        "longitude": 77.5712,
    }
    res_cb = client.post("/api/complaints", json=c_user_b, headers=user_b_auth_headers)
    assert res_cb.status_code == 201

    # 5. User B dashboard now shows exactly User B's complaint
    stats_b_updated = client.get("/api/dashboard/stats", headers=user_b_auth_headers).json()
    assert stats_b_updated["total"] == 1
    assert stats_b_updated["submitted"] == 1

    complaints_b_updated = client.get("/api/complaints", headers=user_b_auth_headers).json()
    assert complaints_b_updated["total"] == 1
    assert complaints_b_updated["items"][0]["title"] == "Broken Streetlight on Park Lane"

    # 6. User A's dashboard STILL only has User A's 2 complaints
    stats_a_check = client.get("/api/dashboard/stats", headers=user_auth_headers).json()
    assert stats_a_check["total"] == 2

    complaints_a_check = client.get("/api/complaints", headers=user_auth_headers).json()
    assert complaints_a_check["total"] == 2
    titles_a_check = [item["title"] for item in complaints_a_check["items"]]
    assert "Broken Streetlight on Park Lane" not in titles_a_check

    # 7. Admin can access all complaints through authorized admin endpoints
    admin_complaints = client.get("/api/complaints", headers=admin_auth_headers).json()
    assert admin_complaints["total"] == 3
    admin_titles = [item["title"] for item in admin_complaints["items"]]
    assert "Road Cavity on 5th Cross" in admin_titles
    assert "Commercial Garbage Dump" in admin_titles
    assert "Broken Streetlight on Park Lane" in admin_titles


def test_dashboard_unauthenticated_requests_rejected(client):
    """
    Verifies that unauthenticated or expired requests to dashboard and complaint endpoints
    return HTTP 401 Unauthorized, protecting private citizen data.
    """
    # Missing credentials
    assert client.get("/api/dashboard/stats").status_code == 401
    assert client.get("/api/dashboard/categories").status_code == 401
    assert client.get("/api/dashboard/map-points").status_code == 401
    assert client.get("/api/complaints").status_code == 401

    # Invalid / expired token
    bad_headers = {"Authorization": "Bearer invalid_expired_or_fake_token_jwt"}
    assert client.get("/api/dashboard/stats", headers=bad_headers).status_code == 401
    assert client.get("/api/dashboard/categories", headers=bad_headers).status_code == 401
    assert client.get("/api/dashboard/map-points", headers=bad_headers).status_code == 401
    assert client.get("/api/complaints", headers=bad_headers).status_code == 401
