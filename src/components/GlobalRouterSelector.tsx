'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Router {
  id: string
  name: string
  host: string
}

export function GlobalRouterSelector({ 
  routers, 
  selectedId 
}: { 
  routers: Router[]
  selectedId: string | null 
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsPending(true)
    const val = e.target.value
    
    if (val) {
      document.cookie = `superadmin_router_id=${val}; path=/; max-age=31536000`
    } else {
      document.cookie = `superadmin_router_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }

    // Refresh current route and fetch new data from server
    router.refresh()
    
    // Reset loading state after a short delay to allow refresh to finish
    setTimeout(() => {
      setIsPending(false)
    }, 1000)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400 font-medium whitespace-nowrap">
        Pilih Router:
      </label>
      <select
        value={selectedId || ""}
        onChange={handleChange}
        disabled={isPending}
        className="bg-[#0f172a] border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[200px]"
      >
        <option value="">-- Semua / Tidak Dipilih --</option>
        {routers.map(r => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.host})
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-xs text-blue-400 animate-pulse">Memuat...</span>
      )}
    </div>
  )
}
