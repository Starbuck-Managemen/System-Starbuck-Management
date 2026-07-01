"use client"

import { useState, useEffect } from "react"
import { Bot, Loader2, CheckCircle2, XCircle, AlertCircle, X } from "lucide-react"

export function AutoReminderPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (result) {
      // Auto-hide after 5 seconds
      timer = setTimeout(() => {
        setResult(null)
      }, 5000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [result])

  const handleRunCron = async (isTest: boolean) => {
    setIsLoading(true)
    setResult(null)
    
    try {
      // Panggil API Cron kita
      const res = await fetch(`/api/cron/wa-reminder${isTest ? "?test=true" : ""}`)
      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm mb-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-500" />
            Auto-Reminder WhatsApp
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sistem patroli otomatis untuk mengirim pesan ke pelanggan yang masa aktifnya kurang dari 2 hari. 
            Gunakan tombol ini untuk memicu patroli secara manual atau untuk keperluan testing.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => handleRunCron(true)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm disabled:opacity-50"
          >
            Mode Testing
          </button>
          <button
            onClick={() => handleRunCron(false)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Bot className="w-4 h-4 shrink-0" />}
            Jalankan Patroli WA
          </button>
        </div>
      </div>

      {result && (
        <div className={`mt-2 p-4 rounded-lg border text-sm relative ${result.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <button 
            onClick={() => setResult(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          {result.success ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                {result.message}
              </div>
              <div className="flex gap-6 text-slate-300">
                <span>Total Diperiksa: <strong className="text-white">{result.stats?.totalChecked}</strong></span>
                <span>Berhasil Dikirim: <strong className="text-emerald-400">{result.stats?.totalSent}</strong></span>
                <span>Gagal: <strong className="text-rose-400">{result.stats?.totalFailed}</strong></span>
              </div>
              
              {result.logs && result.logs.length > 0 && (
                <div className="mt-2 pt-3 border-t border-emerald-500/10">
                  <p className="font-semibold text-slate-400 mb-2 text-xs uppercase tracking-wider">Log Eksekusi:</p>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300 h-24 overflow-y-auto">
                    {result.logs.map((log: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500/50">{">"}</span> {log}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 font-semibold text-rose-500">
              <XCircle className="w-4 h-4" />
              Gagal: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
