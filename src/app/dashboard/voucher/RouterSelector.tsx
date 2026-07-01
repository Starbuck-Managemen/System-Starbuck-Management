"use client"

import { useRouter } from "next/navigation"

export function RouterSelector({ routers, selectedRouterId }: { routers: any[], selectedRouterId: string | null }) {
  const router = useRouter()

  return (
    <select 
      name="routerId" 
      defaultValue={selectedRouterId || ""}
      onChange={(e) => {
        router.push(`/dashboard/voucher?routerId=${e.target.value}`)
      }}
      className="bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {routers.map(r => (
        <option key={r.id} value={r.id}>{r.name} ({r.host})</option>
      ))}
    </select>
  )
}
