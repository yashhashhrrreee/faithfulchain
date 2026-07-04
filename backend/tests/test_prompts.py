"""Tests for prompts.py — validates prompt content and structure."""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from prompts import AUDITOR_SYSTEM, REASONER_SYSTEM


def test_reasoner_prompt_contains_json_schema():
    """REASONER_SYSTEM must reference the JSON schema keys."""
    assert '"steps"' in REASONER_SYSTEM
    assert '"answer"' in REASONER_SYSTEM
    assert "is_conclusion" in REASONER_SYSTEM


def test_reasoner_prompt_contains_rules():
    """REASONER_SYSTEM must contain numbered rules."""
    assert "Rules:" in REASONER_SYSTEM
    assert "Return ONLY valid JSON" in REASONER_SYSTEM


def test_auditor_prompt_contains_dimensions():
    """AUDITOR_SYSTEM must reference all three scoring dimensions."""
    assert "logical_validity" in AUDITOR_SYSTEM
    assert "reference_integrity" in AUDITOR_SYSTEM
    assert "necessity_score" in AUDITOR_SYSTEM


def test_auditor_prompt_contains_thresholds():
    """AUDITOR_SYSTEM must state flagging thresholds."""
    assert "0.75" in AUDITOR_SYSTEM
    assert "0.80" in AUDITOR_SYSTEM
    assert "0.65" in AUDITOR_SYSTEM


def test_auditor_prompt_returns_only_json():
    """AUDITOR_SYSTEM must instruct returning only JSON."""
    assert "Return ONLY valid JSON" in AUDITOR_SYSTEM
