import { useRef, useState } from 'react'
import { postReason, postAudit, postVerdict } from './api'
import InputPanel from './components/InputPanel'
import ChainPanel from './components/ChainPanel'
import VerdictPanel from './components/VerdictPanel'
import StatsPanel from './components/StatsPanel'
import EventLog from './components/EventLog'

export default function App() {
  const [dark, setDark] = useState(false)

  // Core session state
  const [question, setQuestion] = useState('')
  const [domain, setDomain] = useState('general')
  const [steps, setSteps] = useState([])
  const [answer, setAnswer] = useState('')
  const [audits, setAudits] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [verdicts, setVerdicts] = useState({})
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0)
  const [reasonLoading, setReasonLoading] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Event log
  const [logs, setLogs] = useState([])
  const errorCountRef = useRef(0)

  function addLog(type, message) {
    let code = null
    if (type === 'error') {
      errorCountRef.current += 1
      code = `ER-${String(errorCountRef.current).padStart(3, '0')}`
    }
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), type, message, code }].slice(-10))
  }

  const flaggedSteps = steps.filter(s => {
    const audit = audits.find(a => a.step_id === s.id)
    return audit?.flagged
  })

  async function handleSubmit(q, d) {
    setQuestion(q)
    setDomain(d)
    setSteps([])
    setAudits([])
    setVerdicts({})
    setCurrentFlagIndex(0)
    setShowStats(false)

    let reasonData
    try {
      setReasonLoading(true)
      reasonData = await postReason(q, d)
      if (!reasonData?.steps) throw new Error('Reasoner returned no steps')
      setSteps(reasonData.steps)
      setAnswer(reasonData.answer)
      setSessionId(reasonData.session_id)
      addLog('success', `Reasoner complete — ${reasonData.steps.length} steps`)
    } catch (e) {
      addLog('error', e.response?.data?.detail || e.message || 'Reasoner failed')
      setReasonLoading(false)
      return
    } finally {
      setReasonLoading(false)
    }

    try {
      setAuditLoading(true)
      const auditData = await postAudit(reasonData.session_id, reasonData.steps)
      if (!auditData?.audits) throw new Error('Auditor returned no scores')
      setAudits(auditData.audits)
      addLog('success', 'Auditor complete')
      const flaggedCount = auditData.audits.filter(a => a.flagged).length
      if (flaggedCount > 0) {
        addLog('warning', `${flaggedCount} step${flaggedCount > 1 ? 's' : ''} flagged for review`)
      }
    } catch (e) {
      addLog('error', e.response?.data?.detail || e.message || 'Auditor failed')
    } finally {
      setAuditLoading(false)
    }
  }

  async function handleVerdict(stepId, verdict) {
    try {
      await postVerdict({
        session_id: sessionId,
        step_id: stepId,
        auditor_flagged: true,
        human_verdict: verdict,
        domain,
      })
      setVerdicts(prev => ({ ...prev, [stepId]: verdict }))
      setCurrentFlagIndex(i => i + 1)
      addLog('success', `Verdict saved — Step ${stepId}: ${verdict}`)
    } catch (e) {
      addLog('error', e.response?.data?.detail || e.message || 'Verdict failed')
    }
  }

  function handleReset() {
    setQuestion('')
    setSteps([])
    setAudits([])
    setVerdicts({})
    setCurrentFlagIndex(0)
    setSessionId(null)
    setShowStats(false)
    setAnswer('')
    setLogs([])
    errorCountRef.current = 0
  }

  return (
    <div
      className={dark ? 'dark' : ''}
      style={{ minHeight: '100vh', background: 'var(--neo-bg)', color: 'var(--neo-text)', transition: 'background 0.3s ease, color 0.3s ease' }}
    >
      {/* Header */}
      <header style={{
        background: 'var(--neo-card)',
        boxShadow: '0 4px 12px var(--neo-shadow-dark)',
        padding: '0.85rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🔗</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--neo-text)', letterSpacing: '-0.01em' }}>
              FaithfulChain
            </h1>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--neo-text-muted)' }}>
              Reasoning faithfulness auditor
            </p>
          </div>
        </div>

        {/* Dark/light pill toggle */}
        <button
          onClick={() => setDark(d => !d)}
          aria-label="Toggle dark mode"
          style={{
            width: 52, height: 28, borderRadius: 14, border: 'none',
            background: 'var(--neo-bg)', cursor: 'pointer', position: 'relative',
            boxShadow: 'inset 4px 4px 8px var(--neo-shadow-dark), inset -4px -4px 8px var(--neo-shadow-light)',
            padding: 0, flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 4,
            left: dark ? 28 : 4,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--neo-accent)',
            boxShadow: '0 2px 6px var(--neo-shadow-dark)',
            transition: 'left 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, lineHeight: 1,
          }}>
            {dark ? '🌙' : '☀'}
          </span>
        </button>
      </header>

      {/* 3-column grid */}
      <div className="main-grid">
        {/* Left column: InputPanel + EventLog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <InputPanel
            onSubmit={handleSubmit}
            loading={reasonLoading || auditLoading}
          />
          <EventLog logs={logs} />
        </div>

        {/* Middle column: ChainPanel + StatsPanel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ChainPanel
            steps={steps}
            audits={audits}
            auditLoading={auditLoading}
            answer={answer}
          />
          {showStats && (
            <StatsPanel sessionId={sessionId} onReset={handleReset} />
          )}
        </div>

        {/* Right column: VerdictPanel */}
        <div>
          <VerdictPanel
            flaggedSteps={flaggedSteps}
            audits={audits}
            currentIndex={currentFlagIndex}
            onVerdict={handleVerdict}
            onComplete={() => setShowStats(true)}
          />
        </div>
      </div>
    </div>
  )
}
