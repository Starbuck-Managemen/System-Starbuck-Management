'use client'

import { Clock, CheckCircle2, XCircle, Copy, Check, Upload } from "lucide-react"
import { useState } from "react"

export function OrderHistory({ orders }: { orders: any[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const parseVoucherCode = (code: string | null) => {
    if (!code) return null
    try {
      if (code.startsWith('{')) {
        return JSON.parse(code)
      }
      return code // fallback if old string format
    } catch {
      return code
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-amber-500" />
      case 'PROCESSED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="text-amber-500 font-medium text-xs">Menunggu Proses</span>
      case 'PROCESSED': return <span className="text-emerald-500 font-medium text-xs">Selesai</span>
      case 'REJECTED': return <span className="text-red-500 font-medium text-xs">Ditolak</span>
      default: return <span className="text-slate-500 font-medium text-xs">{status}</span>
    }
  }

  return (
    <div className="bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-800 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-bold text-slate-100 mb-6">Riwayat Pesanan</h2>
      
      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
          <Clock className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm">Anda belum pernah membuat pesanan.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {orders.map(order => (
            <div 
              key={order.id} 
              className={`bg-[#0F172A] border border-slate-700 rounded-xl flex flex-col transition-all cursor-pointer hover:border-slate-500 overflow-hidden ${expandedId === order.id ? 'ring-1 ring-slate-500' : ''}`}
              onClick={() => toggleExpand(order.id)}
            >
              
              <div className="flex justify-between items-center p-4">
                <div>
                  <div className="flex flex-col gap-0.5 mb-1">
                    <span className="font-bold text-slate-200 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {order.packageName.split(', ').length > 2 
                      ? `${order.packageName.split(', ').slice(0, 2).join(', ')} ...` 
                      : order.packageName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-full border border-slate-700/50">
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
              </div>

              {/* Collapsible Content */}
              {expandedId === order.id && (
                <div 
                  className="px-4 pb-4 border-t border-slate-800/50 pt-3 cursor-default"
                  onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking inside
                >
                  <p className="text-xs text-slate-500 font-medium mb-3">Detail Paket: {order.packageName}</p>
                  
                  {order.status === 'PROCESSED' && order.voucherCode && (
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const parsed = parseVoucherCode(order.voucherCode)
                        if (typeof parsed === 'object' && parsed !== null) {
                          return Object.keys(parsed).map(pkg => (
                            <div key={pkg} className="bg-emerald-900/20 border border-emerald-900/50 rounded-lg p-3 flex flex-col gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">{pkg}</span>
                              {parsed[pkg].type === 'text' ? (
                                <div className="flex justify-between items-start gap-4">
                                  <pre className="font-mono text-sm font-bold text-slate-100 tracking-wider whitespace-pre-wrap leading-relaxed flex-1">{parsed[pkg].content}</pre>
                                  <button 
                                    onClick={() => handleCopy(parsed[pkg].content, `${order.id}-${pkg}`)}
                                    className="h-8 w-8 shrink-0 rounded-md bg-emerald-900/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-900/60 transition-colors"
                                    title="Salin Kode"
                                  >
                                    {copiedId === `${order.id}-${pkg}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              ) : (
                                <a href={parsed[pkg].content} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-2 rounded-lg text-xs font-bold transition-colors w-max flex items-center gap-2">
                                  <Upload className="w-4 h-4" />
                                  Unduh File PDF ({parsed[pkg].filename})
                                </a>
                              )}
                            </div>
                          ))
                        } else {
                          return (
                            <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-lg p-3 flex justify-between items-start gap-4">
                              <div className="flex flex-col flex-1">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mb-2">KODE VOUCHER</span>
                                <pre className="font-mono text-sm font-bold text-slate-100 tracking-wider whitespace-pre-wrap leading-relaxed">{parsed}</pre>
                              </div>
                              <button 
                                onClick={() => handleCopy(parsed as string, order.id)}
                                className="h-8 w-8 shrink-0 rounded-md bg-emerald-900/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-900/60 transition-colors"
                                title="Salin Kode"
                              >
                                {copiedId === order.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  )}

                  {order.status === 'REJECTED' && order.notes && (
                    <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3">
                      <span className="text-xs text-red-400 font-medium">Alasan: {order.notes}</span>
                    </div>
                  )}
                  
                  {order.status === 'PENDING' && (
                    <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                      <span className="text-xs text-amber-500 font-medium">Pesanan Anda sedang dalam antrean dan akan segera diproses oleh Admin.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
