# HealthTwin.AI

A Hybrid Multimodal Explainable AI + Digital Twin Framework for Intelligent Patient Triage, Disease Progression Prediction & Clinical Decision Support.

- **Backend**: FastAPI + MongoDB (Motor)
- **Frontend**: React 19 + Tailwind + shadcn/ui + Recharts + Cornerstone (DICOM)
- **AI**: rule-based risk engine (5 diseases) + Claude Sonnet 4.5 clinical narrative (via Emergent LLM key)
- **Storage**: Emergent object storage (medical images & reports)
- **Reporting**: ReportLab PDF export

---

## 1. Fix the error you hit

```
ModuleNotFoundError: No module named 'jwt'
```

You launched `uvicorn` without installing Python dependencies. Two ways to fix:

### Option A — one command via Docker (recommended)

```bash
cp .env.example .env          # then paste your EMERGENT_LLM_KEY
make up                        # starts MongoDB + backend + frontend
```

- Backend: <http://localhost:8001/api>
- Frontend: <http://localhost:3000>
- Admin: `admin@healthtwin.ai` / `Admin@123`

Other useful targets:
```bash
make logs        # tail all logs
make backend     # tail backend only
make down        # stop everything
make clean       # stop and wipe MongoDB data
make rebuild     # rebuild images from scratch
make smoke       # curl-based sanity check
```

### Option B — local Python venv (what you were doing)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
# The Emergent LLM SDK ships from a private index:
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

Or use the Makefile shortcut:
```bash
make install     # sets up backend venv + frontend node_modules
make run-local   # runs both backend and frontend
```

> ⚠️ Use **Python 3.11 or 3.12**. Python 3.14 breaks a few pinned wheels (bcrypt/motor).
> If you're on 3.14, install `pyenv install 3.12.5 && pyenv local 3.12.5` first.

---

## 2. Prerequisites

| Tool     | Version |
|----------|---------|
| Python   | 3.11 or 3.12 |
| Node.js  | ≥ 18 |
| Yarn     | ≥ 1.22 |
| MongoDB  | ≥ 6 (local or Atlas) |

---

## 3. Backend setup

Create `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="healthtwin"
CORS_ORIGINS="http://localhost:3000"
EMERGENT_LLM_KEY=sk-emergent-XXXXXXXXXXXXXXXXXX
JWT_SECRET=change-me-to-a-long-random-string
APP_NAME=healthtwin
```

- `EMERGENT_LLM_KEY` — get from Emergent Profile → Universal Key. It enables Claude Sonnet 4.5 narratives AND the object storage used for image / report uploads.
- If you skip the key the app still runs; Claude falls back to a template summary, but **image/report uploads will fail** (they use Emergent object storage).

Start the API:

```bash
cd backend
source .venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

A default admin is seeded on first boot: `admin@healthtwin.ai` / `Admin@123`.

---

## 4. Frontend setup

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
```

Install & run:

```bash
cd frontend
yarn install
yarn start
```

App: <http://localhost:3000>

---

## 5. MongoDB

Local (Homebrew):

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

Or use MongoDB Atlas — set `MONGO_URL` to the Atlas connection string.

---

## 6. Test credentials

| Role    | Email                       | Password    |
|---------|-----------------------------|-------------|
| Admin   | `admin@healthtwin.ai`       | `Admin@123` |
| Patient | register via UI or `/api/auth/register` | your choice |
| Doctor  | register via UI (role=doctor) | your choice |

---

## 7. Features

- Patient / Doctor / Admin portals with JWT + RBAC
- Digital Twin editor (profile / vitals / labs)
- Rule-based risk prediction: Diabetes, Heart Disease, CKD, Liver Disease, Hypertension
- Explainable AI: SHAP-style feature attribution + LIME-style local explanation
- Risk stratification (Low / Moderate / High / Critical) + aggregate patient risk score
- Clinical narrative via Claude Sonnet 4.5
- Medical image upload (X-Ray, CT, MRI, Ultrasound) with in-browser DICOM viewer
- Medical report/document upload (PDF, DOC, CSV, TXT)
- PDF risk-report export (ReportLab)
- Password reset flow + doctor-created patient invites
- Admin: user management, AI accuracy monitoring, audit log

---

## 8. Project layout

```
backend/
  server.py              # FastAPI app, all /api routes
  auth.py                # JWT hash / verify / require_roles
  models.py              # Pydantic models
  risk_engine.py         # rule-based scoring + SHAP/LIME
  llm_service.py         # Claude Sonnet 4.5 narrative
  storage_service.py     # Emergent object storage wrapper
  pdf_report.py          # ReportLab PDF export
  requirements.txt
  .env

frontend/
  src/
    App.js               # router
    lib/api.js           # axios client
    lib/auth.js          # AuthProvider
    pages/               # Landing / Login / Register / ResetPassword / Patient / Doctor / Admin
    components/app/      # DigitalTwin, RiskPanel, XAIPanel, ImageViewer, MedicalReports, ...
  .env
  package.json
```

---

## 9. Common gotchas

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'jwt'` | `pip install -r requirements.txt` inside the venv |
| `ModuleNotFoundError: No module named 'emergentintegrations'` | `pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/` |
| bcrypt/motor build fails on Python 3.14 | Switch to Python 3.12 |
| `Storage not initialized` on upload | Missing / invalid `EMERGENT_LLM_KEY` |
| Frontend calls fail with 404 | Ensure `REACT_APP_BACKEND_URL` matches your uvicorn address and that every backend route starts with `/api` |
| CORS blocked | Add your frontend origin to `CORS_ORIGINS` in `backend/.env` |
