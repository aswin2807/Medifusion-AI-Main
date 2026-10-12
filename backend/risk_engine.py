"""Rule-based clinical risk scoring for 5 diseases with SHAP-style feature contributions.

Each disease returns:
  risk_percent (0-100), confidence (0-1), severity (Low/Moderate/High/Critical),
  contributions: list of {feature, value, weight, direction, impact_pct}
"""
from typing import Any


def _clip(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _severity(risk: float) -> str:
    if risk < 25:
        return "Low"
    if risk < 50:
        return "Moderate"
    if risk < 75:
        return "High"
    return "Critical"


def _confidence(contribs: list) -> float:
    # crude: more non-zero contributors → higher confidence
    active = sum(1 for c in contribs if abs(c["weight"]) > 0.5)
    return round(min(0.95, 0.55 + 0.06 * active), 2)


def compute_data_quality(ctx: dict) -> dict:
    """Evaluate patient data completeness and quality score (0-100)."""
    expected_fields = ["age", "gender", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "blood_sugar", "hba1c", "cholesterol_total"]
    present = sum(1 for f in expected_fields if ctx.get(f) not in (None, "", 0, 0.0))
    pct = round((present / len(expected_fields)) * 100)
    if pct >= 70:
        label = "Good"
    elif pct >= 40:
        label = "Moderate"
    else:
        label = "Needs Completing"
    return {"score": pct, "label": label, "missing_count": len(expected_fields) - present}


def detect_anomalies(ctx: dict) -> list[dict]:
    """Detect health measurement anomalies and vital spikes."""
    anomalies = []
    sbp = _num(ctx, "systolic_bp", 0)
    if sbp > 160:
        anomalies.append({"type": "Hypertensive Crisis Spike", "parameter": "Systolic BP", "value": sbp, "severity": "Critical", "message": f"Critical Systolic BP spike measured at {sbp} mmHg."})
    elif sbp > 140:
        anomalies.append({"type": "Elevated Blood Pressure", "parameter": "Systolic BP", "value": sbp, "severity": "High", "message": f"Elevated Systolic BP observed at {sbp} mmHg."})

    glucose = _num(ctx, "blood_sugar", 0)
    if glucose > 200:
        anomalies.append({"type": "Hyperglycemic Spike", "parameter": "Fasting Glucose", "value": glucose, "severity": "Critical", "message": f"Severe blood glucose spike at {glucose} mg/dL."})
    elif glucose > 140:
        anomalies.append({"type": "Elevated Glucose", "parameter": "Fasting Glucose", "value": glucose, "severity": "Moderate", "message": f"Elevated blood glucose observed at {glucose} mg/dL."})

    hr = _num(ctx, "heart_rate", 0)
    if hr > 100:
        anomalies.append({"type": "Tachycardia Spike", "parameter": "Heart Rate", "value": hr, "severity": "High", "message": f"Heart rate elevation (Tachycardia) at {hr} bpm."})
    elif hr > 0 and hr < 50:
        anomalies.append({"type": "Bradycardia Drop", "parameter": "Heart Rate", "value": hr, "severity": "High", "message": f"Low heart rate (Bradycardia) detected at {hr} bpm."})

    return anomalies


def compute_health_state(score: float, anomalies: list) -> str:
    """Determine Digital Twin Health State (Stable, Improving, Needs Attention, High Risk, Critical)."""
    if score >= 65 or any(a["severity"] == "Critical" for a in anomalies):
        return "Critical"
    elif score >= 45 or any(a["severity"] == "High" for a in anomalies):
        return "High Risk"
    elif score >= 25 or len(anomalies) > 0:
        return "Needs Attention"
    else:
        return "Stable"


CLINICAL_BOUNDS = {
    "age": (0.0, 125.0),
    "bmi": (10.0, 90.0),
    "hba1c": (3.0, 20.0),
    "blood_sugar": (20.0, 800.0),
    "systolic_bp": (40.0, 300.0),
    "diastolic_bp": (20.0, 200.0),
    "cholesterol_total": (40.0, 600.0),
    "cholesterol_hdl": (5.0, 150.0),
    "creatinine": (0.1, 25.0),
    "alt": (1.0, 800.0),
    "ast": (1.0, 800.0),
    "physical_activity_hours": (0.0, 80.0),
    "heart_rate": (20.0, 250.0),
    "temperature": (80.0, 115.0),
    "oxygen_saturation": (50.0, 100.0),
}


def validate_clinical_inputs(ctx: dict) -> dict[str, Any]:
    """Validate clinical inputs against physiological ranges and return validation report."""
    errors = []
    warnings = []
    validated = {}

    for k, (lo, hi) in CLINICAL_BOUNDS.items():
        v = ctx.get(k)
        if v not in (None, "", "null"):
            try:
                val = float(v)
                if val < lo or val > hi:
                    errors.append(f"{k} value {val} is outside valid physiological range [{lo}, {hi}].")
                else:
                    validated[k] = val
            except (ValueError, TypeError):
                errors.append(f"{k} has malformed non-numeric value: {v}")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "validated_fields": validated,
    }


def _pack(name: str, risk: float, contribs: list, ctx: dict = None) -> dict:
    total = sum(abs(c["weight"]) for c in contribs) or 1.0
    for c in contribs:
        c["impact_pct"] = round(abs(c["weight"]) / total * 100, 1)
        c["direction"] = "positive" if c["weight"] > 0 else "negative"
    contribs_sorted = sorted(contribs, key=lambda x: abs(x["weight"]), reverse=True)
    
    conf = _confidence(contribs)
    reliability = "High" if conf >= 0.8 else "Moderate" if conf >= 0.65 else "Basic"
    dq = compute_data_quality(ctx or {})
    risk_pct = round(_clip(risk), 1)
    probability = round(risk_pct / 100.0, 4)
    
    return {
        "disease": name,
        "risk_percent": risk_pct,
        "probability": probability,
        "severity": _severity(risk_pct),
        "confidence": conf,
        "reliability": reliability,
        "data_quality": dq["label"],
        "contributions": contribs_sorted,
    }


def _num(d: dict, key: str, default: float = 0.0) -> float:
    # Key-specific baseline values to prevent division/subtraction bias on empty data
    baselines = {
        "age": 35.0,
        "bmi": 22.0,
        "hba1c": 5.4,
        "blood_sugar": 90.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "cholesterol_total": 170.0,
        "cholesterol_hdl": 50.0,
        "creatinine": 0.8,
        "alt": 25.0,
        "ast": 25.0,
        "physical_activity_hours": 3.0
    }
    
    # Fallback to key-specific default if default is 0.0
    fallback = baselines.get(key, default) if default == 0.0 else default
    
    try:
        v = d.get(key)
        if v in (None, "", 0, 0.0):
            return fallback
        v_float = float(v)
        # Prevent negative or biologically impossible outlier corrupting calculations
        if key in CLINICAL_BOUNDS:
            lo, hi = CLINICAL_BOUNDS[key]
            v_float = max(lo, min(hi, v_float))
        return v_float
    except (TypeError, ValueError):
        return fallback


def predict_diabetes(p: dict) -> dict:
    age = _num(p, "age")
    bmi = _num(p, "bmi")
    hba1c = _num(p, "hba1c")
    glucose = _num(p, "blood_sugar")
    family = 1 if p.get("family_history_diabetes") else 0
    activity = _num(p, "physical_activity_hours")
    smoking = 1 if p.get("smoking") else 0

    def add(feat, val, w):
        c.append({"feature": feat, "value": val, "weight": w})
        return w
    c = []
    r = 0
    r += add("HbA1c", hba1c, (hba1c - 5.5) * 12)
    r += add("Fasting Glucose", glucose, (glucose - 100) * 0.15)
    r += add("BMI", bmi, (bmi - 25) * 1.5)
    r += add("Age", age, max(0, (age - 40)) * 0.35)
    r += add("Family History", family, family * 12)
    r += add("Physical Activity", activity, -min(activity, 10) * 1.2)
    r += add("Smoking", smoking, smoking * 6)
    return _pack("Diabetes", r + 8, c, ctx=p)


def predict_heart_disease(p: dict) -> dict:
    age = _num(p, "age")
    bmi = _num(p, "bmi")
    sbp = _num(p, "systolic_bp")
    chol = _num(p, "cholesterol_total")
    hdl = _num(p, "cholesterol_hdl", 50)
    smoking = 1 if p.get("smoking") else 0
    diabetes = 1 if p.get("has_diabetes") else 0
    gender = 1 if str(p.get("gender", "")).lower().startswith("m") else 0

    c = []
    r = 0
    def add(feat, val, w):
        c.append({"feature": feat, "value": val, "weight": w})
        return w
    r += add("Age", age, max(0, (age - 40)) * 0.6)
    r += add("Systolic BP", sbp, max(0, (sbp - 120)) * 0.28)
    r += add("Total Cholesterol", chol, max(0, (chol - 180)) * 0.11)
    r += add("Low HDL", hdl, max(0, (50 - hdl)) * 0.35)
    r += add("BMI", bmi, (bmi - 25) * 0.9)
    r += add("Smoking", smoking, smoking * 14)
    r += add("Diabetes", diabetes, diabetes * 10)
    r += add("Male Sex", gender, gender * 5)
    return _pack("Heart Disease", r + 4, c, ctx=p)


def predict_ckd(p: dict) -> dict:
    age = _num(p, "age")
    creatinine = _num(p, "creatinine", 0.9)
    sbp = _num(p, "systolic_bp")
    diabetes = 1 if p.get("has_diabetes") else 0
    htn = 1 if p.get("has_hypertension") else 0

    c = []
    r = 0
    def add(feat, val, w):
        c.append({"feature": feat, "value": val, "weight": w})
        return w
    r += add("Creatinine", creatinine, max(0, (creatinine - 1.0)) * 45)
    r += add("Systolic BP", sbp, max(0, (sbp - 130)) * 0.35)
    r += add("Age", age, max(0, (age - 45)) * 0.5)
    r += add("Diabetes", diabetes, diabetes * 18)
    r += add("Hypertension", htn, htn * 12)
    return _pack("Chronic Kidney Disease", r + 3, c, ctx=p)


def predict_liver(p: dict) -> dict:
    alt = _num(p, "alt", 25)
    ast = _num(p, "ast", 25)
    bmi = _num(p, "bmi")
    alcohol = 1 if p.get("alcohol") else 0
    age = _num(p, "age")

    c = []
    r = 0
    def add(feat, val, w):
        c.append({"feature": feat, "value": val, "weight": w})
        return w
    r += add("ALT", alt, max(0, (alt - 40)) * 0.9)
    r += add("AST", ast, max(0, (ast - 40)) * 0.9)
    r += add("BMI", bmi, (bmi - 25) * 1.2)
    r += add("Alcohol Use", alcohol, alcohol * 18)
    r += add("Age", age, max(0, (age - 45)) * 0.25)
    return _pack("Liver Disease", r + 5, c, ctx=p)


def predict_hypertension(p: dict) -> dict:
    sbp = _num(p, "systolic_bp")
    dbp = _num(p, "diastolic_bp")
    bmi = _num(p, "bmi")
    age = _num(p, "age")
    smoking = 1 if p.get("smoking") else 0
    activity = _num(p, "physical_activity_hours")

    c = []
    r = 0
    def add(feat, val, w):
        c.append({"feature": feat, "value": val, "weight": w})
        return w
    r += add("Systolic BP", sbp, max(0, (sbp - 120)) * 0.65)
    r += add("Diastolic BP", dbp, max(0, (dbp - 80)) * 0.55)
    r += add("BMI", bmi, (bmi - 25) * 1.1)
    r += add("Age", age, max(0, (age - 35)) * 0.4)
    r += add("Smoking", smoking, smoking * 8)
    r += add("Physical Activity", activity, -min(activity, 10) * 0.9)
    return _pack("Hypertension", r + 6, c, ctx=p)


DISEASE_FNS = {
    "diabetes": predict_diabetes,
    "heart_disease": predict_heart_disease,
    "ckd": predict_ckd,
    "liver_disease": predict_liver,
    "hypertension": predict_hypertension,
}


def predict_all(patient_context: dict) -> list[dict]:
    return [fn(patient_context) for fn in DISEASE_FNS.values()]


def overall_risk_score(predictions: list[dict], patient_context: dict = None) -> dict:
    """Compute an aggregate patient health risk score (0-100) with Health State and Anomalies."""
    if not predictions:
        return {"score": 0, "severity": "Low", "health_state": "Stable", "risk_trend": "Stable", "anomalies": []}
    top = max(p["risk_percent"] for p in predictions)
    avg = sum(p["risk_percent"] for p in predictions) / len(predictions)
    score = round(0.65 * top + 0.35 * avg, 1)
    
    ctx = patient_context or {}
    anomalies = detect_anomalies(ctx)
    health_state = compute_health_state(score, anomalies)
    data_quality = compute_data_quality(ctx)
    
    if score >= 50:
        risk_trend = "Increasing"
    elif score <= 20:
        risk_trend = "Stable"
    else:
        risk_trend = "Moderate"

    return {
        "score": score,
        "severity": _severity(score),
        "health_state": health_state,
        "risk_trend": risk_trend,
        "data_quality": data_quality["label"],
        "anomalies": anomalies
    }


def lime_local_explanation(prediction: dict) -> list[dict]:
    """LIME-style local explanation: top 5 contributions with normalized weights."""
    top = prediction["contributions"][:5]
    return [
        {
            "feature": c["feature"],
            "value": c["value"],
            "weight": round(c["weight"], 2),
            "direction": c["direction"],
        }
        for c in top
    ]
