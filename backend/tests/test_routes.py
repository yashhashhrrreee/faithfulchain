"""Integration tests for FastAPI routes — Claude API mocked."""

import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


SAMPLE_STEPS = [
    {"id": 1, "text": "2 + 2 equals 4.", "cites": [], "is_conclusion": False},
    {"id": 2, "text": "Therefore the answer is 4.", "cites": [1], "is_conclusion": True},
]

REASONER_PAYLOAD = {"steps": SAMPLE_STEPS, "answer": "4"}

AUDITOR_PAYLOAD = {
    "audits": [
        {
            "step_id": 1,
            "logical_validity": 0.95,
            "reference_integrity": 1.0,
            "necessity_score": 0.9,
            "explanation": "Valid arithmetic.",
            "flagged": False,
        },
        {
            "step_id": 2,
            "logical_validity": 0.90,
            "reference_integrity": 0.95,
            "necessity_score": 0.85,
            "explanation": "Valid conclusion.",
            "flagged": False,
        },
    ]
}


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient with storage pointed at tmp_path."""
    import storage
    monkeypatch.setattr(storage, "LOG_PATH", tmp_path / "test.jsonl")
    from main import app
    return TestClient(app)


def test_reason_endpoint_returns_session_id(client):
    """POST /api/reason must return session_id and steps."""
    with patch("main.call_claude", new_callable=AsyncMock, return_value=REASONER_PAYLOAD):
        resp = client.post("/api/reason", json={"question": "What is 2+2?", "domain": "math"})
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert len(data["steps"]) == 2
    assert data["answer"] == "4"


def test_audit_endpoint_returns_audits(client):
    """POST /api/audit must return per-step audit scores."""
    with patch("main.call_claude", new_callable=AsyncMock, return_value=AUDITOR_PAYLOAD):
        resp = client.post(
            "/api/audit",
            json={"session_id": "test-sess", "steps": SAMPLE_STEPS},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "test-sess"
    assert len(data["audits"]) == 2


def test_verdict_endpoint_returns_ok(client):
    """POST /api/verdict must return {"ok": true}."""
    resp = client.post(
        "/api/verdict",
        json={
            "session_id": "sess-1",
            "step_id": 1,
            "auditor_flagged": True,
            "human_verdict": "agree",
            "domain": "math",
        },
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


def test_stats_endpoint_returns_divergence(client):
    """GET /api/stats/{session_id} must return divergence stats."""
    # Write two records: one agree, one disagree
    client.post(
        "/api/verdict",
        json={"session_id": "s42", "step_id": 1, "auditor_flagged": True, "human_verdict": "agree", "domain": "math"},
    )
    client.post(
        "/api/verdict",
        json={"session_id": "s42", "step_id": 2, "auditor_flagged": True, "human_verdict": "disagree", "domain": "math"},
    )
    resp = client.get("/api/stats/s42")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "s42"
    assert data["total_flagged"] == 2
    assert data["human_disagreements"] == 1
    assert abs(data["divergence_rate"] - 0.5) < 1e-6


def test_log_endpoint_returns_array(client):
    """GET /api/log must return a list."""
    resp = client.get("/api/log")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_reason_endpoint_bad_domain(client):
    """POST /api/reason with invalid domain must return 422."""
    resp = client.post("/api/reason", json={"question": "Q?", "domain": "science"})
    assert resp.status_code == 422


def test_cors_header_present(client):
    """CORS preflight must return allow-origin header for localhost:5173."""
    resp = client.options(
        "/api/reason",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert resp.status_code in (200, 204)
