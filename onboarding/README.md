# Elliot-AI Onboarding

The new-tenant signup flow (PDF page 3: Identity → Workspace → SDLC Profile →
Connect Sources → Index Knowledge → Launch). Once a developer finishes this
flow they're handed off to the [terminal](../terminal) app.

## Stack
- React 19 + Vite 8 (JSX, no TypeScript)
- Standalone Vite workspace; runs on `http://localhost:5175`

## Run locally
```bash
cd onboarding
npm install
npm run dev
```

## Notes for reviewers
- The 6-step nav (`OnboardingSidebar`) is in place; page contents are still
  placeholder. Per-step forms come in follow-up PRs.
- Final "Launch" step should redirect to the terminal app and stash the JWT
  in `localStorage` — same contract the terminal's `LaunchScreen` reads.
- Backend CORS must include `http://localhost:5175` for dev. Add to the
  `CORS_ORIGINS` env var when wiring real API calls.
