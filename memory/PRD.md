# HealthTwin.AI — PRD & Build Log

## Original Problem Statement
Semester 1 of "A Hybrid Multimodal Explainable AI and Digital Twin Framework for Intelligent Patient Triage, Disease Progression Prediction, and Clinical Decision Support."

Build a secure healthcare platform with three portals (Patient, Doctor, Admin), a Patient Digital Twin fed by multimodal healthcare data (EHR, labs, vitals, imaging, lifestyle), disease risk prediction, explainable AI (SHAP + LIME), risk stratification and a clinical decision support dashboard.

## User Choices (from ask_human)
- Risk engine: **Hybrid** — Rule-based clinical scoring + **Claude Sonnet 4.5** (via Emergent LLM key) for the narrative interpretation.
- XAI: Simulated SHAP-style feature importance + LIME-style local explanations derived from rule contributions.
- Auth: JWT with three roles (patient, doctor, admin).
- Object storage: Enabled (Emergent object storage) for medical images.
- Scope: Full breadth across all Semester-1 modules.

## Personas
- **Patient**: manages own twin, uploads reports/images, sees risk & timeline.
- **Doctor**: searches patients, opens their twin, reviews SHAP/LIME, writes notes.
- **Admin**: manages users, monitors AI, reviews audit log.

## Core Requirements (Semester 1)
1. Authentication & RBAC (JWT + bcrypt).
2. Digital Twin with profile, vitals, labs.
3. Multimodal ingestion (structured fields + medical image upload).
4. Rule-based disease risk prediction: Diabetes, Heart Disease, CKD, Liver Disease, Hypertension.
5. Explainable AI: SHAP-style bar chart of feature contributions + LIME-style local explanation.
6. Risk stratification (Low / Moderate / High / Critical).
7. Aggregate patient health risk score.
8. Clinical Decision Support Dashboard (per role).
9. Audit logging.

## What's been implemented (2026-02, iteration 1)
- Backend `server.py` with `/api` prefix, JWT auth (`auth.py`), rule-based risk engine (`risk_engine.py`), Claude Sonnet 4.5 clinical narrative (`llm_service.py`), Emergent object storage (`storage_service.py`).
- Endpoints: `/auth/*`, `/twin`, `/risk`, `/xai/{disease}`, `/interpretation`, `/timeline`, `/vitals/history`, `/images/*`, `/patients`, `/doctor/notes`, `/admin/*`, `/dashboard/patient`.
- MongoDB collections: users, digital_twins, vitals_history, timeline, medical_images, risk_snapshots, doctor_notes, audit_logs.
- Default admin seeded at startup (`admin@healthtwin.ai` / `Admin@123`).
- Frontend: Landing, Login, Register, PatientDashboard, DoctorDashboard, AdminDashboard.
- Components: AppShell, RiskBadge, DigitalTwin editor, RiskPanel (radial + cards), XAIPanel (SHAP bar + LIME list), AlertsPanel, VitalsTrend (line chart), Timeline, UploadImage.
- Design: Chivo/Manrope/IBM Plex Mono, stone/emerald clinical palette, semantic risk colors.

## P1 backlog
- Doctor dashboard: quick-open patient from alerts.
- Patient image download preview (blob fetch).
- Password reset + admin-created accounts flow.
- Export/PDF of risk report.

## P2 backlog (Semester 2 scope)
- Disease progression simulation (temporal model).
- Real-time IoT / wearable integration.
- Reinforcement / federated learning.
- Personalized treatment planning.

## Next Action Items
- User-facing acceptance testing.
- Optional: seed a doctor account and demo patients for a richer demo.
