/**
 * InputPanel — question textarea, domain dropdown, and submit button.
 * @param {{ onSubmit: (question: string, domain: string) => void, loading: boolean }} props
 */

import { useState } from 'react'

const EXAMPLES = {
  general: 'Why does the sky appear blue during the day but red at sunset?',
  medical: 'A patient presents with chest pain radiating to the left arm, diaphoresis, and shortness of breath. What is the most likely diagnosis and immediate management?',
  legal: 'Can a landlord enter a tenant\'s apartment without notice in California? What are the legal exceptions?',
  math: 'Prove that the square root of 2 is irrational.',
}

export default function InputPanel({ onSubmit, loading }) {
  const [question, setQuestion] = useState('')
  const [domain, setDomain] = useState('general')

  function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim() || loading) return
    onSubmit(question.trim(), domain)
  }

  return (
    <div className="neo-raised" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--neo-text)' }}>
        Ask a Question
      </h2>

      {/* Domain dropdown */}
      <div style={{ position: 'relative' }}>
        <select
          value={domain}
          onChange={e => setDomain(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--neo-bg)',
            color: 'var(--neo-text)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 36px 10px 14px',
            fontSize: '0.875rem',
            boxShadow: 'inset 4px 4px 10px var(--neo-shadow-dark), inset -4px -4px 10px var(--neo-shadow-light)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="general">General</option>
          <option value="medical">Medical</option>
          <option value="legal">Legal</option>
          <option value="math">Math</option>
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--neo-text-muted)', fontSize: '0.75rem',
        }}>▾</span>
      </div>

      {/* Example loader */}
      <button
        type="button"
        onClick={() => setQuestion(EXAMPLES[domain])}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--neo-accent)', fontSize: '0.75rem', padding: 0,
          textAlign: 'left', textDecoration: 'underline', textDecorationStyle: 'dotted',
        }}
      >
        Load example for {domain}
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Textarea */}
        <div style={{ position: 'relative' }}>
          <textarea
            rows={5}
            maxLength={500}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here…"
            style={{
              width: '100%',
              background: 'var(--neo-bg)',
              color: 'var(--neo-text)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 14px 28px',
              fontSize: '0.875rem',
              resize: 'none',
              outline: 'none',
              boxShadow: 'inset 4px 4px 10px var(--neo-shadow-dark), inset -4px -4px 10px var(--neo-shadow-light)',
            }}
          />
          <span style={{
            position: 'absolute', bottom: 8, right: 12,
            fontSize: '0.7rem', color: 'var(--neo-text-muted)',
          }}>
            {question.length}/500
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="neo-btn-accent"
          style={{
            alignSelf: 'flex-end',
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {loading ? 'Analysing…' : 'Analyse'}
        </button>
      </form>
    </div>
  )
}
