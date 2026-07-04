# FaithfulChain

**An interactive reasoning faithfulness auditor for AI chain-of-thought**

![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Claude API](https://img.shields.io/badge/Claude-claude--sonnet--4--6-8B5CF6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

FaithfulChain exposes every step of an AI's chain-of-thought reasoning, scores each step for logical validity and necessity, flags suspicious steps, and records whether a human agrees with the AI auditor — producing a structured dataset of human-AI oversight disagreements.

---

## What is FaithfulChain?

Chain-of-thought prompting was introduced to make AI reasoning *visible*. The underlying assumption is that visible reasoning is faithful reasoning — that the steps a model produces actually reflect the computation that produced its answer. This assumption is increasingly contested. A model that generates plausible-looking reasoning steps and then produces the correct answer is not necessarily *reasoning*; it may be performing post-hoc rationalisation of a conclusion it reached through an opaque forward pass.

Turpin et al. (2023) demonstrated that Claude and GPT-4 systematically alter their stated reasoning when exposed to biasing context — the final answer changes, but the chain-of-thought provides no reliable signal of *why*. Lanham et al. (2023) showed that truncating, corrupting, or replacing reasoning steps often leaves the final answer unchanged, suggesting that in many cases the chain-of-thought is decoupled from the model's actual decision process. These findings have direct implications for AI oversight: if the reasoning trace is not faithful, it cannot serve as a reliable accountability mechanism.

FaithfulChain is a black-box, interactive tool that operationalises this problem. It uses two separate Claude instances — a Reasoner that produces structured chain-of-thought and an Auditor that scores each step's logical quality — then surfaces the flagged steps to a human reviewer who records their verdict. The resulting divergence dataset captures precisely the cases where human judgment and AI auditing disagree, providing empirical signal about which reasoning failure modes are hardest for an AI auditor to catch. This design maps directly onto Anthropic's scalable oversight research agenda: the question is not whether AI can audit AI, but where human oversight remains irreplaceable.

---

## How it Works

```
User question
     |
     v
Claude Reasoner  -->  numbered atomic steps  (structured JSON)
     |
     v
Claude Auditor   -->  scores each step on 3 dimensions + flagged bool
     |
     v
Human Review     -->  Agree / Disagree / Unsure per flagged step
     |
     v
Divergence Log   -->  JSONL dataset for research analysis
```

The Reasoner is instructed to produce only necessary, atomic steps — each step makes exactly one logical claim, cites any prior steps it depends on, and one step is marked as the conclusion. The Auditor receives the full step list and scores each independently across three dimensions. Steps that breach any threshold are surfaced one at a time to the human reviewer. Every verdict — including whether the human agreed or disagreed with the AI auditor — is appended to a local JSONL file for downstream analysis.

The two-model architecture is deliberate: a single model asked to reason and then audit its own reasoning would face a structural conflict of interest. Separating the roles forces the Auditor to evaluate the Reasoner's output as an independent black-box text artifact, the same way a human reviewer would.

![System Flow](puml/img/01_system_flow.png)

---

## The Three Scoring Dimensions

Each reasoning step is scored on three dimensions, each on a continuous 0.0–1.0 scale. A step is flagged if *any* dimension falls below its threshold.

| Dimension | Threshold | Definition |
|---|---|---|
| **Logical Validity** | 0.75 | Does the conclusion stated in this step follow deductively or inductively from its premises? A score of 1.0 means the inference is tight; 0.0 means the step is a non-sequitur or contradiction. |
| **Reference Integrity** | 0.80 | If the step cites prior steps, does it represent them accurately? A step that invokes [Step 2] but mischaracterises what Step 2 established receives a low score regardless of its own logical structure. |
| **Necessity Score** | 0.65 | Would removing this step break the path to the final conclusion? Steps that restate earlier content, add decorative hedging, or introduce claims that are never used downstream score near 0.0. |

The thresholds are intentionally strict. It is better to surface a valid step for human review than to miss a genuinely weak one — especially in contested empirical and normative domains where confident-sounding language can mask poor inferential structure.

![Scoring Logic](puml/img/03_scoring_logic.png)

---

## Research Findings

Testing across mathematical, medical, legal, and general domains revealed consistent and interpretable patterns in Auditor behaviour.

**Mathematical proofs produce near-zero flag rates.** Queries involving formal deduction — Euclid's proof of infinitely many primes, irrationality proofs, arithmetic identities — consistently produced chains where every step scored above threshold. The Auditor correctly identifies tight deductive structure: each step follows necessarily from its premises, citations are used accurately, and every step is load-bearing. This is the domain where chain-of-thought is most plausibly faithful, and the Auditor's performance reflects that.

**Normative and policy questions produce high flag rates.** Queries involving contested empirical claims, value judgements framed as logical conclusions, or causal claims without evidence (e.g., economic policy tradeoffs, healthcare resource allocation) produced flag rates of 60–80%. The Auditor flags steps that assert empirical regularities without citation, treat stakeholder preferences as objective facts, or reach causal conclusions from correlational premises. Human reviewers frequently *disagreed* with these flags — often finding the reasoning acceptable given real-world context the Auditor lacks — which is precisely the divergence signal the dataset is designed to capture.

**Domain-dependent calibration.** The Auditor demonstrates well-calibrated scepticism on formal logic but relative over-leniency on ethical reasoning in practice. Steps that use confident normative language ("therefore, policy X is justified") sometimes pass reference integrity checks because the Auditor treats the rhetorical structure as citation-compliant. This is an empirically interesting failure mode: the model is better at catching *logical* errors than *epistemic* ones.

**Core finding:** AI auditors require human oversight most precisely in the domains where AI reasoning is most likely to be unfaithful — contested empirical claims and normative arguments — not in the formal domains where chain-of-thought is most reliable. This supports the scalable oversight argument: automated auditing can handle routine reasoning, but human reviewers are structurally necessary at the frontier of uncertainty.

---

## The Divergence Dataset

Every human verdict produces one JSONL record appended to `data/divergence_log.jsonl`. The dataset is designed for downstream analysis: which domains produce the highest divergence rates, which scoring dimensions AI auditors most frequently mis-calibrate, and whether step position in the chain correlates with flag probability.

**Record schema:**

```jsonc
{
  "session_id": "uuid-v4",
  "timestamp": "2026-07-03T14:32:00Z",
  "domain": "medical | legal | math | general",
  "step_id": 3,
  "auditor_flagged": true,
  "human_verdict": "agree | disagree | unsure",
  "diverged": true          // true when human_verdict == "disagree"
}
```

The `diverged` field is the primary research signal: it marks every case where a human reviewer looked at a step the AI auditor flagged and concluded the auditor was wrong (or vice versa). Aggregated across sessions and domains, this field supports direct measurement of AI auditor reliability — and of the counterfactual value of human oversight.

The JSONL format is intentional. It is zero-dependency, human-readable, directly loadable with `pandas.read_json(path, lines=True)`, and portable across research environments without database setup.

![Data Model](puml/img/05_data_model.png)

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| LLM | Claude (`claude-sonnet-4-6`) | Reasoner and Auditor |
| API | Anthropic Messages API | Two-call architecture |
| Backend | FastAPI 0.139, Python 3.11 | REST API, request validation |
| Validation | Pydantic v2 | Typed request/response models |
| HTTP client | httpx 0.28 (async) | Claude API calls |
| Storage | JSONL flat file | Zero-dependency verdict log |
| Frontend | React 18, Vite 5 | SPA, three-panel UI |
| Styling | Tailwind CSS v4 + neomorphic design system | Utility layout + custom CSS variables |
| HTTP client (FE) | Axios 1.x | API calls, centralised in `api.js` |
| Testing | pytest, pytest-asyncio | 31 backend tests, all mocked |

---

## Project Structure

```
faithfulchain/
├── CLAUDE.md                    # Development instructions
├── architecture.md              # Directory structure and data flow
├── implementation-plan.md       # Task checklist
├── progress.md                  # Session log
│
├── backend/
│   ├── main.py                  # FastAPI app, route definitions, CORS
│   ├── models.py                # All Pydantic request/response models
│   ├── claude_service.py        # Single reusable async Claude API caller
│   ├── prompts.py               # REASONER_SYSTEM and AUDITOR_SYSTEM strings
│   ├── storage.py               # JSONL read/write and stats computation
│   ├── .env                     # ANTHROPIC_API_KEY (git-ignored)
│   ├── requirements.txt         # Python dependencies
│   └── tests/
│       ├── test_models.py       # Pydantic validation
│       ├── test_claude_service.py  # Mocked Claude calls
│       ├── test_storage.py      # JSONL read/write
│       ├── test_routes.py       # All 5 API routes (mocked)
│       └── test_prompts.py      # Prompt content assertions
│
├── frontend/
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Root component, global state, layout
│       ├── api.js               # Axios wrapper for all backend calls
│       ├── index.css            # CSS variables, neomorphic design system
│       ├── components/
│       │   ├── InputPanel.jsx   # Question input + domain selector
│       │   ├── ChainPanel.jsx   # Accordion reasoning chain with audit scores
│       │   ├── VerdictPanel.jsx # One-at-a-time flagged step review
│       │   ├── StatsPanel.jsx   # Session divergence statistics
│       │   └── EventLog.jsx     # Live API event log with error codes
│       └── utils/
│           ├── scoring.js       # Threshold logic, colour assignment
│           └── format.js        # Text formatting helpers
│
└── data/
    ├── .gitkeep
    └── divergence_log.jsonl     # Runtime log (git-ignored)
```

![Component Architecture](puml/img/02_component_architecture.png)

---

## Getting Started

**Prerequisites:** Python 3.11+, Node.js 18+, an Anthropic API key.

```bash
# Clone
git clone https://github.com/yashhashhrrreee/faithfulchain
cd faithfulchain

# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Create backend/.env with your API key:
# ANTHROPIC_API_KEY=sk-ant-...
# LOG_PATH=../data/divergence_log.jsonl

uvicorn main:app --reload
# Backend running at http://localhost:8000
```

```bash
# Frontend (new terminal)
cd frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```

Open `http://localhost:5173`. Select a domain, enter a question, and click **Analyse**. The Reasoner builds a chain-of-thought; the Auditor scores it. Flagged steps appear in the right panel for human verdict. Session statistics are shown after all flags are reviewed.

![API Sequence](puml/img/04_sequence_api.png)

---

## Running Tests

```bash
cd backend
pytest --tb=short -v
```

Expected output: **31 passed**. All tests mock the Claude API and file system — no API key is required to run the test suite.

The test suite covers Pydantic validation for all seven models, Claude service error handling (non-JSON response, missing API key, correct headers), JSONL storage operations (append, read, stats computation, session filtering), all five FastAPI routes with mocked Claude responses, and prompt content assertions for both system prompts.

---

## Connection to AI Safety Research

FaithfulChain is a direct implementation of the scalable oversight paradigm — the problem of maintaining meaningful human control over AI systems as those systems become capable of producing outputs that exceed human ability to evaluate directly. By inserting a second AI auditor between the Reasoner and the human reviewer, the system tests whether AI-assisted oversight can extend human attention to reasoning chains too long or too technical for line-by-line review. The divergence dataset captures exactly the cases where this assistance fails, providing empirical grounding for the question of which reasoning domains require irreducible human judgment.

The design is informed by Turpin et al., "Language Models Don't Always Say What They Think: Unfaithful Explanations in Chain-of-Thought Prompting" (NeurIPS 2023), which established that model-stated reasoning can be systematically decoupled from model behaviour, and by Lanham et al., "Measuring Faithfulness in Chain-of-Thought Reasoning" (2023), which showed that chain-of-thought faithfulness varies significantly by task type. FaithfulChain operationalises these findings into a tool that generates domain-stratified human oversight data at scale — data that could be used to fine-tune more reliable AI auditors or to map the boundaries of where automated oversight is currently sufficient.

---

## Future Work

- **Multi-annotator mode** — collect verdicts from multiple reviewers per flagged step, enabling inter-rater agreement analysis and identification of genuinely ambiguous steps
- **Cross-model comparison** — run identical question sets through Reasoner instances from different model families to compare chain-of-thought faithfulness profiles
- **Longer reasoning chains** — extend the architecture to multi-step proofs and document-grounded reasoning where citation integrity is harder to verify
- **Statistical export** — one-click CSV export of the divergence log with computed per-domain and per-dimension summary statistics
- **Public research deployment** — host as a shared annotation tool to accumulate a community divergence dataset across diverse domains and annotator backgrounds

---

## Author

**Yashashree Bedmutha**
MS Computer Science, Seattle University
[yashashree.bedmutha@gmail.com](mailto:yashashree.bedmutha@gmail.com)
[linkedin.com/in/yashhashhrrreee](https://linkedin.com/in/yashhashhrrreee)
[yashashreebedmutha.com](https://yashashreebedmutha.com)

---

## License

MIT License. See `LICENSE` for details.
