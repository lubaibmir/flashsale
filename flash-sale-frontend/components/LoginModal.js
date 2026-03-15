'use client'
import { useState } from 'react'
import { useAuth } from '../lib/useAuth'

export default function LoginModal({ onClose }) {
  const [name, setName] = useState('')
  const { login } = useAuth()

  function handle() {
    if (!name.trim()) return
    login(name.trim())
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border-hi)',
        padding: '2.5rem', width: '360px',
        animation: 'slide-in-up 0.2s ease',
      }}>
        <button onClick={onClose} style={{
          float: 'right', background: 'none', border: 'none',
          color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '0.6rem',
          cursor: 'pointer', letterSpacing: '0.1em', marginBottom: '0.5rem',
        }}>✕ CLOSE</button>
        <div style={{ clear: 'both' }}/>
        <div style={{ fontFamily: 'var(--display)', fontSize: '2.5rem', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
          ACCESS
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2rem' }}>
          ENTER A NAME TO JOIN THE DROP
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="Your name"
          style={{
            width: '100%', background: 'var(--bg3)',
            border: '0.5px solid var(--border)',
            color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem',
            padding: '10px 14px', outline: 'none', marginBottom: '12px',
            letterSpacing: '0.06em',
          }}
        />
        <button onClick={handle} style={{
          width: '100%', padding: '12px',
          background: 'var(--accent)', color: '#000', border: 'none',
          fontFamily: 'var(--display)', fontSize: '1.4rem', letterSpacing: '0.08em',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}>
          ENTER →
        </button>
        <p style={{ marginTop: '1rem', fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted2)', textAlign: 'center', letterSpacing: '0.08em' }}>
          No password required — just pick a name
        </p>
      </div>
    </div>
  )
}