# Elliot-AI

AI coding assistant for engineering teams at Elliot Systems.

## Monorepo layout

```
backend/      FastAPI + LangGraph + pgvector (Python 3.11+)
terminal/     Developer terminal UI (React + Vite, dark theme)
dashboard/    Admin dashboard UI (React + Vite, light theme)
onboarding/   New-tenant signup flow (React 19 + Vite 8, JSX)
cli/          Local CLI client — `npm i -g @elliot-ai/cli` (Node 20 + Ink TUI)
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

### Onboarding UI
```bash
cd onboarding
npm install
npm run dev
```
Opens at http://localhost:5175

### CLI
```bash
cd cli
npm install
npm run build
node bin/elliot.js status    # smoke test
npm link                     # makes `elliot` global

elliot login
elliot ask "How does auth work?"
elliot                       # interactive Ink REPL
```
See [cli/README.md](cli/README.md) for the full command list.

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
