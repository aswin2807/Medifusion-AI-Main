"""Module 14: Clinical Alert & Notification System.

Evaluates digital twin vitals, labs, and history to generate automated real-time
clinical alerts and patient/doctor notifications.
"""
from typing import Any
import uuid


def evaluate_clinical_alerts(patient_id: str, patient_name: str, ctx: dict[str, Any]) -> list[dict[str, Any]]:
    alerts = []

    sys_bp = float(ctx.get("systolic_bp") or 120)
    dia_bp = float(ctx.get("diastolic_bp") or 80)
    hr = float(ctx.get("heart_rate") or 72)
    bs = float(ctx.get("blood_sugar") or 95)
    hba1c = float(ctx.get("hba1c") or 5.4)
    creatinine = float(ctx.get("creatinine") or 0.9)
    alt = float(ctx.get("alt") or 22)

    # 1. High Blood Sugar / Diabetes Alert
    if bs >= 180 or hba1c >= 8.5:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Critical Glycemic Spike",
            "severity": "critical",
            "message": f"Fasting blood sugar is {bs} mg/dL (HbA1c {hba1c}%). High risk of diabetic ketoacidosis or acute hyperglycemia.",
            "is_active": True,
        })
    elif bs >= 140 or hba1c >= 7.0:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "High Blood Sugar",
            "severity": "urgent",
            "message": f"Elevated blood sugar detected ({bs} mg/dL). Medication review recommended.",
            "is_active": True,
        })

    # 2. High Blood Pressure Alert
    if sys_bp >= 160 or dia_bp >= 100:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Hypertensive Crisis Warning",
            "severity": "critical",
            "message": f"Blood pressure is Stage-2 Hypertensive ({int(sys_bp)}/{int(dia_bp)} mmHg). Urgent clinical evaluation required.",
            "is_active": True,
        })
    elif sys_bp >= 140 or dia_bp >= 90:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "High Blood Pressure",
            "severity": "urgent",
            "message": f"Stage-1 Hypertension detected ({int(sys_bp)}/{int(dia_bp)} mmHg). Recommend sodium restriction & 24h ABPM.",
            "is_active": True,
        })

    # 3. Abnormal Heart Rate / ECG Alert
    if hr >= 110 or hr <= 45:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Abnormal Heart Rate / Arrhythmia Risk",
            "severity": "critical",
            "message": f"Heart rate recorded at {int(hr)} bpm. Order 12-lead ECG and Holter monitor telemetry.",
            "is_active": True,
        })

    # 4. Kidney Failure Risk Alert
    if creatinine >= 1.8:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Renal Failure Acute Risk",
            "severity": "critical",
            "message": f"Serum Creatinine is critically elevated at {creatinine} mg/dL. Nephrology consult advised.",
            "is_active": True,
        })
    elif creatinine >= 1.3:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Elevated Renal Marker",
            "severity": "warning",
            "message": f"Creatinine level is {creatinine} mg/dL. Monitor hydration and avoid nephrotoxic drugs.",
            "is_active": True,
        })

    # 5. Liver Injury Risk
    if alt >= 70:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Hepatic Enzyme Elevation",
            "severity": "urgent",
            "message": f"ALT enzyme level is elevated ({alt} U/L). Screen for fatty liver / hepatic inflammation.",
            "is_active": True,
        })

    # 6. Default routine alert if none triggered
    if not alerts:
        alerts.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "patient_name": patient_name,
            "alert_type": "Routine Health Monitoring",
            "severity": "warning",
            "message": "All clinical parameters are within baseline targets. Next routine lab screening due in 30 days.",
            "is_active": True,
        })

    return alerts
