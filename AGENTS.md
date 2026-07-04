# AGENTS.md — FaithfulChain

> This file follows the AGENTS.md open format stewarded by the Linux Foundation.  
> It provides structured guidance for any coding agent working on this repository.

---

## Project Identity

- **Name:** FaithfulChain
- **Type:** Research tool / web application
- **Domain:** AI safety — scalable oversight
- **Status:** Active development

---

## Agent Onboarding

When an agent begins a new session on this repository:

1. Read `CLAUDE.md` for coding rules and constraints.
2. Read `progress.md` to understand what has already been built.
3. Read `implementation-plan.md` and identify the first unchecked `[ ]` item.
4. Begin work from that item. Do not re-implement completed work.
5. After completing work, update `progress.md` and check off items in `implementation-plan.md`.

---

## Permitted Actions

| Action | Permitted |
|---|---|
| Create new files listed in `architecture.md` | ✅ |
| Modify existing source files | ✅ |
| Install packages listed in `tech-stack.md` | ✅ |
| Run `pytest` | ✅ |
| Run `npm run dev` / `uvicorn` | ✅ |
| Add new packages NOT in `tech-stack.md` | ⚠️ Document in `tech-stack.md` first |
| Create files NOT in `architecture.md` | ⚠️ Document in `architecture.md` first |
| Delete existing source files | ❌ Ask the human first |
| Commit to git | ❌ Human commits only |
| Change the two Claude prompts in `CLAUDE.md` | ❌ Do not modify prompts without explicit instruction |

---

## Repository Boundaries

- **Backend:** `backend/` — Python/FastAPI only
- **Frontend:** `frontend/` — React/Vite/Tailwind only
- **Data:** `data/` — runtime only, never modify programmatically from tests
- **Docs:** root `.md` files — agent updates `progress.md` and `implementation-plan.md` only

---

## Testing Protocol

Before marking any Phase complete:

```bash
# Backend
cd backend
pytest --tb=short -v

# Frontend (when Jest is set up)
cd frontend
npm test
```

All tests must pass. If a test fails, fix it before moving on. Do not skip tests.

---

## Communication Protocol

When an agent completes a task or encounters a blocker, it should leave a note in `progress.md` under "Known Issues / Blockers" with:
- What was attempted
- What the error was
- What was tried to fix it

This allows the next agent session to pick up without repeating failed approaches.

---

## Security Rules

- Never log or print `ANTHROPIC_API_KEY` to console or files.
- Never commit `.env` to git (it is in `.gitignore`).
- Never expose raw Claude API responses directly to the frontend — always parse and validate through Pydantic models first.
- The `GET /api/log` endpoint returns research data only — do not include user IP or identifying information in JSONL records.

---

## Style Guide Summary

Full rules in `CLAUDE.md`. Quick reference:

- Python: type hints everywhere, async throughout, docstrings on every function
- React: functional components, Tailwind only, all API calls through `api.js`
- Naming: `snake_case` for Python, `camelCase` for JS, `PascalCase` for React components
- Imports: group as stdlib → third-party → local, separated by blank lines

---

## Contact

**Author:** Yashashree Bedmutha  
**Email:** yashashree.bedmutha@gmail.com  
**GitHub:** github.com/yashhashhrrreee
