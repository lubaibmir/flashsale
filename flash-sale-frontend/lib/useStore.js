'use client'
import { useEffect, useState } from 'react'
import { getState, subscribe } from './store'

export function useStore() {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return {}
    return getState()
  })

  useEffect(() => {
    setState(getState())
    const unsub = subscribe(newState => setState({ ...newState }))
    return unsub
  }, [])

  return state
}