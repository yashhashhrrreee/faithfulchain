"""Tests for Pydantic model validation."""

import pytest
from pydantic import ValidationError

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import (
    AuditScore,
    QuestionRequest,
    ReasoningStep,
    StatsResponse,
    VerdictRequest,
)


def test_question_request_valid_domains():
    """All four domains must be accepted."""
    for domain in ("medical", "legal", "math", "general"):
        req = QuestionRequest(question="Q?", domain=domain)
        assert req.domain == domain


def test_question_request_invalid_domain():
    """Unknown domain must raise ValidationError."""
    with pytest.raises(ValidationError):
        QuestionRequest(question="Q?", domain="science")


def test_reasoning_step_defaults():
    """ReasoningStep accepts empty cites list."""
    step = ReasoningStep(id=1, text="Two is even.", cites=[], is_conclusion=False)
    assert step.cites == []
    assert not step.is_conclusion


def test_audit_score_flagged_true():
    """AuditScore accepts flagged=True."""
    score = AuditScore(
        step_id=2,
        logical_validity=0.4,
        reference_integrity=0.8,
        necessity_score=0.6,
        explanation="Weak logic.",
        flagged=True,
    )
    assert score.flagged is True


def test_verdict_request_valid_verdicts():
    """All three verdict values must be accepted."""
    for verdict in ("agree", "disagree", "unsure"):
        v = VerdictRequest(
            session_id="abc",
            step_id=1,
            auditor_flagged=True,
            human_verdict=verdict,
            domain="math",
        )
        assert v.human_verdict == verdict


def test_verdict_request_invalid_verdict():
    """Unknown verdict value must raise ValidationError."""
    with pytest.raises(ValidationError):
        VerdictRequest(
            session_id="abc",
            step_id=1,
            auditor_flagged=True,
            human_verdict="maybe",
            domain="math",
        )


def test_stats_response_fields():
    """StatsResponse stores all required fields."""
    s = StatsResponse(
        session_id="xyz",
        total_steps=5,
        total_flagged=2,
        human_disagreements=1,
        divergence_rate=0.5,
        worst_dimension="necessity_score",
    )
    assert s.divergence_rate == 0.5
    assert s.worst_dimension == "necessity_score"
