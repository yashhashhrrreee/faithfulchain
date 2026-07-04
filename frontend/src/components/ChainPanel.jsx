/**
 * ChainPanel — accordion list of reasoning steps with single-open constraint.
 * Flagged/danger steps auto-expand when audits arrive.
 * @param {{ steps: Array, audits: Array, auditLoading: boolean, answer: string }} props
 */

import { useEffect, useState } from 'react'
import { stepCardShadow, stepIndicatorColor, scoreBarColor } from '../utils/scoring'
import { pct, truncate } from '../utils/format'

const SCORE_DIMS = [
  { key: 'logical_validity', label: 'Logic' },
  { key: 'reference_integrity', label: 'References' },
  { key: 'necessity_score', label: 'Necessity' },
]

function ScoreBar({ label, score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
      <span style={{ width: 72, flexShrink: 0, color: 'var(--neo-text-muted)' }}>{label}</span>
      <div className="neo-inset" style={{ flex: 1, height: 7, borderRadius: 4, overflow: 'hidden', padding: 0 }}>
        <div style={{
          height: '100%',
          width: `${Math.round(score * 100)}%`,
          background: scoreBarColor(score),
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ width: 28, textAlign: 'right', color: 'var(--neo-text-muted)' }}>{pct(score)}</span>
    </div>
  )
}

function StepCard({ step, audit, auditLoading, isOpen, onToggle }) {
  const shadow = stepCardShadow(audit)
  const indicatorColor = stepIndicatorColor(audit)
  const isFlagged = audit?.flagged
  const bodyMaxHeight = isOpen ? '600px' : '0px'

  return (
    <div
      style={{
        background: 'var(--neo-card)',
        borderRadius: 14,
        boxShadow: shadow,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease',
      }}
      onClick={onToggle}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.85rem 1rem' }}>
        {/* Coloured left indicator dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: auditLoading ? 'var(--neo-text-muted)' : indicatorColor,
          flexShrink: 0, marginTop: 5,
          boxShadow: auditLoading ? 'none' : `0 0 6px ${indicatorColor}`,
          transition: 'background 0.3s ease',
        }} />

        {/* Step number */}
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, color: 'var(--neo-accent)',
          background: 'var(--neo-accent-glow)', borderRadius: 6,
          padding: '2px 7px', flexShrink: 0,
        }}>
          {step.id}
        </span>

        {/* Truncated text */}
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neo-text)', flex: 1, lineHeight: 1.4 }}>
          {isOpen ? step.text : truncate(step.text, 90)}
        </p>

        {/* Flags + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {isFlagged && !auditLoading && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 600,
              color: 'var(--neo-warning)',
              background: 'var(--neo-accent-glow)',
              borderRadius: 5, padding: '2px 6px',
            }}>
              Flagged
            </span>
          )}
          {auditLoading && (
            <span style={{ fontSize: '0.7rem', color: 'var(--neo-text-muted)' }}>…</span>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--neo-text-muted)' }}>
            {isOpen ? '▾' : '▸'}
          </span>
        </div>
      </div>

      {/* Expandable body */}
      <div className="step-body" style={{ maxHeight: bodyMaxHeight }}>
        <div style={{ padding: '0 1rem 0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
             onClick={e => e.stopPropagation()}>

          {/* Citation tags */}
          {step.cites.length > 0 && (
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {step.cites.map(c => (
                <span key={c} style={{
                  fontSize: '0.68rem', color: 'var(--neo-text-muted)',
                  background: 'var(--neo-bg)', borderRadius: 6, padding: '2px 8px',
                  boxShadow: 'inset 2px 2px 4px var(--neo-shadow-dark), inset -2px -2px 4px var(--neo-shadow-light)',
                }}>
                  → Step {c}
                </span>
              ))}
            </div>
          )}

          {/* Score bars */}
          {audit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
              {SCORE_DIMS.map(({ key, label }) => (
                <ScoreBar key={key} label={label} score={audit[key]} />
              ))}
            </div>
          )}

          {/* Auditor explanation */}
          {audit?.explanation && (
            <p style={{
              margin: 0, fontSize: '0.72rem', color: 'var(--neo-text-muted)',
              fontStyle: 'italic', lineHeight: 1.5,
              padding: '0.5rem 0.75rem',
              background: 'var(--neo-bg)',
              borderRadius: 8,
              boxShadow: 'inset 2px 2px 6px var(--neo-shadow-dark), inset -2px -2px 6px var(--neo-shadow-light)',
            }}>
              {audit.explanation}
            </p>
          )}

          {/* Skeleton while loading */}
          {auditLoading && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {[60, 80, 50].map((w, i) => (
                <div key={i} style={{
                  height: 6, width: `${w}%`, borderRadius: 4,
                  background: 'var(--neo-shadow-dark)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChainPanel({ steps, audits, auditLoading, answer }) {
  const [openId, setOpenId] = useState(null)
  const auditMap = Object.fromEntries((audits || []).map(a => [a.step_id, a]))

  // Auto-open first flagged step when audits arrive
  useEffect(() => {
    if (!audits || audits.length === 0) return
    const firstFlagged = steps.find(s => auditMap[s.id]?.flagged)
    setOpenId(firstFlagged?.id ?? null)
  }, [audits]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!steps || steps.length === 0) {
    return (
      <div className="neo-raised" style={{
        padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>🔗</span>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neo-text-muted)' }}>
          Reasoning chain appears here after analysis
        </p>
      </div>
    )
  }

  return (
    <div className="neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--neo-text)' }}>
        Reasoning Chain
      </h2>

      {steps.map(step => (
        <StepCard
          key={step.id}
          step={step}
          audit={auditMap[step.id] || null}
          auditLoading={auditLoading && !auditMap[step.id]}
          isOpen={openId === step.id}
          onToggle={() => setOpenId(id => id === step.id ? null : step.id)}
        />
      ))}

      {answer && (
        <div style={{
          marginTop: '0.25rem', padding: '1rem',
          background: 'var(--neo-accent-glow)',
          borderRadius: 12,
          boxShadow: `inset 0 0 0 1px var(--neo-accent)`,
        }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--neo-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Conclusion
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neo-text)', fontWeight: 500 }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
