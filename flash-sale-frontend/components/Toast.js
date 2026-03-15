export default function Toast({ msg, type = 'info' }) {
  const colors = {
    success: { border: 'rgba(59,255,138,0.4)', color: 'var(--green)' },
    error:   { border: 'rgba(255,59,59,0.4)', color: 'var(--red)' },
    info:    { border: 'rgba(59,158,255,0.35)', color: 'var(--blue)' },
  }[type] || {}

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg2)',
      border: `0.5px solid ${colors.border}`,
      color: colors.color,
      padding: '10px 20px',
      fontFamily: 'var(--mono)', fontSize: '0.65rem',
      letterSpacing: '0.08em', whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  )
}