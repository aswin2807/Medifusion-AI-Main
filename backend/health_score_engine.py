"""Module 9: AI Health Risk Scoring Engine.

Computes a comprehensive 10-parameter Health Score (0-100) and Risk Score (0-100)
along with Risk Category, Priority Level, and Suggested Actions.
"""
from typing import Any


def calculate_10_parameter_health_score(patient_ctx: dict[str, Any]) -> dict[str, Any]:
    # Extract values with safe defaults
    age = float(patient_ctx.get("age") or 30)
    bmi = float(patient_ctx.get("bmi") or 24.0)
    sys_bp = float(patient_ctx.get("systolic_bp") or 120)
    dia_bp = float(patient_ctx.get("diastolic_bp") or 80)
    
    hba1c = float(patient_ctx.get("hba1c") or 5.4)
    blood_sugar = float(patient_ctx.get("blood_sugar") or 95)
    creatinine = float(patient_ctx.get("creatinine") or 0.9)
    alt = float(patient_ctx.get("alt") or 22)
    ast = float(patient_ctx.get("ast") or 24)
    chol_tot = float(patient_ctx.get("cholesterol_total") or 180)
    
    smoking = bool(patient_ctx.get("smoking", False))
    alcohol = bool(patient_ctx.get("alcohol", False))
    sleep_hours = float(patient_ctx.get("sleep_hours") or 7.0)
    activity_hours = float(patient_ctx.get("physical_activity_hours") or 3.0)
    
    fam_diabetes = bool(patient_ctx.get("family_history_diabetes", False))
    fam_heart = bool(patient_ctx.get("family_history_heart", False))
    fam_kidney = bool(patient_ctx.get("family_history_kidney", False))
    fam_htn = bool(patient_ctx.get("family_history_hypertension", False))

    # Sub-score 1: Cardiovascular Risk (0-100)
    cardio_risk = 0.0
    if sys_bp >= 140 or dia_bp >= 90: cardio_risk += 35
    elif sys_bp >= 130 or dia_bp >= 85: cardio_risk += 20
    if chol_tot >= 240: cardio_risk += 30
    elif chol_tot >= 200: cardio_risk += 15
    if smoking: cardio_risk += 25
    if fam_heart: cardio_risk += 15
    cardio_risk = min(100.0, cardio_risk)

    # Sub-score 2: Diabetes Risk (0-100)
    diab_risk = 0.0
    if hba1c >= 6.5: diab_risk += 50
    elif hba1c >= 5.7: diab_risk += 25
    if blood_sugar >= 126: diab_risk += 40
    elif blood_sugar >= 100: diab_risk += 20
    if bmi >= 30: diab_risk += 20
    if fam_diabetes: diab_risk += 15
    diab_risk = min(100.0, diab_risk)

    # Sub-score 3: Kidney Risk (0-100)
    kidney_risk = 0.0
    if creatinine >= 1.5: kidney_risk += 60
    elif creatinine >= 1.2: kidney_risk += 30
    if sys_bp >= 140: kidney_risk += 20
    if patient_ctx.get("urine_protein") in ["+", "++", "positive"]: kidney_risk += 30
    if fam_kidney: kidney_risk += 15
    kidney_risk = min(100.0, kidney_risk)

    # Sub-score 4: Liver Risk (0-100)
    liver_risk = 0.0
    if alt >= 55 or ast >= 55: liver_risk += 50
    elif alt >= 40 or ast >= 40: liver_risk += 25
    if alcohol: liver_risk += 35
    if bmi >= 30: liver_risk += 20
    liver_risk = min(100.0, liver_risk)

    # Sub-score 5: Lifestyle Risk (0-100)
    life_risk = 0.0
    if smoking: life_risk += 35
    if alcohol: life_risk += 25
    if sleep_hours < 6.0: life_risk += 20
    if activity_hours < 2.0: life_risk += 20
    life_risk = min(100.0, life_risk)

    # Sub-score 6: BMI Score (0-100 risk)
    if bmi < 18.5: bmi_risk = 25.0
    elif 18.5 <= bmi <= 24.9: bmi_risk = 5.0
    elif 25.0 <= bmi <= 29.9: bmi_risk = 35.0
    elif 30.0 <= bmi <= 34.9: bmi_risk = 65.0
    else: bmi_risk = 90.0

    # Sub-score 7: Blood Pressure Score (0-100 risk)
    if sys_bp < 120 and dia_bp < 80: bp_risk = 5.0
    elif 120 <= sys_bp <= 129 and dia_bp < 80: bp_risk = 25.0
    elif 130 <= sys_bp <= 139 or 80 <= dia_bp <= 89: bp_risk = 55.0
    elif 140 <= sys_bp <= 179 or 90 <= dia_bp <= 119: bp_risk = 80.0
    else: bp_risk = 100.0

    # Sub-score 8: Laboratory Score (0-100 risk)
    lab_anomalies = 0
    if hba1c >= 6.5 or blood_sugar >= 126: lab_anomalies += 1
    if creatinine >= 1.3: lab_anomalies += 1
    if alt >= 45 or ast >= 45: lab_anomalies += 1
    if chol_tot >= 220: lab_anomalies += 1
    lab_risk = min(100.0, lab_anomalies * 25.0)

    # Sub-score 9: Age Risk Factor (0-100 risk)
    if age < 35: age_risk = 10.0
    elif age < 50: age_risk = 30.0
    elif age < 65: age_risk = 55.0
    else: age_risk = 80.0

    # Sub-score 10: Family History Score (0-100 risk)
    fam_count = sum([fam_diabetes, fam_heart, fam_kidney, fam_htn])
    fam_risk = min(100.0, fam_count * 25.0)

    # Calculate overall risk & overall health score
    sub_scores = {
        "Cardiovascular Risk": round(cardio_risk, 1),
        "Diabetes Risk": round(diab_risk, 1),
        "Kidney Risk": round(kidney_risk, 1),
        "Liver Risk": round(liver_risk, 1),
        "Lifestyle Risk": round(life_risk, 1),
        "BMI Score": round(bmi_risk, 1),
        "Blood Pressure Score": round(bp_risk, 1),
        "Laboratory Score": round(lab_risk, 1),
        "Age Risk Factor": round(age_risk, 1),
        "Family History Score": round(fam_risk, 1),
    }

    weights = {
        "Cardiovascular Risk": 0.15,
        "Diabetes Risk": 0.15,
        "Kidney Risk": 0.12,
        "Liver Risk": 0.08,
        "Lifestyle Risk": 0.10,
        "BMI Score": 0.10,
        "Blood Pressure Score": 0.10,
        "Laboratory Score": 0.10,
        "Age Risk Factor": 0.05,
        "Family History Score": 0.05,
    }

    weighted_risk = sum(sub_scores[k] * weights[k] for k in sub_scores)
    overall_risk_score = round(min(100.0, max(0.0, weighted_risk)), 1)
    overall_health_score = round(max(0.0, 100.0 - overall_risk_score), 1)

    # Risk Category & Priority
    if overall_risk_score >= 70:
        risk_category = "Critical"
        priority_level = "Emergency"
    elif overall_risk_score >= 45:
        risk_category = "High"
        priority_level = "Urgent"
    elif overall_risk_score >= 25:
        risk_category = "Moderate"
        priority_level = "Attention Required"
    else:
        risk_category = "Low"
        priority_level = "Routine"

    # Suggested actions
    actions = []
    if cardio_risk >= 40:
        actions.append("Schedule ECG / Echocardiogram & Lipid profile review")
    if diab_risk >= 40:
        actions.append("Consult endocrinologist for HbA1c & fasting blood glucose titration")
    if kidney_risk >= 40:
        actions.append("Order eGFR renal panel and 24h urine protein test")
    if liver_risk >= 40:
        actions.append("Perform liver ultrasound & review ALT/AST trend")
    if life_risk >= 40:
        actions.append("Initiate smoking cessation and lifestyle modification program")
    if bp_risk >= 40:
        actions.append("Recommend 24-hour ambulatory blood pressure monitoring (ABPM)")
    if not actions:
        actions.append("Maintain current healthy lifestyle routines & schedule annual checkup")

    return {
        "overall_health_score": overall_health_score,
        "overall_risk_score": overall_risk_score,
        "risk_category": risk_category,
        "priority_level": priority_level,
        "sub_scores": sub_scores,
        "suggested_actions": actions,
    }
