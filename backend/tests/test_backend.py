import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.store import store

@pytest.fixture(autouse=True)
def init_store():
    store.initialize(seed=42)

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_personnel_me_endpoint():
    response = client.get("/api/personnel/me?person_id=PERS_1001")
    assert response.status_code == 200
    data = response.json()
    assert data["person_id"] == "PERS_1001"
    assert "risk_score" in data
    assert data["risk_band"] in ["Low", "Moderate", "High", "Critical"]
    assert len(data["historical_scores"]) == 6
    assert len(data["top_elevating_factors"]) > 0

def test_voluntary_checkin():
    payload = {
        "person_id": "PERS_1001",
        "sleep_quality": 3.0,
        "stress_level": 8.5,
        "mood_score": 3.5
    }
    response = client.post("/api/personnel/checkin", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["has_voluntary_checkin"] is True

def test_welfare_cases_list():
    response = client.get("/api/welfare/cases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Verify cases are sorted descending by risk score
    scores = [c["risk_score"] for c in data]
    assert scores == sorted(scores, reverse=True)

def test_notes_triage_assistant():
    payload = {
        "person_id": "PERS_1001",
        "officer_id": "OFFICER_007",
        "officer_name": "Capt. Ananya Verma",
        "free_text_note": "Individual expressed severe exhaustion due to continuous night shifts and mentioned financial stress at home."
    }
    response = client.post("/api/welfare/triage-note", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Exhaustion & Fatigue" in data["extracted_categories"]
    assert data["follow_up_priority"] in ["Routine", "Soon", "Urgent"]
    assert len(data["priority_rationale"]) > 0

def test_doctor_booking():
    payload = {
        "person_id": "PERS_1001",
        "doctor_id": "DOC_101",
        "slot_time": "Tomorrow 10:00 AM",
        "officer_id": "OFFICER_007",
        "consent_acknowledged": True
    }
    response = client.post("/api/welfare/referrals", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Confirmed"
    assert "VOLUNTARY CONSENT ACKNOWLEDGED" in data["consent_note"]

def test_commander_strict_rbac_privacy():
    response = client.get("/api/commander/unit-summary?unit_id=UNIT_ALPHA")
    assert response.status_code == 200
    data = response.json()
    
    # Critical Privacy Check: Ensure no individual identities, names or IDs are returned in commander payload!
    raw_str = str(data)
    assert "PERS_" not in raw_str
    assert "Rajesh" not in raw_str
    assert "person_id" not in data
    assert "total_personnel" in data
    assert "risk_band_percentages" in data
    assert "highest_workload_group_avg_hours" in data
    assert "privacy_notice" in data

def test_audit_logs():
    response = client.get("/api/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
