# FaithfulChain — Architecture

## Directory Structure

```
faithfulchain/
├── CLAUDE.md                    # Claude Code instructions (read first)
├── AGENTS.md                    # Agent guidance (Linux Foundation format)
├── project-requirements.md      # What we're building and why
├── tech-stack.md                # Libraries and tools
├── implementation-plan.md       # Step-by-step task checklist
├── progress.md                  # What's been completed (update as you go)
├── architecture.md              # This file
├── package.json                 # Root-level convenience scripts
├── tsconfig.json                # TypeScript base config (shared)
│
├── backend/                     # Python FastAPI service
│   ├── main.py                  # FastAPI app, route definitions, CORS
│   ├── models.py                # All Pydantic request/response models
│   ├── claude_service.py        # Single reusable async Claude API caller
│   ├── prompts.py               # REASONER_SYSTEM and AUDITOR_SYSTEM strings
│   ├── storage.py               # JSONL read/write and stats computation
│   ├── .env                     # ANTHROPIC_API_KEY (git-ignored)
│   ├── requirements.txt         # Python dependencies
│   └── tests/
│       ├── test_models.py
│       ├── test_claude_service.py
│       ├── test_storage.py
│       ├── test_routes.py
│       └── test_prompts.py
│
├── frontend/                    # React + Vite SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Root component, global state, 3-panel layout
│       ├── api.js               # Axios wrapper for all backend calls
│       ├── components/
│       │   ├── InputPanel.jsx   # Question input + domain selector
│       │   ├── ChainPanel.jsx   # Colour-coded reasoning chain
│       │   ├── VerdictPanel.jsx # One-at-a-time flagged step review
│       │   └── StatsPanel.jsx   # Session divergence statistics
│       └── utils/
│           ├── scoring.js       # Threshold logic, colour assignment
│           └── format.js        # Step text formatting helpers
│
└── data/
    ├── .gitkeep                 # Keeps directory in git
    └── divergence_log.jsonl     # Runtime log (git-ignored)
```

---

## Data Flow

```
User types question
      │
      ▼
InputPanel.jsx
      │  POST /api/reason
      ▼
backend/main.py → claude_service.py → Anthropic API (Reasoner)
      │  returns ReasonerResponse JSON
      ▼
InputPanel.jsx
      │  POST /api/audit  (sends steps)
      ▼
backend/main.py → claude_service.py → Anthropic API (Auditor)
      │  returns AuditResponse JSON
      ▼
App.jsx merges steps + audits → renders ChainPanel + VerdictPanel
      │
      ▼ (for each flagged step)
VerdictPanel.jsx
      │  POST /api/verdict
      ▼
backend/main.py → storage.py → data/divergence_log.jsonl
      │
      ▼ (after all verdicts)
StatsPanel.jsx
      │  GET /api/stats/{session_id}
      ▼
backend/main.py → storage.py → StatsResponse
```

---

## Key Architectural Decisions

### Decision 1: Two separate Claude calls, not one
**Why:** Separating Reasoner and Auditor with distinct system prompts prevents the model from self-justifying its own weak steps. A single call asking Claude to "reason and then audit yourself" would be circular.

### Decision 2: JSONL flat file, not a database
**Why:** Zero setup friction, portable, directly loadable with pandas for research analysis. The divergence log is research data, not application data — it should be in a format researchers naturally use.

### Decision 3: No LangChain
**Why:** The system makes exactly two Claude API calls per session. LangChain adds ~10MB of dependencies and significant abstraction overhead for what is essentially two `httpx.post()` calls.

### Decision 4: Pydantic models defined before routes
**Why:** Defining models first forces clear thinking about the data contract before writing any logic. All routes must use typed request/response models — no raw dicts in route handlers.

### Decision 5: JSON mode enforced via prompt, not API parameter
**Why:** The Anthropic API's `json` response format parameter strips explanatory text. We need the Auditor's `explanation` field to be human-readable prose inside the JSON, so we instruct via system prompt instead.

---

## Scoring Thresholds

These constants live in `backend/models.py` as module-level variables so they can be imported by both routes and tests:

```python
THRESHOLD_LOGICAL_VALIDITY   = 0.60
THRESHOLD_REFERENCE_INTEGRITY = 0.70
THRESHOLD_NECESSITY_SCORE    = 0.50
```

A step is `flagged: true` if ANY dimension is below its threshold.

Frontend colour mapping (in `frontend/src/utils/scoring.js`):

```
all scores > 0.70  →  green  (border-green-400)
any score  < 0.60  →  amber  (border-amber-400)
any score  < 0.45  →  red    (border-red-500)
```

---

## JSONL Record Schema

One record per human verdict:

```jsonc
{
  "session_id": "uuid-v4",
  "timestamp": "2026-06-29T14:32:00Z",
  "domain": "medical | legal | math | general",
  "question_length": 142,          // char count, for analysis
  "step_id": 3,
  "step_text": "...",
  "auditor_flagged": true,
  "auditor_scores": {
    "logical_validity": 0.42,
    "reference_integrity": 0.71,
    "necessity_score": 0.38,
    "explanation": "..."
  },
  "human_verdict": "agree | disagree | unsure",
  "diverged": true                 // true when human_verdict == "disagree"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key |
| `LOG_PATH` | No | `data/divergence_log.jsonl` | Path to divergence log |
| `BACKEND_URL` | No | `http://localhost:8000` | Frontend reads this via `import.meta.env` |
