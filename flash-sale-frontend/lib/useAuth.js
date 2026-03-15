'use client'
import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('slime_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  function login(name) {
    const u = {
      id: 'user_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).slice(2, 6),
      name,
    }
    sessionStorage.setItem('slime_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  function logout() {
    sessionStorage.removeItem('slime_user')
    setUser(null)
  }

  return { user, login, logout }
}