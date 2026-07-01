'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function ForceLogout({ message }: { message: string }) {
  useEffect(() => {
    toast.error(message, { duration: 5000 })
    const timeout = setTimeout(() => {
      signOut({ callbackUrl: '/login' })
    }, 2000)
    
    return () => clearTimeout(timeout)
  }, [message])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0F172A] flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-slate-300 font-medium animate-pulse">Memproses sesi...</p>
    </div>
  )
}
