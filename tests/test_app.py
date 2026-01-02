from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_root_redirects_to_index():
    res = client.get("/")
    assert res.status_code == 307 or res.status_code == 308 or res.status_code == 200


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Ensure a known activity exists
    assert "Basketball Team" in data


def test_signup_success_and_duplicate():
    activity_name = "Math Club"
    email = "testuser@example.com"

    # Ensure not already signed up
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    res = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert res.status_code == 200
    assert res.json().get("message")
    assert email in activities[activity_name]["participants"]

    # Try signing up again -> should return 400
    res2 = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert res2.status_code == 400

    # Cleanup
    activities[activity_name]["participants"].remove(email)


def test_signup_nonexistent_activity():
    res = client.post("/activities/NoSuchActivity/signup", params={"email": "a@b.com"})
    assert res.status_code == 404
