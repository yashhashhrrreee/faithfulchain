/**
 * StatsPanel — session divergence statistics, rendered below ChainPanel.
 * @param {{ sessionId: string, onReset: () => void }} props
 */

import { useEffect, useState } from 'react'
import { getStats } from '../api'

const DIM_LABELS = {
  logical_validity: 'Logical Validity',
  reference_integrity: 'Reference Integrity',
  necessity_score: 'Necessity Score',
}

export default function StatsPanel({ sessionId, onReset }) {
  const [stats, setStats] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    getStats(sessionId)
      .then(setStats)
      .catch(e => setErr(e.message))
  }, [sessionId])

  if (err) {
    return (
      <div className="neo-raised" style={{ padding: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neo-danger)' }}>
          Stats failed: {err}
        </p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="neo-raised" style={{ padding: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neo-text-muted)' }}>
          Loading stats…
        </p>
      </div>
    )
  }

  return (
    <div className="neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--neo-text)' }}>
        Session Results
      </h2>

      {/* 3 stat cards in a row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        {/* Divergence Rate */}
        <div className="neo-raised-sm" style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--neo-accent)' }}>
            {Math.round(stats.divergence_rate * 100)}%
          </p>
          <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--neo-text-muted)', lineHeight: 1.3 }}>
            Divergence Rate
          </p>
        </div>

        {/* Flagged */}
        <div className="neo-raised-sm" style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--neo-warning)' }}>
            {stats.total_flagged}
          </p>
          <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--neo-text-muted)', lineHeight: 1.3 }}>
            Flagged
          </p>
        </div>

        {/* Disagreements */}
        <div className="neo-raised-sm" style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--neo-danger)' }}>
            {stats.human_disagreements}
          </p>
          <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--neo-text-muted)', lineHeight: 1.3 }}>
            Disagreements
          </p>
        </div>
      </div>

      {/* Weakest dimension */}
      <div className="neo-inset" style={{ padding: '0.75rem 1rem' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--neo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Weakest Dimension
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--neo-danger)' }}>
          {DIM_LABELS[stats.worst_dimension] || stats.worst_dimension}
        </p>
      </div>

      <button
        className="neo-btn-accent"
        onClick={onReset}
        style={{ padding: '11px', fontSize: '0.875rem', fontWeight: 600 }}
      >
        Start new question
      </button>
    </div>
  )
}
