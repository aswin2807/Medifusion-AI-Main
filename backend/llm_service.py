"""Claude Sonnet 4.5 clinical interpretation for risk explanations.

Wraps emergentintegrations to produce a short human-readable clinical narrative
per patient risk assessment. Falls back to a template if LLM call fails.
"""
import os
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
SYSTEM_PROMPT = (
    "You are a clinical decision-support assistant. Given rule-based risk scores "
    "and top contributing factors for a patient, write a concise, medically-worded "
    "clinical interpretation (3-5 sentences) with actionable next steps. "
    "Do NOT give definitive diagnosis. Emphasize modifiable factors. Reference "
    "the top contributors by name. Keep tone objective and non-alarmist."
)


def _fallback(patient_summary: dict, predictions: list[dict]) -> str:
    if not predictions:
        return "Insufficient clinical data to construct a profile interpretation."
        
    sorted_preds = sorted(predictions, key=lambda p: p["risk_percent"], reverse=True)
    top_pred = sorted_preds[0]
    
    age = patient_summary.get("age", 35)
    gender = patient_summary.get("gender", "unknown")
    bmi = patient_summary.get("bmi", 24.0)
    
    paragraphs = []
    
    # Paragraph 1: Patient overview and primary risk findings
    narrative_1 = (
        f"Clinical evaluation of the patient's digital twin profile (Age: {age}, Gender: {gender}, BMI: {bmi}) "
        f"reveals that the primary risk concern is {top_pred['disease']} with a computed risk factor of "
        f"{top_pred['risk_percent']}% (categorized as {top_pred['severity']} severity)."
    )
    
    if len(sorted_preds) > 1 and sorted_preds[1]["risk_percent"] > 25:
        narrative_1 += (
            f" Secondary risk elevation is noted for {sorted_preds[1]['disease']} at "
            f"{sorted_preds[1]['risk_percent']}% ({sorted_preds[1]['severity']} severity)."
        )
    paragraphs.append(narrative_1)
    
    # Paragraph 2: Top contributing factors and clinical markers
    contrib_details = []
    for pred in sorted_preds[:2]:
        top_factors = [c for c in pred["contributions"] if abs(c["weight"]) > 1.0][:3]
        if top_factors:
            factor_strs = [f"{c['feature']} ({c['value']})" for c in top_factors]
            contrib_details.append(
                f"For {pred['disease']}, the key drivers are " + ", ".join(factor_strs) + "."
            )
            
    if contrib_details:
        paragraphs.append(" ".join(contrib_details))
        
    # Paragraph 3: Specific clinical recommendations based on actual values
    recommendations = []
    hba1c = patient_summary.get("hba1c")
    if hba1c and float(hba1c) >= 5.7:
        recommendations.append("Initiate glycemic management protocol and dietary carbohydrate restriction.")
    sbp = patient_summary.get("systolic_bp")
    dbp = patient_summary.get("diastolic_bp")
    if (sbp and float(sbp) >= 130) or (dbp and float(dbp) >= 80):
        recommendations.append("Recommend regular blood pressure monitoring and cardiovascular health support.")
    if bmi and float(bmi) >= 25.0:
        recommendations.append("Incorporate weight management counseling and physical activity guidelines.")
    alt = patient_summary.get("alt")
    ast = patient_summary.get("ast")
    if (alt and float(alt) >= 40) or (ast and float(ast) >= 40):
        recommendations.append("Consider hepatic panel follow-up and monitoring of metabolic indicators.")
        
    if not recommendations:
        recommendations.append("Maintain current preventive healthcare parameters and annual routine screenings.")
        
    paragraphs.append(" ".join(recommendations))
    
    return "\n\n".join(paragraphs)


async def generate_clinical_interpretation(patient_summary: dict, predictions: list[dict]) -> str:
    if not EMERGENT_KEY:
        return _fallback(patient_summary, predictions)
    try:
        session_id = f"clinical-{patient_summary.get('id', 'anon')}"
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
 
        top = sorted(predictions, key=lambda p: p["risk_percent"], reverse=True)[:3]
        blocks = []
        for p in top:
            factors = ", ".join(
                f"{c['feature']}={c['value']} ({c['direction']})"
                for c in p["contributions"][:4]
            )
            blocks.append(
                f"- {p['disease']}: risk {p['risk_percent']}% ({p['severity']}); factors: {factors}"
            )
        prompt = (
            f"Patient: age={patient_summary.get('age')}, gender={patient_summary.get('gender')}, "
            f"BMI={patient_summary.get('bmi')}.\n"
            f"Top risks:\n" + "\n".join(blocks) +
            "\n\nWrite the clinical interpretation now."
        )
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        return response.strip() if isinstance(response, str) else str(response).strip()
    except Exception as e:
        logger.error(f"LLM interpretation failed: {e}")
        return _fallback(patient_summary, predictions)
