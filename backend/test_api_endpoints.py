"""FastAPI API Endpoint Integration Tests for Medifusion AI.
Tests health checks, authentication, password reset, doctor/clinical invites,
role-based permissions, clinical notes, documents, and digital twin endpoints.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from server import app
from auth import create_token, hash_password


class MockCursor:
    def __init__(self, items):
        self.items = list(items) if items else []

    def sort(self, *args, **kwargs):
        return self

    def skip(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    async def to_list(self, *args, **kwargs):
        return list(self.items)

    def __aiter__(self):
        self._iter = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class MockCollection:
    def __init__(self, data=None):
        self.data = list(data) if data else []
        self.find_one = AsyncMock(return_value=None)
        self.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock_id"))
        self.insert_many = AsyncMock(return_value=MagicMock(inserted_ids=["mock_id"]))
        self.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
        self.update_many = AsyncMock(return_value=MagicMock(modified_count=1))
        self.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
        self.count_documents = AsyncMock(return_value=len(self.data))

    def find(self, *args, **kwargs):
        return MockCursor(self.data)


class MockDatabase:
    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection()
        return self._collections[name]

    def __getitem__(self, name):
        return getattr(self, name)


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def doctor_headers():
    token = create_token("doc_123", "doctor", "doctor@medifusion.ai")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def clinical_headers():
    token = create_token("clin_456", "clinical", "specialist@medifusion.ai")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers():
    token = create_token("admin_789", "admin", "admin@medifusion.ai")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_headers():
    token = create_token("pat_001", "patient", "patient@medifusion.ai")
    return {"Authorization": f"Bearer {token}"}


# ==========================================
# 1. Health Check & Root Endpoints
# ==========================================
def test_health_check_endpoints(client):
    r_root = client.get("/")
    assert r_root.status_code == 200
    data_root = r_root.json()
    assert data_root["status"] == "healthy"
    assert data_root["service"] == "Medifusion AI"

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    r_api_health = client.get("/api/health")
    assert r_api_health.status_code == 200
    assert r_api_health.json()["service"] == "Medifusion AI"


# ==========================================
# 2. Password Reset Flow
# ==========================================
def test_password_reset_request_and_confirm(client):
    mock_db = MockDatabase()
    mock_db.users.find_one = AsyncMock(return_value={
        "id": "pat_123",
        "email": "user@medifusion.ai",
        "full_name": "Test User",
        "role": "patient",
    })

    with patch("server.db", mock_db):
        req_payload = {"email": "user@medifusion.ai"}
        res_req = client.post("/api/auth/password-reset/request", json=req_payload)
        assert res_req.status_code == 200
        req_json = res_req.json()
        assert "reset_token" in req_json
        token = req_json["reset_token"]

        mock_db.password_resets.find_one = AsyncMock(return_value={
            "token": token,
            "email": "user@medifusion.ai",
            "user_id": "pat_123",
            "used": False,
            "expires_at": "2099-01-01T00:00:00Z"
        })

        conf_payload = {
            "token": token,
            "new_password": "NewSecurePassword123!"
        }
        res_conf = client.post("/api/auth/password-reset/confirm", json=conf_payload)
        assert res_conf.status_code == 200
        assert "Password updated successfully" in res_conf.json()["message"]


# ==========================================
# 3. Patient Invite Endpoints (Doctor & Clinical)
# ==========================================
def test_doctor_and_clinical_patient_invite(client, doctor_headers, clinical_headers, patient_headers):
    mock_db = MockDatabase()
    mock_db.users.find_one = AsyncMock(return_value=None)

    invite_payload = {
        "email": "newpatient@hospital.org",
        "full_name": "Sarah Connor",
        "phone": "+1555123456",
        "clinical_notes": "Referred for metabolic health assessment"
    }

    with patch("server.db", mock_db):
        # Doctor invite
        res_doc = client.post("/api/doctor/invite-patient", json=invite_payload, headers=doctor_headers)
        assert res_doc.status_code == 200
        res_data = res_doc.json()
        assert res_data["patient"]["email"] == "newpatient@hospital.org"
        assert "temporary_password" in res_data
        assert "temp_password" in res_data

        # Clinical invite alias
        res_clin = client.post("/api/clinical/invite-patient", json=invite_payload, headers=clinical_headers)
        assert res_clin.status_code == 200
        assert "temp_password" in res_clin.json()

        # Unauthorized role (patient cannot invite patients)
        res_pat = client.post("/api/doctor/invite-patient", json=invite_payload, headers=patient_headers)
        assert res_pat.status_code == 403


# ==========================================
# 4. Role Authorization on /api/patients
# ==========================================
def test_role_authorization_on_patients_list(client, doctor_headers, clinical_headers, admin_headers, patient_headers):
    mock_db = MockDatabase()
    mock_db.users.data = [
        {"id": "pat_1", "email": "p1@medifusion.ai", "full_name": "Patient One", "role": "patient"}
    ]
    mock_db.digital_twins.find_one = AsyncMock(return_value={
        "user_id": "pat_1",
        "profile": {"age": 45, "gender": "male"},
        "vitals": {"blood_pressure_systolic": 120, "blood_pressure_diastolic": 80},
        "labs": {"glucose": 95}
    })

    with patch("server.db", mock_db):
        # Doctor access -> allowed
        res_doc = client.get("/api/patients", headers=doctor_headers)
        assert res_doc.status_code == 200
        assert len(res_doc.json()) == 1
        assert res_doc.json()[0]["id"] == "pat_1"

        # Clinical access -> allowed (Critical fix)
        res_clin = client.get("/api/patients", headers=clinical_headers)
        assert res_clin.status_code == 200
        assert len(res_clin.json()) == 1

        # Admin access -> allowed
        res_admin = client.get("/api/patients", headers=admin_headers)
        assert res_admin.status_code == 200

        # Patient access -> 403 Forbidden
        res_pat = client.get("/api/patients", headers=patient_headers)
        assert res_pat.status_code == 403


# ==========================================
# 5. Doctor & Clinical Notes Endpoints
# ==========================================
def test_clinical_notes_support_both_payload_formats(client, doctor_headers, clinical_headers):
    mock_db = MockDatabase()

    with patch("server.db", mock_db):
        # Standard POST /api/doctor/notes with { patient_id, text }
        payload1 = {
            "patient_id": "pat_99",
            "text": "Patient vitals stable. Continue prescribed metformin."
        }
        res1 = client.post("/api/doctor/notes", json=payload1, headers=doctor_headers)
        assert res1.status_code == 200
        assert res1.json()["patient_id"] == "pat_99"
        assert res1.json()["text"] == "Patient vitals stable. Continue prescribed metformin."

        # REST path POST /api/doctor/notes/{patient_id} with { note } used by ClinicalDashboard
        payload2 = {
            "note": "Clinical specialist consultation completed. Recommend renal panel recheck."
        }
        res2 = client.post("/api/doctor/notes/pat_99", json=payload2, headers=clinical_headers)
        assert res2.status_code == 200
        assert res2.json()["patient_id"] == "pat_99"
        assert res2.json()["text"] == "Clinical specialist consultation completed. Recommend renal panel recheck."


# ==========================================
# 6. Medical Document Management Endpoints
# ==========================================
def test_medical_documents_endpoints(client, doctor_headers, patient_headers):
    mock_db = MockDatabase()
    mock_db.documents.data = [
        {
            "id": "doc_abc",
            "patient_id": "pat_001",
            "title": "Blood Work Analysis",
            "filename": "lab_report.pdf",
            "doc_type": "Lab Report",
            "file_size": 102400,
            "uploader_id": "pat_001",
            "created_at": "2026-09-20T10:00:00Z"
        }
    ]

    with patch("server.db", mock_db):
        # List documents for patient
        res_list = client.get("/api/documents?patient_id=pat_001", headers=patient_headers)
        assert res_list.status_code == 200
        docs_res = res_list.json()
        assert docs_res["count"] == 1
        assert docs_res["items"][0]["title"] == "Blood Work Analysis"

        # Upload document
        file_content = b"%PDF-1.4 sample medical report bytes"
        files = {"file": ("test_report.pdf", file_content, "application/pdf")}
        data = {
            "patient_id": "pat_001",
            "title": "Comprehensive Metabolic Panel",
            "doc_type": "Lab Report"
        }

        res_upload = client.post("/api/documents/upload", data=data, files=files, headers=patient_headers)
        assert res_upload.status_code == 200
        upload_res = res_upload.json()
        assert upload_res["title"] == "Comprehensive Metabolic Panel"
        assert upload_res["filename"] == "test_report.pdf"


# ==========================================
# 7. Vitals History Endpoint
# ==========================================
def test_vitals_history_endpoint(client, patient_headers):
    mock_db = MockDatabase()
    mock_db.vitals_history.data = [
        {"heart_rate": 72, "blood_pressure_systolic": 120, "at": "2026-09-20T10:00:00Z"},
        {"heart_rate": 75, "blood_pressure_systolic": 122, "at": "2026-09-21T10:00:00Z"}
    ]

    with patch("server.db", mock_db):
        res = client.get("/api/vitals/history/pat_001", headers=patient_headers)
        assert res.status_code == 200
        records = res.json()
        assert len(records) == 2
        assert records[0]["heart_rate"] == 72
