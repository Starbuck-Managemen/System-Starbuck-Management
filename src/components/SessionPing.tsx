'use client'

import { useEffect } from 'react'

export function SessionPing() {
  useEffect(() => {
    // Ping immediately on mount, then every 60 seconds
    const ping = () => {
      fetch('/api/auth/ping', { method: 'POST' }).catch(() => {})
    }
    
    ping()
    const interval = setInterval(ping, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return null
}
