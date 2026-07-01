"use client"

import { useEffect, useState } from "react"
import { checkRouterStatus } from "./actions"
import { Loader2, Wifi, WifiOff, AlertTriangle } from "lucide-react"

export function LiveRouterStatus({ routerId, initialStatus }: { routerId: string, initialStatus: string }) {
  const [status, setStatus] = useState<string>(initialStatus)
  const [ping, setPing] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true;
    
    async function fetchStatus() {
      setIsLoading(true)
      try {
        const result = await checkRouterStatus(routerId)
        if (isMounted) {
          setStatus(result.status)
          setPing(result.ping)
        }
      } catch (err) {
        if (isMounted) setStatus("Offline")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchStatus()
    
    // Check every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, [routerId])

  let config = {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500/20",
    icon: <Loader2 className="w-3 h-3 animate-spin" />
  }

  if (!isLoading) {
    if (status === "Online") {
      config = {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
        icon: <Wifi className="w-3 h-3" />
      }
    } else if (status === "Buruk") {
      config = {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/20",
        icon: <AlertTriangle className="w-3 h-3" />
      }
    } else {
      config = {
        bg: "bg-rose-500/10",
        text: "text-rose-500",
        border: "border-rose-500/20",
        icon: <WifiOff className="w-3 h-3" />
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {isLoading ? "Checking..." : status}
      </span>
      {!isLoading && ping !== null && status !== "Offline" && (
        <span className="text-[10px] text-slate-500 font-mono">
          {ping}ms
        </span>
      )}
    </div>
  )
}
