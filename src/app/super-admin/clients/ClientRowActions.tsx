"use client"

import { CheckCircle, XCircle, Infinity as InfinityIcon } from "lucide-react"
import { extendSubscription, banClient, extendForever } from "./actions"
import { toast } from "sonner"
import { useTransition } from "react"

export default function ClientRowActions({ clientId, status }: { clientId: string, status: string }) {
  const [isPending, startTransition] = useTransition()

  const handleExtend = () => {
    if (confirm("Perpanjang langganan klien ini selama 30 hari?")) {
      startTransition(async () => {
        try {
          await extendSubscription(clientId, 30)
          toast.success("Masa aktif klien berhasil diperpanjang!")
        } catch (error: any) {
          toast.error(error.message || "Gagal memperpanjang langganan")
        }
      })
    }
  }

  const handleForever = () => {
    if (confirm("Aktifkan klien ini selamanya (Lifetime)?")) {
      startTransition(async () => {
        try {
          await extendForever(clientId)
          toast.success("Klien kini aktif selamanya!")
        } catch (error: any) {
          toast.error(error.message || "Gagal mengaktifkan selamanya")
        }
      })
    }
  }

  const handleBan = () => {
    if (confirm("Anda yakin ingin memblokir/banned klien ini?")) {
      startTransition(async () => {
        try {
          await banClient(clientId)
          toast.success("Klien berhasil diblokir!")
        } catch (error: any) {
          toast.error(error.message || "Gagal memblokir klien")
        }
      })
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button 
        onClick={handleExtend}
        disabled={isPending}
        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50" 
        title="Perpanjang Langganan (30 Hari)"
      >
        <CheckCircle className="w-4 h-4" />
      </button>

      <button 
        onClick={handleForever}
        disabled={isPending}
        className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50" 
        title="Aktifkan Selamanya (Lifetime)"
      >
        <InfinityIcon className="w-4 h-4" />
      </button>
      
      {status !== 'Banned' && (
        <button 
          onClick={handleBan}
          disabled={isPending}
          className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50" 
          title="Blokir/Banned"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
