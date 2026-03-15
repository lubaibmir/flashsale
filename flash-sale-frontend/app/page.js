'use client'
// Triggering rebuild for Axiom theme
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../lib/useStore'
import { useAuth } from '../lib/useAuth'
import { checkout, checkDropLive, initDrop } from '../lib/store'
import LoginModal from '../components/LoginModal'
import ShoeSVG from '../components/ShoeSVG'
import Toast from '../components/Toast'

const SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12]

export default function DropPage() {
  const state = useStore()
  const { user } = useAuth()
  const [selectedSize, setSelectedSize] = useState(null)
  const [checkoutState, setCheckoutState] = useState('idle') // idle | queued | success | sold_out | failed
  const [queuePos, setQueuePos] = useState(0)
  const [toasts, setToasts] = useState([])
  const [showLogin, setShowLogin] = useState(false)
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' })
  const [isLive, setIsLive] = useState(false)

  // Init drop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('slime_drop_time')
      if (!saved || parseInt(saved) <= Date.now()) {
        initDrop(2)
        sessionStorage.setItem('slime_drop_time', Date.now() + 2 * 60 * 1000)
      }
    }
  }, [])

  // Countdown
  useEffect(() => {
    const tick = setInterval(() => {
      const live = checkDropLive()
      setIsLive(live)
      if (!state.dropTime) return
      const diff = state.dropTime - Date.now()
      if (diff <= 0) {
        setCountdown({ h: '00', m: '00', s: '00' })
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }, 500)
    return () => clearInterval(tick)
  }, [state.dropTime])

  // Watch for state.isLive
  useEffect(() => {
    if (state.isLive && !isLive) {
      setIsLive(true)
      addToast('DROP IS LIVE — GET IT NOW!', 'success')
    }
  }, [state.isLive])

  function addToast(msg, type = 'info') {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }

  async function handleCheckout() {
    if (!user) { setShowLogin(true); return }
    if (!state.isLive) { addToast('Drop not started yet!', 'error'); return }
    if (!selectedSize) { addToast('Select a size first', 'error'); return }
    if (checkoutState === 'queued') return
    if (checkoutState === 'success') { addToast('You already have an order!', 'error'); return }

    const pos = (state.queueDepth || 0) + 1
    setQueuePos(pos)
    setCheckoutState('queued')

    const result = await checkout(user.id, user.name, selectedSize)

    switch (result.status) {
      case 'success':
        setCheckoutState('success')
        addToast(`ORDER CONFIRMED — UK ${selectedSize} IS YOURS`, 'success')
        break
      case 'sold_out':
        setCheckoutState('sold_out')
        addToast('SOLD OUT — too slow!', 'error')
        break
      case 'payment_failed':
        setCheckoutState('failed')
        addToast('Payment failed — inventory released. Retry?', 'error')
        break
      case 'duplicate':
        setCheckoutState('success')
        addToast('You already have an active order', 'error')
        break
      default:
        setCheckoutState('idle')
    }
  }

  const inv = state.inventory ?? 50
  const total = state.totalInventory ?? 50
  const invPct = Math.max(0, (inv / total) * 100)
  const invColor = invPct > 50 ? 'var(--accent)' : invPct > 20 ? 'var(--orange)' : 'var(--red)'

  const btnConfig = {
    idle: { label: isLive ? 'CHECKOUT NOW' : 'WAITING FOR DROP', bg: isLive ? 'var(--accent)' : 'var(--bg4)', color: isLive ? '#000' : 'var(--muted2)', disabled: !isLive || !selectedSize },
    queued: { label: `QUEUED — #${queuePos}`, bg: 'var(--blue)', color: '#000', disabled: true },
    success: { label: '✓ ORDER CONFIRMED', bg: 'var(--green)', color: '#000', disabled: true },
    sold_out: { label: 'SOLD OUT', bg: 'var(--red)', color: '#fff', disabled: true },
    failed: { label: 'RETRY CHECKOUT', bg: 'var(--accent)', color: '#000', disabled: false },
  }[checkoutState] || {}

  return (
    <>
      {/* Ticker */}
      <div style={{ background: 'var(--accent)', overflow: 'hidden', height: '28px', display: 'flex', alignItems: 'center' }}>
        <div className="animate-ticker" style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', fontWeight: 700, color: '#000', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
          {'DROP 001 — SLIME COURT V1 — RADIOACTIVE IMPACT — ONLY 50 PAIRS — LIMITED RELEASE — SLIME OR DIE — '.repeat(4)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', minHeight: 'calc(100vh - 80px)' }}>
        {/* LEFT: Visual */}
        <div style={{
          position: 'relative', background: 'var(--bg2)',
          borderRight: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div className="grid-overlay" style={{ position: 'absolute', inset: 0 }} />
          {/* Corner labels */}
          <Corner pos="tl">SLIME-001<br />V1-2026</Corner>
          <Corner pos="tr">{isLive ? <LiveBadge /> : 'UPCOMING'}</Corner>
          <Corner pos="bl">RADIOACTIVE / INK<br />COLOURWAY</Corner>
          <Corner pos="br">STOCK <span style={{ color: 'var(--accent)' }}>{inv}</span></Corner>

          {/* Shoe */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="animate-float">
              <img src="/slime_drop.png" alt="Slime Court V1" style={{ width: '480px', height: 'auto', filter: 'drop-shadow(0 0 30px rgba(212,255,30,0.3))' }} />
            </div>
            {/* Glow */}
            <div className="animate-glow" style={{
              position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '280px', height: '40px',
              background: 'radial-gradient(ellipse, rgba(212,255,30,0.2) 0%, transparent 70%)',
            }} />
          </div>
        </div>

        {/* RIGHT: Panel */}
        <div style={{
          background: 'var(--bg)',
          borderLeft: '0.5px solid var(--border)',
          padding: '3rem 2.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          overflowY: 'auto',
        }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--accent)', display: 'inline-block' }} />
            {isLive ? 'Live Now' : 'Upcoming Drop'}
          </div>

          {/* Title */}
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '5.5rem', lineHeight: 0.88, letterSpacing: '0.02em' }}>
              SLIME<br />
              COURT <span style={{ color: 'var(--accent)' }}>V1</span>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
            {[
              ['Price', '₹24,999', 'var(--accent)'],
              ['Colorway', 'Radioactive', null],
              ['Total Pairs', '50', null],
              ['Remaining', inv, inv < 10 ? 'var(--red)' : 'var(--text)'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: 'var(--bg2)', padding: '1rem', border: '0.5px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1rem', color: color || 'var(--text)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)', lineHeight: 1.6, letterSpacing: '0.04em', background: 'rgba(212,255,30,0.03)', padding: '1rem', borderLeft: '2px solid var(--accent)' }}>
            THE SLIME COURT V1 REPRESENTS THE PEAK OF REACTIVE DESIGN. FEATURING GLOW-IN-THE-DARK TRACTION AND IMPACT-ENGINEERED MESH FOR MAXIMUM AGILITY IN HIGH-STAKES PERFORMANCE.
          </div>

          {/* Countdown */}
          {!isLive && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Drop In</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
                {[countdown.h, countdown.m, countdown.s].map((val, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    {i > 0 && <span style={{ fontFamily: 'var(--display)', fontSize: '3.5rem', color: 'var(--border-hi)', padding: '0 4px' }}>:</span>}
                    <span>
                      <span style={{ fontFamily: 'var(--display)', fontSize: '3.5rem', background: 'var(--bg2)', padding: '6px 16px', border: '0.5px solid var(--border)', display: 'block', minWidth: '72px', textAlign: 'center' }}>{val}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.12em', marginTop: '5px', display: 'block', textAlign: 'center' }}>
                        {['HRS', 'MIN', 'SEC'][i]}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inventory bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Inventory</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: invColor }}>{Math.round(invPct)}%</span>
            </div>
            <div style={{ height: '3px', background: 'var(--bg3)' }}>
              <div style={{ height: '100%', background: invColor, width: invPct + '%', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Select Size (UK)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    width: '52px', height: '36px',
                    background: selectedSize === s ? 'var(--accent)' : 'none',
                    border: `0.5px solid ${selectedSize === s ? 'var(--accent)' : 'var(--border)'}`,
                    color: selectedSize === s ? '#000' : 'var(--muted)',
                    fontFamily: 'var(--mono)', fontSize: '0.65rem',
                    cursor: 'pointer', transition: 'all 0.12s',
                    fontWeight: selectedSize === s ? 700 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={handleCheckout}
              disabled={btnConfig.disabled}
              style={{
                width: '100%', padding: '1.1rem',
                background: btnConfig.bg, color: btnConfig.color,
                border: 'none', fontFamily: 'var(--display)', fontSize: '1.6rem',
                letterSpacing: '0.08em', cursor: btnConfig.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', opacity: btnConfig.disabled && checkoutState === 'idle' ? 0.4 : 1,
              }}
            >
              {btnConfig.label}
            </button>

            {/* Queue processing indicator */}
            {checkoutState === 'queued' && (
              <div style={{ marginTop: '12px', padding: '1rem', background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--blue)' }}>#{queuePos} IN QUEUE</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>processing...</span>
                </div>
                <div style={{ height: '2px', background: 'var(--bg3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--blue)', animation: 'progress-fill 2s ease forwards' }} />
                </div>
              </div>
            )}

            {!user && (
              <p style={{ marginTop: '10px', fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted2)', textAlign: 'center', letterSpacing: '0.1em' }}>
                SIGN IN TO PARTICIPATE →
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 300, pointerEvents: 'none', alignItems: 'center' }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}

function Corner({ pos, children }) {
  const styles = {
    tl: { top: '1.5rem', left: '1.5rem' },
    tr: { top: '1.5rem', right: '1.5rem' },
    bl: { bottom: '1.5rem', left: '1.5rem' },
    br: { bottom: '1.5rem', right: '1.5rem', textAlign: 'right' },
  }
  return (
    <div style={{ position: 'absolute', fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted2)', letterSpacing: '0.1em', lineHeight: 1.7, ...styles[pos] }}>
      {children}
    </div>
  )
}

function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--red)', letterSpacing: '0.12em' }}>
      <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
      LIVE
    </span>
  )
}