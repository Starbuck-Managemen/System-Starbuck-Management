'use client'

import { useState, useEffect } from 'react'

export function Clock({ loginTime }: { loginTime?: number }) {
  const [uptime, setUptime] = useState<string>("00:00:00")

  useEffect(() => {
    if (!loginTime) {
      // Fallback jika tidak ada loginTime
      const updateClock = () => {
        const now = new Date()
        const formattedTime = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\./g, ':')
        setUptime(formattedTime)
      }
      updateClock()
      const interval = setInterval(updateClock, 1000)
      return () => clearInterval(interval)
    }

    const updateUptime = () => {
      const now = Date.now();
      const diff = Math.floor((now - loginTime) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      setUptime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }
    
    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [loginTime]);

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <span className="flex items-center gap-2"><span className="text-slate-400 font-normal">Uptime:</span> 00:00:00</span>

  return <span className="flex items-center gap-2"><span className="text-slate-400 font-normal">{loginTime ? 'Uptime:' : 'Waktu:'}</span> {uptime}</span>
}
