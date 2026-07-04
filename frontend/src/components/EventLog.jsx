/**
 * EventLog — displays API events as a scrollable log below InputPanel.
 * Green dot = success, Amber dot = warning, Red dot = error.
 * Error codes (ER-NNN) are copyable to clipboard on click.
 * @param {{ logs: Array<{id, type, message, code}> }} props
 */

const DOT_COLOR = {
  success: 'var(--neo-success)',
  warning: 'var(--neo-warning)',
  error: 'var(--neo-danger)',
}

export default function EventLog({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div
        className="neo-raised"
        style={{ padding: '1rem 1.25rem' }}
      >
        <p style={{ fontSize: '0.7rem', color: 'var(--neo-text-muted)', margin: 0 }}>
          Event log — API events appear here
        </p>
      </div>
    )
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {})
  }

  return (
    <div className="neo-raised" style={{ padding: '1rem 1.25rem' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--neo-text-muted)', margin: '0 0 0.6rem', textTransform: 'uppercase' }}>
        Event Log
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {logs.map(entry => (
          <div
            key={entry.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem' }}
          >
            {/* Dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: DOT_COLOR[entry.type],
              flexShrink: 0, marginTop: 3,
              boxShadow: `0 0 4px ${DOT_COLOR[entry.type]}`,
            }} />
            {/* Message */}
            <span style={{ color: 'var(--neo-text)', flex: 1, lineHeight: 1.4 }}>
              {entry.message}
            </span>
            {/* Error code — clickable to copy */}
            {entry.code && (
              <button
                onClick={() => copyCode(entry.code)}
                title="Click to copy"
                style={{
                  background: 'none',
                  border: '1px solid var(--neo-danger)',
                  borderRadius: 4,
                  color: 'var(--neo-danger)',
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {entry.code}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
