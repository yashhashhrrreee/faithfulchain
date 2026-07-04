"""FastAPI application with CORS and all route definitions."""

import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from claude_service import call_claude
from models import (
    AuditRequest,
    AuditResponse,
    AuditScore,
    QuestionRequest,
    ReasonerResponse,
    ReasoningStep,
    StatsResponse,
    VerdictRequest,
)
from prompts import AUDITOR_SYSTEM, REASONER_SYSTEM
from storage import append_verdict, compute_stats, load_all_verdicts

app = FastAPI(title="FaithfulChain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/reason", response_model=ReasonerResponse)
async def reason(request: QuestionRequest) -> ReasonerResponse:
    """Call Reasoner Claude and return structured reasoning chain."""
    session_id = str(uuid.uuid4())
    user_message = (
        f"Domain: {request.domain}\n\nQuestion: {request.question}"
    )
    try:
        data = await call_claude(REASONER_SYSTEM, user_message)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    try:
        steps = [ReasoningStep(**s) for s in data["steps"]]
        answer = data["answer"]
    except (KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=502, detail=f"Unexpected Reasoner response shape: {exc}"
        )

    return ReasonerResponse(session_id=session_id, steps=steps, answer=answer)


@app.post("/api/audit", response_model=AuditResponse)
async def audit(request: AuditRequest) -> AuditResponse:
    """Call Auditor Claude and return per-step scores."""
    steps_json = [s.model_dump() for s in request.steps]
    user_message = f"Audit these reasoning steps:\n{steps_json}"
    try:
        data = await call_claude(AUDITOR_SYSTEM, user_message)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    try:
        audits = [AuditScore(**a) for a in data["audits"]]
    except (KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=502, detail=f"Unexpected Auditor response shape: {exc}"
        )

    return AuditResponse(session_id=request.session_id, audits=audits)


@app.post("/api/verdict")
async def verdict(request: VerdictRequest) -> dict:
    """Persist a human verdict to the JSONL log."""
    append_verdict(request)
    return {"ok": True}


@app.get("/api/stats/{session_id}", response_model=StatsResponse)
async def stats(session_id: str) -> StatsResponse:
    """Return divergence statistics for a session."""
    return compute_stats(session_id)


@app.get("/api/log")
async def log() -> list[dict]:
    """Return all JSONL records as a JSON array."""
    return load_all_verdicts()
