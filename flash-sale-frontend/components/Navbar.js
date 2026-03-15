'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '../lib/useAuth'
import LoginModal from './LoginModal'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  const links = [
    { href: '/drop', label: 'Drop' },
    { href: '/orders', label: 'Orders' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '0.5px solid var(--border)',
      }}>
        {/* Logo */}
        <Link href="/drop" style={{
          fontFamily: 'var(--display)', fontSize: '1.7rem',
          color: 'var(--accent)', letterSpacing: '0.06em',
          textDecoration: 'none',
        }}>
          SLIME GATE
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 0 }}>
          {links.map(l => {
            const active = pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} style={{
                fontFamily: 'var(--mono)', fontSize: '0.65rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: active ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
                padding: '0 1.25rem', height: '52px',
                display: 'flex', alignItems: 'center',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}>
                {l.label}
                {l.href === '/admin' && (
                  <span style={{
                    marginLeft: '6px', background: 'var(--red)',
                    color: '#000', fontSize: '0.5rem', fontWeight: 700,
                    padding: '1px 5px', letterSpacing: '0.08em',
                  }}>LIVE</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '0.6rem',
              color: 'var(--muted)', letterSpacing: '0.1em',
            }}>
              {user.name.toUpperCase()}
            </span>
          )}
          <button
            onClick={() => user ? logout() : setShowLogin(true)}
            style={{
              fontFamily: 'var(--mono)', fontSize: '0.6rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: user ? 'none' : 'var(--accent)',
              color: user ? 'var(--muted)' : '#000',
              border: user ? '0.5px solid var(--border)' : 'none',
              padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {user ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}