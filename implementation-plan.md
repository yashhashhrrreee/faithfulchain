# FaithfulChain — Implementation Plan

This is the canonical task checklist. Work through it in order.  
Each item is small enough to complete and test before moving on.  
Mark items `[x]` as you complete them.

---

## Phase 0 — Project Setup

- [x] Create repo: `faithfulchain` on GitHub
- [x] Init Python backend: `mkdir backend && cd backend && python -m venv venv`
- [x] Install backend deps: `pip install fastapi uvicorn httpx pydantic python-dotenv pytest pytest-asyncio`
- [x] Create `backend/.env` with `ANTHROPIC_API_KEY`
- [x] Init frontend: `cd .. && npm create vite@latest frontend -- --template react`
- [x] Install frontend deps: `npm install axios tailwindcss d3`
- [x] Init Tailwind: configured via `@tailwindcss/vite` plugin (v4 style)
- [x] Verify both dev servers run: backend on `:8000`, frontend on `:5173`
- [x] Create `data/` directory and `data/.gitkeep`; add `data/divergence_log.jsonl` to `.gitignore`

---

## Phase 1 — Backend Core

### 1.1 Pydantic Models (`backend/models.py`)

- [x] Define `QuestionRequest`: `question: str`, `domain: Literal["medical","legal","math","general"]`
- [x] Define `ReasoningStep`: `id: int`, `text: str`, `cites: list[int]`, `is_conclusion: bool`
- [x] Define `ReasonerResponse`: `steps: list[ReasoningStep]`, `answer: str`, `session_id: str`
- [x] Define `AuditScore`: `step_id: int`, `logical_validity: float`, `reference_integrity: float`, `necessity_score: float`, `explanation: str`, `flagged: bool`
- [x] Define `AuditResponse`: `session_id: str`, `audits: list[AuditScore]`
- [x] Define `VerdictRequest`: `session_id: str`, `step_id: int`, `auditor_flagged: bool`, `human_verdict: Literal["agree","disagree","unsure"]`, `domain: str`
- [x] Define `StatsResponse`: fields for divergence_rate, total_flagged, human_disagreements, worst_dimension

### 1.2 Claude Service (`backend/claude_service.py`)

- [x] Write `async call_claude(system: str, user: str) -> dict` — single reusable async function
- [x] Load `ANTHROPIC_API_KEY` from env inside the function
- [x] Set model to `claude-sonnet-4-6`, `max_tokens` to `1500`
- [x] Parse response: extract `content[0].text`, attempt `json.loads()`
- [x] If JSON parse fails, raise `ValueError` with raw text for debugging
- [x] Write unit test: mock httpx, assert correct headers and body are sent

### 1.3 Reasoner Prompt (`backend/prompts.py`)

- [x] Write `REASONER_SYSTEM` prompt:
  - Instructs numbered, atomic steps
  - Each step must cite prior steps as `[Step N]`
  - Must flag one step as `is_conclusion: true`
  - Must return **only** valid JSON matching `ReasonerResponse` schema
  - Include one-shot example in the prompt
- [x] Write unit test: pass a simple math question, assert output has `steps` and `answer` keys

### 1.4 Auditor Prompt (`backend/prompts.py`)

- [x] Write `AUDITOR_SYSTEM` prompt:
  - Receives the full steps JSON
  - Scores each step on `logical_validity`, `reference_integrity`, `necessity_score` (all 0.0–1.0)
  - `flagged: true` if ANY dimension < threshold (0.6 / 0.7 / 0.5 respectively)
  - Must return **only** valid JSON matching `AuditResponse` schema
  - Include scoring rubric and one-shot example
- [x] Write unit test: pass known good and bad reasoning chains, assert flagged counts

### 1.5 Storage (`backend/storage.py`)

- [x] Write `append_verdict(verdict: VerdictRequest) -> None` — appends one JSONL record
- [x] Write `load_all_verdicts() -> list[dict]` — reads all JSONL records
- [x] Write `compute_stats(session_id: str) -> StatsResponse` — filters by session, computes metrics
- [x] Write unit tests for all three functions with a temp file

### 1.6 FastAPI Routes (`backend/main.py`)

- [x] `POST /api/reason` — validates request, calls Reasoner, returns `ReasonerResponse`
- [x] `POST /api/audit` — validates request (takes steps JSON), calls Auditor, returns `AuditResponse`
- [x] `POST /api/verdict` — validates request, calls `append_verdict`, returns `{"ok": true}`
- [x] `GET /api/stats/{session_id}` — calls `compute_stats`, returns `StatsResponse`
- [x] `GET /api/log` — returns full log as JSON array (for research export)
- [x] Add CORS middleware: allow `http://localhost:5173`
- [x] Write integration tests for all 5 routes using FastAPI test client

---

## Phase 2 — Frontend Core

### 2.1 App Shell (`frontend/src/App.jsx`)

- [x] Three-panel layout: `InputPanel` | `ChainPanel` | `VerdictPanel`
- [x] Global state: `question`, `domain`, `steps`, `audits`, `currentFlagIndex`, `sessionId`, `verdicts`
- [x] Loading states: spinner during Reasoner call, spinner during Auditor call
- [x] Error states: toast notification on API failure

### 2.2 Input Panel (`frontend/src/components/InputPanel.jsx`)

- [x] Textarea for question (min 3 rows, max 500 chars with counter)
- [x] Domain selector: 4 buttons (Medical / Legal / Math / General), one active at a time
- [x] "Analyse" button — disabled while loading or question is empty
- [x] On submit: `POST /api/reason` then `POST /api/audit`, store results in state
- [x] Example question button: loads a pre-written example per domain

### 2.3 Chain Panel (`frontend/src/components/ChainPanel.jsx`)

- [x] Render list of all steps
- [x] Each step card shows: step number, text, cited steps as tags
- [x] Border colour by highest-risk audit score: green (all > 0.7) / amber (any < 0.6) / red (any < 0.45)
- [x] Click to expand: shows Auditor explanation and 3 score bars
- [x] Flagged steps pulse with a subtle animation until reviewed
- [x] Final answer shown at bottom in a distinct callout box

### 2.4 Verdict Panel (`frontend/src/components/VerdictPanel.jsx`)

- [x] Shows one flagged step at a time (the current `currentFlagIndex`)
- [x] Displays: step text, Auditor explanation, 3 score bars
- [x] Three buttons: "Agree — this step is weak" / "Disagree — step is valid" / "Unsure"
- [x] On verdict: `POST /api/verdict`, advance `currentFlagIndex`
- [x] Progress indicator: "Step 2 of 4 flagged steps"
- [x] When all flags reviewed: show `StatsPanel`

### 2.5 Stats Panel (`frontend/src/components/StatsPanel.jsx`)

- [x] Fetch `GET /api/stats/{sessionId}` on mount
- [x] Show: Divergence Rate (large number), Total Flagged, Human Disagreements
- [x] Worst dimension highlighted in amber
- [x] "Start new question" button resets all state

---

## Phase 3 — Polish

- [ ] Tailwind responsive layout — min-width 1024px for 3-column, stack on smaller
- [ ] Keyboard accessibility: Enter to submit, Tab through verdict buttons
- [ ] Empty state for Chain Panel (before first question)
- [ ] Loading skeleton cards in Chain Panel during Auditor call
- [ ] `favicon.ico` — simple chain link icon

---

## Phase 4 — Testing

- [x] `backend/tests/test_models.py` — Pydantic validation
- [x] `backend/tests/test_claude_service.py` — mocked Claude calls
- [x] `backend/tests/test_storage.py` — JSONL read/write
- [x] `backend/tests/test_routes.py` — all 5 API routes (mocked Claude)
- [x] `backend/tests/test_prompts.py` — prompt output parsing
- [x] Total: minimum 15 pytest tests, all passing (31 passing)
- [x] Run `pytest --tb=short` and confirm 0 failures

---

## Phase 5 — Research README

- [ ] Run 15 test questions: 5 Math, 5 Medical, 5 General
- [ ] Export divergence log, load into pandas, compute:
  - Overall divergence rate
  - Per-domain divergence rate
  - Most-flagged dimension
  - Does step position (early vs late) correlate with flags?
- [ ] Write `RESEARCH.md` with findings (3–4 paragraphs + 2 tables)
- [ ] Add live demo URL to README
- [ ] Push to GitHub with clean commit history

---

## Done Definition

The project is complete when:
1. All Phase 0–3 checkboxes are marked `[x]`
2. `pytest` passes with ≥ 15 tests
3. A full session runs end-to-end in the browser without errors
4. `RESEARCH.md` exists with real findings from 15 test questions
5. Repo is public on GitHub with a demo link in the README
