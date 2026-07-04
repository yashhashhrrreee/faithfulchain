/**
 * VerdictPanel — one flagged step at a time for human review.
 * @param {{ flaggedSteps: Array, audits: Array, currentIndex: number,
 *           onVerdict: (stepId, verdict) => void, onComplete: () => void }} props
 */

import { scoreBarColor } from '../utils/scoring'
import { pct } from '../utils/format'

const SCORE_DIMS = [
  { key: 'logical_validity', label: 'Logic' },
  { key: 'reference_integrity', label: 'References' },
  { key: 'necessity_score', label: 'Necessity' },
]

export default function VerdictPanel({ flaggedSteps, audits, currentIndex, onVerdict, onComplete }) {
  if (!flaggedSteps || flaggedSteps.length === 0) {
    return (
      <div className="neo-raised" style={{
        padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>✅</span>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neo-text-muted)' }}>
          No flagged steps to review
        </p>
      </div>
    )
  }

  if (currentIndex >= flaggedSteps.length) {
    return (
      <div className="neo-raised" style={{
        padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '1rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>🎉</span>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--neo-text)' }}>All flags reviewed!</p>
        <button
          className="neo-btn-accent"
          onClick={onComplete}
          style={{ padding: '10px 24px', fontSize: '0.875rem', fontWeight: 600 }}
        >
          View Stats
        </button>
      </div>
    )
  }

  const step = flaggedSteps[currentIndex]
  const auditMap = Object.fromEntries((audits || []).map(a => [a.step_id, a]))
  const audit = auditMap[step.id]
  const progressPct = (currentIndex / flaggedSteps.length) * 100

  return (
    <div className="neo-raised" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header + counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--neo-text)' }}>
          Human Verdict
        </h2>
        <span style={{ fontSize: '0.72rem', color: 'var(--neo-text-muted)' }}>
          Step {currentIndex + 1} of {flaggedSteps.length} flagged
        </span>
      </div>

      {/* Progress bar — inset track + accent fill */}
      <div className="neo-inset" style={{ height: 8, borderRadius: 8, overflow: 'hidden', padding: 0 }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'var(--neo-accent)',
          borderRadius: 8,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Step text */}
      <div className="neo-inset" style={{ padding: '0.85rem 1rem' }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--neo-warning)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Step {step.id}
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neo-text)', lineHeight: 1.5 }}>
          {step.text}
        </p>
      </div>

      {/* Score bars */}
      {audit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {SCORE_DIMS.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
              <span style={{ width: 76, flexShrink: 0, color: 'var(--neo-text-muted)' }}>{label}</span>
              <div className="neo-inset" style={{ flex: 1, height: 7, borderRadius: 4, overflow: 'hidden', padding: 0 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(audit[key] * 100)}%`,
                  background: scoreBarColor(audit[key]),
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ width: 28, textAlign: 'right', color: 'var(--neo-text-muted)' }}>{pct(audit[key])}</span>
            </div>
          ))}
        </div>
      )}

      {/* Auditor explanation — inset box */}
      {audit?.explanation && (
        <div className="neo-inset" style={{ padding: '0.75rem 1rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--neo-text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {audit.explanation}
          </p>
        </div>
      )}

      {/* Verdict buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
        <button
          className="neo-btn"
          onClick={() => onVerdict(step.id, 'agree')}
          style={{ padding: '11px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--neo-danger)' }}
        >
          Agree — this step is weak
        </button>
        <button
          className="neo-btn"
          onClick={() => onVerdict(step.id, 'disagree')}
          style={{ padding: '11px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--neo-success)' }}
        >
          Disagree — step is valid
        </button>
        <button
          className="neo-btn"
          onClick={() => onVerdict(step.id, 'unsure')}
          style={{ padding: '11px', fontSize: '0.85rem', color: 'var(--neo-text-muted)' }}
        >
          Unsure
        </button>
      </div>
    </div>
  )
}
