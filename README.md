# Medic

An AI-assisted radiology workspace: patients, imaging studies, a DICOM viewer (OHIF), radiology report authoring with draft → finalize → reopen, and an AI assistant that drafts findings for radiologist review.

**Clinical safety:** AI output is always a draft. It is only copied into a report when the radiologist clicks **Insert**, and reports are only finalized by an explicit action. Demo and research data only.

## Architecture

| Part | Where | Port |
|---|---|---|
| Frontend (React 19, TypeScript, Vite, Tailwind) | `frontend/` | 5173 |
| Backend (FastAPI, SQLAlchemy, Alembic) | `backend/app/main.py` (the only entry point) | 8001 |
| Database (PostgreSQL, database `medic`) | `database/` (models, session, seed), `alembic/` | 5432 |
| Orthanc (DICOM storage, teammate's machine over Tailscale) | `ORTHANC_URL`, default `http://100.97.193.98:8042` | 8042 |
| OHIF viewer (teammate's machine) served locally by `scripts/ohif-relay.py` | `http://localhost:3000` | 3000 |
| AI provider (Claude Opus 5.5, swappable) | `backend/app/ai/` | — |

The browser talks only to `localhost`. The OHIF relay exists because browsers on this PC can't open the Tailscale address directly, while normal programs can. OHIF reads images from the backend's `/dicom-web` proxy, which holds the Orthanc credentials server-side.

## Quick start (Windows)

```powershell
cd C:\Users\abhij\Desktop\medic
powershell -ExecutionPolicy Bypass -File .\scripts\start-medic.ps1
```

It starts the OHIF relay and the frontend in the background (logs in `logs/`) and the backend in the current window. It asks, as hidden input, for:

- the PostgreSQL password
- the Orthanc password
- the Anthropic API key (press Enter to skip; AI features then show "not configured")

Then open http://localhost:5173.

## Environment variables

| Name | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | backend, Alembic | required; set by the start script |
| `ORTHANC_URL`, `ORTHANC_USERNAME`, `ORTHANC_PASSWORD` | backend | Orthanc access |
| `ANTHROPIC_API_KEY` | backend | enables AI analysis and chat |
| `CORS_EXTRA_ORIGINS` | backend | extra allowed origins (default: OHIF on port 3000) |
| `OHIF_UPSTREAM`, `OHIF_RELAY_PORT` | `scripts/ohif-relay.py` | default `http://100.97.193.98:3000`, `3000` |
| `VITE_OHIF_URL` | frontend | default `http://localhost:3000` (see `frontend/.env.example`) |

Never commit secrets. `.env` files are ignored by git.

## Setup from scratch

```powershell
# Backend dependencies
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt

# Database schema (with DATABASE_URL set)
backend\.venv\Scripts\python.exe -m alembic upgrade head
backend\.venv\Scripts\python.exe -m database.seed   # demo patients and studies

# Frontend dependencies
cd frontend; npm install
```

## Checks

```powershell
backend\.venv\Scripts\python.exe -m pytest tests -q      # backend tests
cd frontend; npm run build; npm run lint                 # type-check, build, lint
backend\.venv\Scripts\python.exe scripts\db-audit.py     # read-only database audit
```

## Workflows

- **Import studies:** Studies → Import from Orthanc (or "Upload Study" in the top bar) → pick the patient → confirm.
- **Review:** Workspace shows the study in OHIF next to the report editor.
- **Report:** Save Draft → Finalize; reopen from the report page. A study keeps one open draft.
- **AI:** Workspace → Analyze for a draft of findings and impression from representative slices; Insert copies it into the editor for review. The assistant chat answers questions about the open study.

## Known limits

- No user accounts or sign-in yet; everything runs as one local demo user.
- The viewer and imports need the teammate's laptop online on Tailscale.
- Settings are stored per browser.
