# FaithfulChain — Progress Tracker

AI agents: read this file first to understand what has already been built before writing any new code.  
Update this file after completing each phase.

---

## Current Status

**Phase:** 3 — Polish (next up)  
**Last updated:** 2026-07-02  
**Working branch:** `main`

---

## Completed Work

- Phase 0: Project setup ✅
  - Python venv created, all backend deps installed
  - Vite React frontend scaffolded, axios + tailwindcss (v4) + d3 installed
  - `data/` directory created, `.gitignore` configured
- Phase 1: Backend core ✅
  - `backend/models.py` — all 7 Pydantic models + threshold constants
  - `backend/claude_service.py` — async `call_claude()` with error handling
  - `backend/prompts.py` — REASONER_SYSTEM + AUDITOR_SYSTEM with one-shot examples
  - `backend/storage.py` — `append_verdict`, `load_all_verdicts`, `compute_stats`
  - `backend/main.py` — 5 routes + CORS middleware
  - 31 pytest tests passing (`pytest --tb=short`)
- Phase 2: Frontend core ✅
  - `frontend/src/App.jsx` — 3-panel layout, global state, loading/error states
  - `frontend/src/api.js` — Axios wrapper for all 5 endpoints
  - `frontend/src/components/InputPanel.jsx` — textarea, domain buttons, example loader
  - `frontend/src/components/ChainPanel.jsx` — colour-coded steps, expandable audit details
  - `frontend/src/components/VerdictPanel.jsx` — one-at-a-time flagged step review
  - `frontend/src/components/StatsPanel.jsx` — divergence stats with reset
  - `frontend/src/utils/scoring.js` — threshold logic, colour assignment
  - `frontend/src/utils/format.js` — text helpers
  - Frontend build: `npm run build` passes cleanly
- Phase 4: Testing ✅ (done alongside Phase 1)
  - 31 tests, 0 failures

---

## In Progress

Phase 3 — Polish (responsive layout, keyboard a11y, empty states, favicon)

---

## Known Issues / Blockers

- Tailwind v4 is installed (not v3). Uses `@import "tailwindcss"` + `@tailwindcss/vite` plugin instead of `tailwind.config.js`. No `postcss.config.js` needed.
- `backend/.env` has placeholder API key — user must fill in real `ANTHROPIC_API_KEY`.

---

## Session Log

| Date | What was done | Files changed |
|---|---|---|
| 2026-06-29 | Project scaffolded, memory bank files created | All `.md` files, `package.json`, `tsconfig.json`, `CLAUDE.md` |
| 2026-07-02 | Phase 0–2 + Phase 4 complete. Backend + frontend built from scratch | All backend Python files, all frontend src files, tests |
