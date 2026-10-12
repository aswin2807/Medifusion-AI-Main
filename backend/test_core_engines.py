"""Automated Test Suite for Medifusion AI Core Engines & Clinical Modules:

Covers:
  1. Authentication & Security (Password hashing, JWT token lifecycle, signature verification)
  2. Disease Risk Prediction Engine (Diabetes, Heart Disease, CKD, Liver, Hypertension)
  3. Prediction Input/Output Validation & Calibration (Bounds, probabilities [0, 1], determinism)
  4. Explainable AI (SHAP-style attribution & LIME-style local explanations)
  5. 10-Parameter Comprehensive Health Score Engine (Sub-scores, priorities, clinical actions)
  6. Intelligent Laboratory Report Analyzer (Reference ranges, critical alerts, Z-scores)
  7. Real-Time Clinical Alerts Engine (Hypertensive crisis, hyperglycemia, renal risk)
  8. AI Patient Similarity Engine (Vector normalization, cosine similarity, condition matching)
  9. Hospital Analytics Engine (Disease distributions, demographic brackets, high-risk prevalence)
"""
import pytest
from datetime import datetime, timezone, timedelta
import jwt

from auth import hash_password, verify_password, create_token, decode_token, JWT_SECRET, JWT_ALGO
from risk_engine import (
    DISEASE_FNS,
    predict_diabetes,
    predict_heart_disease,
    predict_ckd,
    predict_liver,
    predict_hypertension,
    overall_risk_score,
    lime_local_explanation,
    validate_clinical_inputs,
    detect_anomalies,
    compute_health_state,
    compute_data_quality,
    CLINICAL_BOUNDS,
)
from health_score_engine import calculate_10_parameter_health_score
from lab_analyzer import analyze_lab_report, PANEL_REFERENCE_RANGES
from alerts_engine import evaluate_clinical_alerts
from similarity_engine import _cosine_similarity, _extract_patient_vector, find_similar_patients
from analytics_engine import compute_hospital_analytics


class TestAuthAndSecurity:
    """Module 1: Authentication and Security Verification."""

    def test_password_hashing_and_verification(self):
        raw_pw = "Clinician@SecurePass2026"
        hashed = hash_password(raw_pw)
        assert hashed != raw_pw
        assert verify_password(raw_pw, hashed) is True
        assert verify_password("WrongPassword123", hashed) is False

    def test_jwt_token_creation_and_decoding(self):
        user_id = "user_test_123"
        role = "doctor"
        email = "dr.test@healthtwin.ai"
        token = create_token(user_id, role, email)
        assert isinstance(token, str)

        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert payload["role"] == role
        assert payload["email"] == email
        assert "exp" in payload

    def test_expired_token_rejection(self):
        expired_payload = {
            "sub": "user_expired",
            "role": "patient",
            "email": "expired@healthtwin.ai",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGO)
        with pytest.raises(Exception) as excinfo:
            decode_token(expired_token)
        assert "expired" in str(excinfo.value).lower()

    def test_tampered_token_rejection(self):
        valid_token = create_token("u1", "patient", "test@test.com")
        tampered_token = valid_token[:-4] + "fake"
        with pytest.raises(Exception):
            decode_token(tampered_token)


class TestPredictionAndClinicalRiskEngine:
    """Module 4 & 5: Disease Risk Prediction and Explainable AI Engine."""

    def test_clinical_input_validation_physiological_bounds(self):
        # Valid clinical data
        valid_ctx = {
            "age": 45,
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "hba1c": 5.8,
            "blood_sugar": 110,
            "bmi": 26.5,
        }
        res = validate_clinical_inputs(valid_ctx)
        assert res["is_valid"] is True
        assert len(res["errors"]) == 0

        # Invalid/impossible clinical data (negative age, SBP of 450, negative glucose)
        invalid_ctx = {
            "age": -10,
            "systolic_bp": 450,
            "blood_sugar": -25,
            "hba1c": 35.0,
        }
        res_inv = validate_clinical_inputs(invalid_ctx)
        assert res_inv["is_valid"] is False
        assert len(res_inv["errors"]) >= 3

    def test_deterministic_output(self):
        patient = {
            "age": 52,
            "bmi": 29.0,
            "systolic_bp": 142,
            "diastolic_bp": 88,
            "hba1c": 6.8,
            "blood_sugar": 135,
            "smoking": 1,
        }
        pred_1 = predict_diabetes(patient)
        pred_2 = predict_diabetes(patient)
        assert pred_1["risk_percent"] == pred_2["risk_percent"]
        assert pred_1["severity"] == pred_2["severity"]
        assert pred_1["probability"] == pred_2["probability"]

    def test_all_five_diseases_output_structure(self):
        patient = {
            "age": 55,
            "bmi": 28.0,
            "systolic_bp": 138,
            "diastolic_bp": 86,
            "hba1c": 6.2,
            "blood_sugar": 115,
            "cholesterol_total": 210,
            "creatinine": 1.1,
            "alt": 35,
            "ast": 32,
            "smoking": 1,
            "alcohol": 0,
        }
        for name, fn in DISEASE_FNS.items():
            res = fn(patient)
            assert "disease" in res
            assert 0.0 <= res["risk_percent"] <= 100.0
            assert 0.0 <= res["probability"] <= 1.0
            assert res["severity"] in ["Low", "Moderate", "High", "Critical"]
            assert 0.0 <= res["confidence"] <= 1.0
            assert isinstance(res["contributions"], list)
            assert len(res["contributions"]) > 0

    def test_shap_and_lime_feature_attribution_coherence(self):
        patient = {
            "age": 60,
            "bmi": 32.0,
            "hba1c": 7.8,
            "blood_sugar": 165,
            "family_history_diabetes": 1,
        }
        pred = predict_diabetes(patient)
        shap_contribs = pred["contributions"]
        assert len(shap_contribs) > 0

        # High HbA1c (7.8 > 5.5) must have positive direction risk increase
        hba1c_feat = next(c for c in shap_contribs if c["feature"] == "HbA1c")
        assert hba1c_feat["weight"] > 0
        assert hba1c_feat["direction"] == "positive"
        assert hba1c_feat["impact_pct"] > 0

        # LIME local explanation must extract top 5 features with consistent directions
        lime = lime_local_explanation(pred)
        assert len(lime) <= 5
        assert lime[0]["feature"] == shap_contribs[0]["feature"]
        assert lime[0]["weight"] == round(shap_contribs[0]["weight"], 2)

    def test_overall_risk_score_and_anomalies(self):
        high_risk_pt = {
            "systolic_bp": 175,
            "blood_sugar": 220,
            "heart_rate": 115,
        }
        anomalies = detect_anomalies(high_risk_pt)
        assert len(anomalies) >= 3
        assert any(a["type"] == "Hypertensive Crisis Spike" for a in anomalies)
        assert any(a["type"] == "Hyperglycemic Spike" for a in anomalies)
        assert any(a["type"] == "Tachycardia Spike" for a in anomalies)

        health_state = compute_health_state(75.0, anomalies)
        assert health_state == "Critical"


class TestHealthScoreEngine:
    """Module 9: 10-Parameter Health Risk Scoring Engine."""

    def test_optimal_healthy_profile(self):
        healthy_ctx = {
            "age": 28,
            "bmi": 21.5,
            "systolic_bp": 115,
            "diastolic_bp": 75,
            "hba1c": 5.1,
            "blood_sugar": 85,
            "creatinine": 0.8,
            "alt": 20,
            "ast": 22,
            "cholesterol_total": 165,
            "smoking": False,
            "alcohol": False,
            "sleep_hours": 8.0,
            "physical_activity_hours": 5.0,
        }
        res = calculate_10_parameter_health_score(healthy_ctx)
        assert res["overall_health_score"] >= 80.0
        assert res["overall_risk_score"] <= 20.0
        assert res["risk_category"] == "Low"
        assert res["priority_level"] == "Routine"
        assert len(res["sub_scores"]) == 10

    def test_multi_morbidity_critical_profile(self):
        critical_ctx = {
            "age": 72,
            "bmi": 36.0,
            "systolic_bp": 165,
            "diastolic_bp": 98,
            "hba1c": 8.8,
            "blood_sugar": 210,
            "creatinine": 2.1,
            "alt": 65,
            "ast": 70,
            "cholesterol_total": 260,
            "smoking": True,
            "alcohol": True,
        }
        res = calculate_10_parameter_health_score(critical_ctx)
        assert res["overall_risk_score"] >= 65.0
        assert res["risk_category"] in ["High", "Critical"]
        assert res["priority_level"] in ["Urgent", "Emergency"]
        assert len(res["suggested_actions"]) >= 3


class TestIntelligentLabAnalyzer:
    """Module 10: Intelligent Laboratory Report Analysis."""

    def test_normal_blood_sugar_panel(self):
        vals = {"blood_sugar": 88.0, "hba1c": 5.2}
        res = analyze_lab_report("Blood Sugar", vals)
        assert res["abnormal_count"] == 0
        assert res["critical_count"] == 0
        assert "NORMAL" in res["summary"]

    def test_critical_diabetic_ketoacidosis_spike(self):
        vals = {"blood_sugar": 320.0, "hba1c": 11.2}
        res = analyze_lab_report("Blood Sugar", vals)
        assert res["abnormal_count"] == 2
        assert res["critical_count"] == 2
        assert "URGENT" in res["summary"]
        assert any("HbA1c" in f for f in res["suggested_followups"])

    def test_kidney_function_panel_evaluation(self):
        vals = {"creatinine": 2.4, "bun": 35.0, "egfr": 45.0}
        res = analyze_lab_report("Kidney Function Test", vals)
        assert res["abnormal_count"] >= 2
        assert any(p["name"] == "Creatinine" and p["status"] in ["high", "critical"] for p in res["parameters"])


class TestClinicalAlertsAndSimilarityEngine:
    """Modules 13 & 14: Clinical Alerts & Patient Similarity Engine."""

    def test_hypertensive_crisis_alert_trigger(self):
        ctx = {"systolic_bp": 178, "diastolic_bp": 108, "heart_rate": 88}
        alerts = evaluate_clinical_alerts("pt_1", "Test Patient", ctx)
        assert len(alerts) >= 1
        assert any("Hypertensive Crisis" in a["alert_type"] for a in alerts)
        assert any(a["severity"] == "critical" for a in alerts)

    def test_patient_similarity_cosine_math(self):
        v1 = [0.5, 0.4, 0.6, 0.6, 0.4, 0.3, 0.2, 0.1, 1.0, 1.0, 0.0, 0.0]
        v2 = [0.52, 0.41, 0.61, 0.59, 0.42, 0.31, 0.2, 0.12, 1.0, 1.0, 0.0, 0.0]
        sim = _cosine_similarity(v1, v2)
        assert 0.95 <= sim <= 1.0

        target_ctx = {"age": 50, "bmi": 28, "systolic_bp": 140, "has_diabetes": True, "has_hypertension": True}
        cohort = [
            {"id": "pt_match", "profile": {"age": 52, "bmi": 28.5, "has_diabetes": True, "has_hypertension": True}, "vitals": {"systolic_bp": 142}},
            {"id": "pt_diff", "profile": {"age": 22, "bmi": 19.0, "has_diabetes": False, "has_hypertension": False}, "vitals": {"systolic_bp": 110}},
        ]
        matches = find_similar_patients("pt_curr", target_ctx, cohort)
        assert len(matches) == 2
        assert matches[0]["patient_id"] == "pt_match"
        assert matches[0]["match_percentage"] > matches[1]["match_percentage"]


class TestHospitalAnalyticsEngine:
    """Module 15: Hospital Analytics & Population Health Engine."""

    def test_hospital_analytics_aggregation(self):
        users = [
            {"id": "u1", "role": "patient", "full_name": "Patient 1"},
            {"id": "u2", "role": "patient", "full_name": "Patient 2"},
            {"id": "d1", "role": "doctor", "full_name": "Dr. Smith"},
        ]
        twins = [
            {"user_id": "u1", "profile": {"age": 45, "gender": "male", "has_diabetes": True}, "vitals": {"systolic_bp": 150}, "labs": {"hba1c": 7.6}},
            {"user_id": "u2", "profile": {"age": 68, "gender": "female"}, "vitals": {"systolic_bp": 120}, "labs": {}},
        ]
        res = compute_hospital_analytics(users, twins, images_count=12, doctor_notes_count=6)
        assert res["total_patients"] == 2
        assert res["high_risk_patients"] == 1
        assert res["high_risk_percentage"] == 50.0
        assert res["disease_distribution"]["Diabetes"] >= 1
        assert res["disease_distribution"]["Heart Disease"] >= 1
        assert len(res["doctor_roster"]) == 1
