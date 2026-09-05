# Sentinel Wellness — Personnel Welfare Early-Warning System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.2+-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Sentinel Wellness** is a privacy-respecting, interpretable early-warning welfare risk detection system designed for uniformed personnel (Army, CAPFs, Police, and Emergency Services). It identifies rising stress and workload burnout patterns from work data and voluntary wellness check-ins, routing flagging cases to human welfare officers for confidential, non-disciplinary support.

---

## 🌟 Key Features

- **Interpretable Risk Scoring (0–100)**: Standardized Logistic Regression model mapping work metrics and voluntary check-ins to Low, Moderate, High, and Critical welfare risk bands.
- **Per-Person Linear Explainability**: Linear feature contribution breakdowns ($c_j = w_j \cdot z_{ij}$) explaining *why* a risk score changed (e.g. "+18 pts from Night Shifts", "+14 pts from Leave Deficit").
- **Multi-Week Risk Trajectory**: 6-week trend tracking to detect *rising* risk early rather than relying solely on static snapshots.
- **Transparent Keyword Notes Triage Assistant**: Analyzes free-text Welfare Officer observations, extracts stress categories, cross-references against automated risk factors (Corroborated vs New Signal), and assigns human conversation priority (*Routine*, *Soon*, *Urgent*).
- **Specialization Doctor Referral & Slot Booking**: Smart doctor matching based on primary risk factors with available appointment slot selection and mandatory voluntary consent disclaimer.
- **Consultation Outcome Logging & Audit Loop**: Captures consultation outcomes (*Resolved*, *Needs Follow-up*, *False Alarm*) for periodic model recalibration and maintains an immutable audit trail.
- **Strict Server-Side RBAC Privacy**: Commanding Officers receive **unit-level aggregate metrics only** (risk band percentages, structural workload disparity index). Server-side endpoints strictly strip individual names, service IDs, and individual scores.

---

## 🏗️ Architecture & Technology Stack

```
[Personnel Work Data + Voluntary Check-ins]
                    │
                    ▼
          [Feature Engineering]
  (Median imputation for missing voluntary data)
                    │
                    ▼
     [Standardized Logistic Regression]
  (Calibrated 0-100 Risk Score & Risk Bands)
                    │
                    ▼
     [Linear Explainability Layer]
 (Ranked elevating & mitigating factor weights)
                    │
                    ▼
   [FastAPI REST API & Role-Based Security]
      │             │             │
      ▼             ▼             ▼
[Personnel Portal] [Welfare Officer] [Commander View]
 (Self-Only Data) (Caseload Triage)  (Unit Aggregates Only)
```

- **Backend**: Python 3.13, FastAPI, scikit-learn, Pandas, NumPy, Pydantic, Uvicorn, Pytest
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 1. Clone Repository
```bash
git clone https://github.com/khushi069/SentinelWell-AI.git
cd SentinelWell-AI
```

### 2. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Launch Application
Run the root launcher script to start both backend and frontend dev servers concurrently:
```bash
python run_app.py
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API & Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 Running Tests

To run the automated backend test suite (testing ML model fitting, explainability, notes triage, doctor booking, and strict server-side RBAC privacy):

```bash
cd backend
python -m pytest
```

To run frontend production build verification:

```bash
cd frontend
npm run build
```

---

## 🌐 One-Click Cloud Deployment

### Deploying on Render

This repository includes a pre-configured `render.yaml` Blueprint file.

1. Push code to your GitHub repository (`https://github.com/khushi069/SentinelWell-AI`).
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select your **SentinelWell-AI** repository.
5. Render will automatically detect `render.yaml` and provision:
   - **`sentinelwell-backend`**: FastAPI Python Web Service
   - **`sentinelwell-frontend`**: Static Site for React Vite Frontend

### Alternative: Single Unified Service Deployment
Because FastAPI in `backend/app/main.py` is configured to automatically serve `frontend/dist` when built, you can also deploy the entire full-stack application as a single Python Web Service on Render / Railway / Koyeb / Hugging Face Spaces:

- **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 🔒 Privacy & Data Ethics Notice

Sentinel Wellness is explicitly designed **NOT** to be a diagnostic or disciplinary tool:
- Does **not** diagnose medical or psychological conditions.
- Does **not** feed into performance appraisals, promotions, or disciplinary records.
- Voluntary check-in data is completely optional and missingness is imputed neutrally without penalty.
- Individual identities are server-side blocked from Commanding Officer endpoints.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
