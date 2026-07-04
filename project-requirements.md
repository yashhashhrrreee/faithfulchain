# FaithfulChain — Project Requirements

## Project Overview

**Name:** FaithfulChain — Reasoning Faithfulness Auditor  
**Author:** Yashashree Bedmutha  
**Purpose:** An interactive tool that exposes whether Claude's chain-of-thought reasoning is genuinely faithful to its conclusions, or post-hoc rationalisation — and lets humans mark exactly where the two diverge.  
**Research Area:** Scalable Oversight (Anthropic Fellows Program)

---

## Problem Statement

Chain-of-thought prompting makes AI reasoning *visible*, but visible does not mean *faithful*. Research (Turpin et al. 2023, Lanham et al. 2023) shows models often arrive at answers through opaque internal processes and construct plausible-looking justifications afterward. Current tools either require white-box model access (unavailable via API) or are expensive academic studies. FaithfulChain is an interactive, black-box auditing tool anyone can run.

---

## Goals

1. Let users submit a complex question and receive Claude's step-by-step reasoning.
2. Automatically audit each reasoning step using a second Claude instance.
3. Surface flagged "weak link" steps to the human for verdict (Agree / Disagree / Unsure).
4. Log every session to a divergence dataset for research analysis.
5. Display session-level and aggregate statistics on human-AI auditor disagreement.

---

## Features

### MVP (Week 1)

| Feature | Description |
|---|---|
| Question input | Free-text input with domain selector (Medical / Legal / Math / General) |
| Reasoner | Claude generates numbered, atomic CoT steps in structured JSON |
| Auditor | Second Claude call scores each step on 3 dimensions |
| Step viewer | Colour-coded reasoning chain (green / amber / red by audit score) |
| Human review | One flagged step at a time; 3-button verdict UI |
| Divergence log | JSONL flat file storing every verdict with metadata |
| Session stats | Divergence rate, worst-performing dimension, step count |

### Post-MVP (stretch)

- Step dependency graph (D3 force-directed, showing which steps cite which)
- Multi-domain divergence comparison dashboard
- Export divergence log as CSV
- Example question bank (pre-loaded test cases per domain)

---

## Out of Scope

- User authentication / accounts
- Database (JSONL flat file only for MVP)
- Multi-user collaboration
- Fine-tuning or model training on the divergence data
- Mobile-optimised layout (desktop-first for MVP)

---

## Success Criteria

- [ ] A complete session (question → audit → all verdicts) runs in under 45 seconds
- [ ] Both Claude calls return valid JSON on 95%+ of well-formed questions
- [ ] Human verdict is recorded correctly to JSONL for every flagged step
- [ ] Session stats render correctly after all verdicts are submitted
- [ ] 15+ test questions run successfully across 3 domains for the research README
