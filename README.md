# Elliot-AI

AI coding assistant for engineering teams at Elliot Systems.

## Monorepo layout

```
backend/      FastAPI + LangGraph + pgvector (Python 3.11+)
terminal/     Developer terminal UI (React + Vite, dark theme)
dashboard/    Admin dashboard UI (React + Vite, light theme)
```

## Quick start

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload
```
Health check: http://localhost:8000/health

### Terminal UI
```bash
cd terminal
npm install
npm run dev
```
Opens at http://localhost:5173

### Dashboard UI
```bash
cd dashboard
npm install
npm run dev
```
Opens at http://localhost:5174

## Project tracking

All work is tracked in ClickUp: `Elliot-AI v1.0` List.
45 tasks across 10 phases. See PDF spec (`Elliot-AI-Guide`) for full architecture.

## Team

- Khushi Shimpi 
- Shrushti Kadam
- Astika Mhaisgawali


## Branch + PR conventions

- Branches: `<phase>/<task-num>-<slug>` e.g. `auth/04-magic-link`
- PR title = ClickUp task name. PR body links the ClickUp task URL.
- Status: `to do` -> `in progress` (when you branch) -> `complete` (on merge).
