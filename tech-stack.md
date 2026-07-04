# FaithfulChain — Tech Stack

## Frontend

| Tool | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Tailwind CSS | 3.x | Utility-first styling — no custom CSS files |
| D3.js | 7.x | Step dependency graph visualisation |
| Axios | 1.x | HTTP client for API calls |
| Vite | 5.x | Dev server and bundler |

**No** Redux, no React Query for MVP — plain `useState` + `useEffect` is sufficient.

---

## Backend

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.111+ | REST API framework (async-native) |
| Uvicorn | 0.29+ | ASGI server |
| Pydantic | 2.x | Request/response validation |
| httpx | 0.27+ | Async HTTP client for Claude API calls |
| python-dotenv | 1.x | Load `.env` for API key |

---

## LLM

| Tool | Detail |
|---|---|
| Model | `claude-sonnet-4-6` for both Reasoner and Auditor calls |
| API | Anthropic Messages API (`https://api.anthropic.com/v1/messages`) |
| Auth | `ANTHROPIC_API_KEY` environment variable |
| Response format | JSON mode enforced via system prompt instruction |

**Important:** Never hardcode the API key. Always read from environment.

---

## Storage

| Tool | Detail |
|---|---|
| Format | JSONL (one JSON object per line) |
| File | `data/divergence_log.jsonl` |
| Backup | Git-ignored; not committed to repo |

No database for MVP. JSONL is portable, zero-dependency, and trivially importable into pandas for research analysis.

---

## Testing

| Tool | Scope |
|---|---|
| `pytest` | Backend unit and integration tests |
| `pytest-asyncio` | Async FastAPI route testing |
| `httpx` (test client) | FastAPI test client |
| `Jest` | Frontend component tests (stretch) |

Minimum 15 backend tests required before shipping.

---

## Deployment (Demo)

Primary: **Streamlit Cloud** (fallback if React build is not ready in time)  
Preferred: **Vercel** (frontend) + **Railway** (FastAPI backend)

The demo URL goes in the README and fellowship application.

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
BACKEND_URL=http://localhost:8000   # frontend reads this
LOG_PATH=data/divergence_log.jsonl
```

---

## What NOT to Use

- ❌ LangChain — unnecessary abstraction for two Claude calls
- ❌ localStorage / sessionStorage — not supported in artifact environments
- ❌ SQLite or any database — JSONL only for MVP
- ❌ Server-side rendering — plain React SPA is sufficient
- ❌ CSS modules or styled-components — Tailwind only
