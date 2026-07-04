"""JSONL storage for verdict records and stats computation."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from models import StatsResponse, VerdictRequest

LOG_PATH = Path(os.environ.get("LOG_PATH", "data/divergence_log.jsonl"))


def _resolve(log_path: Path | None) -> Path:
    """Return log_path if given, else the module-level LOG_PATH (read at call time)."""
    return log_path if log_path is not None else LOG_PATH


def append_verdict(verdict: VerdictRequest, *, log_path: Path | None = None) -> None:
    """Append one verdict record to the JSONL log file."""
    path = _resolve(log_path)
    record = {
        "session_id": verdict.session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "domain": verdict.domain,
        "step_id": verdict.step_id,
        "auditor_flagged": verdict.auditor_flagged,
        "human_verdict": verdict.human_verdict,
        "diverged": verdict.human_verdict == "disagree",
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")


def load_all_verdicts(*, log_path: Path | None = None) -> list[dict]:
    """Read all JSONL records from the log file."""
    path = _resolve(log_path)
    if not path.exists():
        return []
    records: list[dict] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return records


def compute_stats(session_id: str, *, log_path: Path | None = None) -> StatsResponse:
    """Compute divergence statistics for a given session."""
    all_records = load_all_verdicts(log_path=log_path)
    session_records = [r for r in all_records if r.get("session_id") == session_id]

    total_steps = len(session_records)
    total_flagged = sum(1 for r in session_records if r.get("auditor_flagged"))
    human_disagreements = sum(1 for r in session_records if r.get("diverged"))

    divergence_rate = (
        human_disagreements / total_flagged if total_flagged > 0 else 0.0
    )

    dimension_misses: dict[str, int] = {
        "logical_validity": 0,
        "reference_integrity": 0,
        "necessity_score": 0,
    }
    for record in session_records:
        scores = record.get("auditor_scores", {})
        for dim in dimension_misses:
            val = scores.get(dim)
            if val is not None and val < 0.7:
                dimension_misses[dim] += 1

    worst_dimension = max(dimension_misses, key=lambda d: dimension_misses[d])

    return StatsResponse(
        session_id=session_id,
        total_steps=total_steps,
        total_flagged=total_flagged,
        human_disagreements=human_disagreements,
        divergence_rate=divergence_rate,
        worst_dimension=worst_dimension,
    )
