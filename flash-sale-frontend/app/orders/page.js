'use client'
import { useStore } from '../../lib/useStore'
import { useAuth } from '../../lib/useAuth'
import { useState } from 'react'
import LoginModal from '../../components/LoginModal'

export default function OrdersPage() {
  const state = useStore()
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  const allOrders = state.orders || []
  const userOrders = user ? allOrders.filter(o => o.userId === user.id) : []

  const statusStyle = {
    confirmed: { color: 'var(--green)', borderColor: 'rgba(59,255,138,0.25)', bg: 'rgba(59,255,138,0.05)' },
    pending:   { color: 'var(--blue)',  borderColor: 'rgba(59,158,255,0.25)', bg: 'rgba(59,158,255,0.05)' },
    failed:    { color: 'var(--red)',   borderColor: 'rgba(255,59,59,0.25)',   bg: 'rgba(255,59,59,0.05)' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '3rem 3rem 2rem', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.18em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '20px', height: '1px', background: 'var(--accent)', display: 'inline-block' }} />
          ORDER HISTORY
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '3.5rem', letterSpacing: '0.04em' }}>
          YOUR ORDERS
        </h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
          {user ? `${userOrders.length} ORDER(S) — ${user.name.toUpperCase()}` : 'SIGN IN TO VIEW YOUR ORDERS'}
        </p>
      </div>

      <div style={{ padding: '2rem 3rem' }}>
        {!user ? (
          <EmptyState icon="?" label="NOT SIGNED IN" sub="Sign in to see your orders from SLIME DROP 001">
            <button onClick={() => setShowLogin(true)} style={{
              marginTop: '1.5rem', padding: '10px 24px',
              background: 'var(--accent)', color: '#000',
              border: 'none', fontFamily: 'var(--display)', fontSize: '1.1rem',
              letterSpacing: '0.08em', cursor: 'pointer',
            }}>SIGN IN →</button>
          </EmptyState>
        ) : userOrders.length === 0 ? (
          <EmptyState icon="0" label="NO ORDERS YET" sub="Drop 003 is coming — secure your pair when the gates open" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {userOrders.map(order => {
              const s = statusStyle[order.status] || statusStyle.pending
              return (
                <div key={order.id} style={{
                  background: 'var(--bg2)', border: '0.5px solid var(--border)',
                  padding: '1.25rem 1.5rem',
                  display: 'grid', gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center', gap: '2rem',
                  transition: 'border-color 0.15s',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      {order.id}
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 500, marginBottom: '2px' }}>
                      {order.productName}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                      SIZE UK {order.size}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.06em', textAlign: 'right' }}>
                    {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '4px 10px',
                    border: `0.5px solid ${s.borderColor}`,
                    color: s.color, background: s.bg,
                  }}>
                    {order.status}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}

function EmptyState({ icon, label, sub, children }) {
  return (
    <div style={{ padding: '5rem 0', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: '6rem', color: 'var(--bg3)', marginBottom: '1rem' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--muted2)' }}>{sub}</div>
      {children}
    </div>
  )
}