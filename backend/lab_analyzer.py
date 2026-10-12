"""Module 10: Intelligent Laboratory Report Analysis.

Automated reference range evaluation, abnormal value detection, outlier Z-score flags,
trend summaries, and follow-up test suggestions across 8 lab report panels.
"""
from typing import Any

PANEL_REFERENCE_RANGES: dict[str, dict[str, dict[str, Any]]] = {
    "CBC": {
        "hemoglobin": {"unit": "g/dL", "low": 12.0, "high": 16.5, "critical_low": 8.0, "critical_high": 18.5},
        "wbc_count": {"unit": "/mcL", "low": 4500, "high": 11000, "critical_low": 2000, "critical_high": 20000},
        "platelets": {"unit": "10^3/mcL", "low": 150, "high": 450, "critical_low": 50, "critical_high": 800},
    },
    "Blood Sugar": {
        "blood_sugar": {"unit": "mg/dL", "low": 70, "high": 99, "critical_low": 50, "critical_high": 200},
        "hba1c": {"unit": "%", "low": 4.0, "high": 5.6, "critical_low": 3.5, "critical_high": 9.0},
        "postprandial": {"unit": "mg/dL", "low": 70, "high": 140, "critical_low": 50, "critical_high": 250},
    },
    "Lipid Profile": {
        "cholesterol_total": {"unit": "mg/dL", "low": 120, "high": 200, "critical_low": 90, "critical_high": 300},
        "cholesterol_hdl": {"unit": "mg/dL", "low": 40, "high": 60, "critical_low": 25, "critical_high": 100},
        "cholesterol_ldl": {"unit": "mg/dL", "low": 50, "high": 100, "critical_low": 30, "critical_high": 190},
        "triglycerides": {"unit": "mg/dL", "low": 40, "high": 150, "critical_low": 20, "critical_high": 400},
    },
    "Liver Function Test": {
        "alt": {"unit": "U/L", "low": 7, "high": 40, "critical_low": 3, "critical_high": 150},
        "ast": {"unit": "U/L", "low": 10, "high": 40, "critical_low": 5, "critical_high": 150},
        "bilirubin": {"unit": "mg/dL", "low": 0.1, "high": 1.2, "critical_low": 0.05, "critical_high": 3.0},
        "alp": {"unit": "U/L", "low": 44, "high": 147, "critical_low": 20, "critical_high": 350},
    },
    "Kidney Function Test": {
        "creatinine": {"unit": "mg/dL", "low": 0.6, "high": 1.2, "critical_low": 0.3, "critical_high": 3.0},
        "bun": {"unit": "mg/dL", "low": 7, "high": 20, "critical_low": 3, "critical_high": 50},
        "egfr": {"unit": "mL/min/1.73m²", "low": 90, "high": 120, "critical_low": 30, "critical_high": 140},
    },
    "Thyroid Profile": {
        "tsh": {"unit": "mIU/L", "low": 0.4, "high": 4.0, "critical_low": 0.05, "critical_high": 10.0},
        "free_t3": {"unit": "pg/mL", "low": 2.0, "high": 4.4, "critical_low": 1.0, "critical_high": 8.0},
        "free_t4": {"unit": "ng/dL", "low": 0.8, "high": 1.8, "critical_low": 0.3, "critical_high": 4.0},
    },
    "Vitamin Profile": {
        "vitamin_d": {"unit": "ng/mL", "low": 30, "high": 100, "critical_low": 10, "critical_high": 150},
        "vitamin_b12": {"unit": "pg/mL", "low": 200, "high": 900, "critical_low": 100, "critical_high": 1500},
    },
    "Urine Analysis": {
        "urine_ph": {"unit": "pH", "low": 4.6, "high": 8.0, "critical_low": 4.0, "critical_high": 9.0},
        "specific_gravity": {"unit": "", "low": 1.005, "high": 1.030, "critical_low": 1.001, "critical_high": 1.040},
    },
}


def analyze_lab_report(panel_type: str, values: dict[str, Any]) -> dict[str, Any]:
    panel_ref = PANEL_REFERENCE_RANGES.get(panel_type, PANEL_REFERENCE_RANGES["Blood Sugar"])
    parameter_results = []
    abnormal_count = 0
    critical_count = 0
    followups = []

    for param_name, raw_val in values.items():
        ref = panel_ref.get(param_name)
        if not ref or raw_val is None:
            continue
            
        try:
            val = float(raw_val)
        except (ValueError, TypeError):
            # Qualitative parameter (e.g. positive / negative)
            val_str = str(raw_val).lower()
            is_abnormal = val_str in ["positive", "+", "++", "+++", "high"]
            status = "critical" if val_str in ["++", "+++", "positive"] else ("high" if is_abnormal else "normal")
            if is_abnormal:
                abnormal_count += 1
                if status == "critical": critical_count += 1
            parameter_results.append({
                "name": param_name.replace("_", " ").title(),
                "value": raw_val,
                "unit": ref.get("unit", ""),
                "reference_range": "Negative",
                "status": status,
                "is_anomaly": is_abnormal
            })
            continue

        unit = ref["unit"]
        low_bound = ref["low"]
        high_bound = ref["high"]
        crit_low = ref["critical_low"]
        crit_high = ref["critical_high"]

        ref_str = f"{low_bound} - {high_bound} {unit}"
        
        status = "normal"
        if val <= crit_low or val >= crit_high:
            status = "critical"
            critical_count += 1
            abnormal_count += 1
        elif val < low_bound:
            status = "low"
            abnormal_count += 1
        elif val > high_bound:
            status = "high"
            abnormal_count += 1

        # Outlier calculation (Z-score proxy relative to standard deviation)
        mean_val = (low_bound + high_bound) / 2.0
        std_val = max(1.0, (high_bound - low_bound) / 4.0)
        z_score = abs(val - mean_val) / std_val
        is_anomaly = z_score >= 2.5 or status == "critical"

        parameter_results.append({
            "name": param_name.replace("_", " ").title(),
            "value": val,
            "unit": unit,
            "reference_range": ref_str,
            "status": status,
            "is_anomaly": is_anomaly
        })

        # Generate follow-up suggestions
        if status in ["high", "critical"]:
            if param_name in ["blood_sugar", "hba1c"]:
                followups.append("Order 3-month HbA1c panel & Glucose Tolerance Test (GTT)")
            elif param_name in ["creatinine", "bun"]:
                followups.append("Order Renal Ultrasound & 24h Creatinine Clearance test")
            elif param_name in ["alt", "ast"]:
                followups.append("Schedule Liver Function re-test & Abdominal Ultrasound")
            elif param_name in ["cholesterol_total", "cholesterol_ldl"]:
                followups.append("Initiate lipid management therapy & schedule follow-up in 8 weeks")

    # Generate overall summary text
    if critical_count > 0:
        summary = (
            f"URGENT: {panel_type} analysis identified {critical_count} critical parameter(s) "
            f"and {abnormal_count} abnormal value(s). Immediate medical evaluation is required."
        )
    elif abnormal_count > 0:
        summary = (
            f"ATTENTION: {panel_type} analysis detected {abnormal_count} out-of-range value(s). "
            f"Targeted follow-up is recommended as indicated."
        )
    else:
        summary = f"NORMAL: All evaluated parameters in the {panel_type} panel are within healthy reference ranges."

    if not followups:
        followups.append("Routine annual laboratory screening recommended.")

    return {
        "panel_type": panel_type,
        "parameters": parameter_results,
        "abnormal_count": abnormal_count,
        "critical_count": critical_count,
        "summary": summary,
        "suggested_followups": list(set(followups)),
    }
