"""Pydantic models for FaithfulChain request/response validation."""

from typing import Literal
from pydantic import BaseModel

THRESHOLD_LOGICAL_VALIDITY = 0.75
THRESHOLD_REFERENCE_INTEGRITY = 0.80
THRESHOLD_NECESSITY_SCORE = 0.65


class QuestionRequest(BaseModel):
    """Request body for POST /api/reason."""

    question: str
    domain: Literal["medical", "legal", "math", "general"]


class ReasoningStep(BaseModel):
    """One atomic step in a reasoning chain."""

    id: int
    text: str
    cites: list[int]
    is_conclusion: bool


class ReasonerResponse(BaseModel):
    """Response from POST /api/reason."""

    session_id: str
    steps: list[ReasoningStep]
    answer: str


class AuditScore(BaseModel):
    """Auditor scores for one reasoning step."""

    step_id: int
    logical_validity: float
    reference_integrity: float
    necessity_score: float
    explanation: str
    flagged: bool


class AuditResponse(BaseModel):
    """Response from POST /api/audit."""

    session_id: str
    audits: list[AuditScore]


class AuditRequest(BaseModel):
    """Request body for POST /api/audit."""

    session_id: str
    steps: list[ReasoningStep]


class VerdictRequest(BaseModel):
    """Request body for POST /api/verdict."""

    session_id: str
    step_id: int
    auditor_flagged: bool
    human_verdict: Literal["agree", "disagree", "unsure"]
    domain: str


class StatsResponse(BaseModel):
    """Response from GET /api/stats/{session_id}."""

    session_id: str
    total_steps: int
    total_flagged: int
    human_disagreements: int
    divergence_rate: float
    worst_dimension: str
