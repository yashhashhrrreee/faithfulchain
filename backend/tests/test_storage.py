"""Tests for storage.py — uses tmp_path, never touches real log file."""

import json
import pytest
from pathlib import Path

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import VerdictRequest
from storage import append_verdict, compute_stats, load_all_verdicts


def _make_verdict(session_id: str = "sess1", step_id: int = 1, verdict: str = "agree") -> VerdictRequest:
    """Helper to build a VerdictRequest."""
    return VerdictRequest(
        session_id=session_id,
        step_id=step_id,
        auditor_flagged=True,
        human_verdict=verdict,
        domain="math",
    )


def test_append_verdict_creates_file(tmp_path: Path):
    """append_verdict must create the log file if it doesn't exist."""
    log = tmp_path / "test.jsonl"
    append_verdict(_make_verdict(), log_path=log)
    assert log.exists()


def test_append_verdict_writes_valid_json(tmp_path: Path):
    """Each appended line must be valid JSON with expected keys."""
    log = tmp_path / "test.jsonl"
    append_verdict(_make_verdict(verdict="disagree"), log_path=log)
    lines = log.read_text().strip().splitlines()
    assert len(lines) == 1
    record = json.loads(lines[0])
    assert record["session_id"] == "sess1"
    assert record["diverged"] is True


def test_append_multiple_verdicts(tmp_path: Path):
    """Multiple appends must each write a separate line."""
    log = tmp_path / "test.jsonl"
    for i in range(3):
        append_verdict(_make_verdict(step_id=i), log_path=log)
    lines = log.read_text().strip().splitlines()
    assert len(lines) == 3


def test_load_all_verdicts_empty(tmp_path: Path):
    """load_all_verdicts returns empty list when file missing."""
    log = tmp_path / "missing.jsonl"
    assert load_all_verdicts(log_path=log) == []


def test_load_all_verdicts_returns_records(tmp_path: Path):
    """load_all_verdicts returns all written records."""
    log = tmp_path / "test.jsonl"
    append_verdict(_make_verdict("s1", 1, "agree"), log_path=log)
    append_verdict(_make_verdict("s2", 2, "disagree"), log_path=log)
    records = load_all_verdicts(log_path=log)
    assert len(records) == 2
    assert records[1]["diverged"] is True


def test_compute_stats_divergence_rate(tmp_path: Path):
    """compute_stats must compute correct divergence_rate."""
    log = tmp_path / "test.jsonl"
    append_verdict(_make_verdict("s1", 1, "agree"), log_path=log)
    append_verdict(_make_verdict("s1", 2, "disagree"), log_path=log)
    stats = compute_stats("s1", log_path=log)
    assert stats.total_flagged == 2
    assert stats.human_disagreements == 1
    assert stats.divergence_rate == pytest.approx(0.5)


def test_compute_stats_filters_by_session(tmp_path: Path):
    """compute_stats must only count records for the given session."""
    log = tmp_path / "test.jsonl"
    append_verdict(_make_verdict("sess-A", 1, "disagree"), log_path=log)
    append_verdict(_make_verdict("sess-B", 2, "disagree"), log_path=log)
    stats = compute_stats("sess-A", log_path=log)
    assert stats.total_steps == 1
    assert stats.human_disagreements == 1


def test_compute_stats_no_flagged(tmp_path: Path):
    """compute_stats divergence_rate is 0.0 when no flagged steps."""
    log = tmp_path / "test.jsonl"
    v = VerdictRequest(
        session_id="s1", step_id=1, auditor_flagged=False,
        human_verdict="agree", domain="general"
    )
    append_verdict(v, log_path=log)
    stats = compute_stats("s1", log_path=log)
    assert stats.divergence_rate == 0.0
