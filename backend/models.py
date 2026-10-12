"""Pydantic models for HealthTwin.AI — Modules 1 through 15."""
from datetime import datetime, timezone
from typing import Optional, Literal, Any
import uuid

from pydantic import BaseModel, EmailStr, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


Role = Literal["patient", "doctor", "clinical", "admin"]


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: Role = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class InvitePatientRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Role
    created_at: str


class PatientProfile(BaseModel):
    age: int = 30
    gender: str = "male"
    bmi: float = 24.0
    blood_group: str = "O+"
    allergies: list[str] = []
    family_history_diabetes: bool = False
    family_history_heart: bool = False
    family_history_kidney: bool = False
    family_history_hypertension: bool = False
    smoking: bool = False
    alcohol: bool = False
    sleep_hours: float = 7.0
    physical_activity_hours: float = 3.0
    diet: str = "balanced"
    has_diabetes: bool = False
    has_hypertension: bool = False
    chronic_conditions: list[str] = []
    surgeries: list[str] = []


class Vitals(BaseModel):
    systolic_bp: float = 120
    diastolic_bp: float = 80
    heart_rate: float = 72
    temperature: float = 98.6
    oxygen_saturation: float = 98


class LabResults(BaseModel):
    hba1c: Optional[float] = None
    blood_sugar: Optional[float] = None
    cholesterol_total: Optional[float] = None
    cholesterol_hdl: Optional[float] = None
    cholesterol_ldl: Optional[float] = None
    creatinine: Optional[float] = None
    alt: Optional[float] = None
    ast: Optional[float] = None
    hemoglobin: Optional[float] = None
    wbc_count: Optional[float] = None
    platelets: Optional[float] = None
    triglycerides: Optional[float] = None
    tsh: Optional[float] = None
    vitamin_d: Optional[float] = None
    vitamin_b12: Optional[float] = None
    urine_protein: Optional[str] = None


class DigitalTwinUpdate(BaseModel):
    profile: Optional[PatientProfile] = None
    vitals: Optional[Vitals] = None
    labs: Optional[LabResults] = None


# ---------- Module 8: EHR Models ----------
class Prescription(BaseModel):
    id: str = Field(default_factory=new_id)
    medication_name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    prescribed_by: str = "Dr. System"
    notes: Optional[str] = None


class Vaccination(BaseModel):
    id: str = Field(default_factory=new_id)
    vaccine_name: str
    date_administered: str
    next_due_date: Optional[str] = None
    batch_no: Optional[str] = None


class AllergyDetail(BaseModel):
    id: str = Field(default_factory=new_id)
    allergen: str
    severity: Literal["mild", "moderate", "severe"] = "mild"
    reaction: str


class SurgeryDetail(BaseModel):
    id: str = Field(default_factory=new_id)
    procedure_name: str
    date: str
    hospital: str
    surgeon: str
    notes: Optional[str] = None


class EHRRecord(BaseModel):
    patient_id: str
    prescriptions: list[Prescription] = []
    vaccinations: list[Vaccination] = []
    allergies_detailed: list[AllergyDetail] = []
    surgeries_detailed: list[SurgeryDetail] = []
    clinical_notes: list[dict[str, Any]] = []


# ---------- Module 9: Health Risk Scoring ----------
class HealthScoreBreakdown(BaseModel):
    overall_health_score: float  # 0 to 100 (100 = Optimal)
    overall_risk_score: float   # 0 to 100 (100 = Critical)
    risk_category: Literal["Low", "Moderate", "High", "Critical"]
    priority_level: Literal["Routine", "Attention Required", "Urgent", "Emergency"]
    sub_scores: dict[str, float]  # 10 components
    suggested_actions: list[str]


# ---------- Module 10: Lab Analysis ----------
class LabAnalysisRequest(BaseModel):
    patient_id: str
    panel_type: Literal[
        "CBC", "Blood Sugar", "Lipid Profile", "Liver Function Test",
        "Kidney Function Test", "Thyroid Profile", "Vitamin Profile", "Urine Analysis"
    ]
    values: dict[str, float | str]


class LabParameterResult(BaseModel):
    name: str
    value: float | str
    unit: str
    reference_range: str
    status: Literal["normal", "low", "high", "critical"]
    is_anomaly: bool = False


class LabAnalysisResponse(BaseModel):
    id: str = Field(default_factory=new_id)
    patient_id: str
    panel_type: str
    timestamp: str
    parameters: list[LabParameterResult]
    abnormal_count: int
    critical_count: int
    summary: str
    suggested_followups: list[str]


# ---------- Module 11: Image Metadata ----------
ImageModality = Literal["X-Ray", "MRI", "CT Scan", "Ultrasound", "ECG", "Skin Images"]


class ImageUploadRequest(BaseModel):
    patient_id: str
    modality: ImageModality
    anatomical_site: str
    notes: Optional[str] = None


# ---------- Module 12: Timeline ----------
class TimelineEvent(BaseModel):
    id: str = Field(default_factory=new_id)
    kind: Literal[
        "visit", "diagnosis", "lab", "image", "medication",
        "surgery", "vaccination", "risk_change", "vitals", "note"
    ]
    title: str
    detail: str = ""
    created_at: str = Field(default_factory=now_iso)
    metadata: dict[str, Any] = {}


# ---------- Module 13: Patient Similarity ----------
class SimilarPatientMatch(BaseModel):
    patient_id: str
    patient_name: str
    match_percentage: float
    overlapping_conditions: list[str]
    similarity_factors: list[str]
    effective_treatments: list[str]


# ---------- Module 14: Clinical Alerts & Notifications ----------
class ClinicalAlert(BaseModel):
    id: str = Field(default_factory=new_id)
    patient_id: str
    patient_name: str
    alert_type: str  # e.g., "High Blood Sugar", "High BP", "Kidney Failure Risk"
    severity: Literal["warning", "urgent", "critical"]
    message: str
    created_at: str = Field(default_factory=now_iso)
    is_active: bool = True


class NotificationItem(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    title: str
    message: str
    kind: Literal["reminder", "alert", "report", "appointment"]
    created_at: str = Field(default_factory=now_iso)
    read: bool = False


# ---------- Module 15: Hospital Analytics ----------
class HospitalAnalyticsSummary(BaseModel):
    total_patients: int
    daily_appointments: int
    high_risk_patients: int
    high_risk_percentage: float
    disease_distribution: dict[str, int]
    age_distribution: dict[str, int]
    gender_distribution: dict[str, int]
    monthly_growth: list[dict[str, Any]]
    doctor_roster: list[dict[str, Any]]
    ai_prediction_accuracy: float
    health_trends: list[dict[str, Any]]


# ---------- Common Models ----------
class DoctorNote(BaseModel):
    patient_id: str
    text: str


class AdminUserUpdate(BaseModel):
    role: Optional[Role] = None
    is_active: Optional[bool] = None


# ---------- Patient Pharmacy & Medicine Ordering Models ----------
class CartItem(BaseModel):
    medicine_id: str
    medicine_name: str
    quantity: int
    price: float
    prescription_required: bool = False


class PharmacyOrderCreate(BaseModel):
    patient_id: str
    patient_name: str
    phone: str
    delivery_address: str
    payment_method: str  # Cash on Delivery / Demo Card
    items: list[CartItem]
    prescription_file_url: Optional[str] = None
    subtotal: float
    delivery_charge: float
    total: float


# ---------- Doctor Models ----------
class DoctorRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    medical_registration_number: str
    specialization: str
    hospital_name: str
    department: str
    years_of_experience: int


class DoctorProfile(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    medical_registration_number: str
    specialization: str
    hospital_name: str
    department: str
    years_of_experience: int
    verification_status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: str = Field(default_factory=now_iso)


# ---------- Clinical Models ----------
class ClinicalRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    clinical_registration_number: str
    specialization: str
    hospital_name: str
    department: str
    years_of_experience: int


class ClinicalProfile(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    clinical_registration_number: str
    specialization: str
    hospital_name: str
    department: str
    years_of_experience: int
    verification_status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: str = Field(default_factory=now_iso)
