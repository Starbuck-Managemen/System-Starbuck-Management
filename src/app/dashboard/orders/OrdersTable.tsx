'use client'

import { useState, Suspense, Fragment } from 'react'
import { Check, X, Clock, Upload, Type, Loader2, Save, PlusCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { processOrder, rejectOrder } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { GenerateVoucherModal } from './GenerateVoucherModal'

export function OrdersTable({ initialOrders, routers }: { initialOrders: any[], routers: any[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  
  // States for partial processing
  const [packagesToProcess, setPackagesToProcess] = useState<string[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [inputType, setInputType] = useState<'text'|'file'>('text')
  const [textInput, setTextInput] = useState("")
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [fulfillment, setFulfillment] = useState<Record<string, any>>({})
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  
  const router = useRouter()

  const handleStartProcess = (order: any) => {
    setProcessingId(order.id)
    setRejectingId(null)
    const pkgs = order.packageName.split(', ')
    setPackagesToProcess(pkgs)
    setSelectedPackage(pkgs[0] || "")
    setInputType('text')
    setTextInput("")
    setFileInput(null)
    
    // Parse existing JSON if any, otherwise check localStorage, otherwise empty
    try {
      if (order.voucherCode && order.voucherCode.startsWith('{')) {
        setFulfillment(JSON.parse(order.voucherCode))
      } else {
        const cached = localStorage.getItem(`draft_${order.id}`)
        if (cached) {
          setFulfillment(JSON.parse(cached))
        } else {
          setFulfillment({})
        }
      }
    } catch {
      setFulfillment({})
    }
  }

  const handleSavePart = async () => {
    if (inputType === 'text') {
      if (!textInput.trim()) {
        toast.error("Kode voucher tidak boleh kosong!")
        return
      }
      setFulfillment(prev => {
        const next = {
          ...prev,
          [selectedPackage]: { type: 'text', content: textInput.trim() }
        }
        if (processingId) localStorage.setItem(`draft_${processingId}`, JSON.stringify(next))
        return next
      })
      setTextInput("")
      toast.success(`Bagian ${selectedPackage} tersimpan.`)
    } else {
      if (!fileInput) {
        toast.error("Pilih file PDF terlebih dahulu!")
        return
      }
      setUploading(true)
      const formData = new FormData()
      formData.append('file', fileInput)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          setFulfillment(prev => {
            const next = {
              ...prev,
              [selectedPackage]: { type: 'file', content: data.url, filename: fileInput.name }
            }
            if (processingId) localStorage.setItem(`draft_${processingId}`, JSON.stringify(next))
            return next
          })
          setFileInput(null)
          toast.success(`File untuk ${selectedPackage} berhasil diunggah.`)
        } else {
          toast.error(data.error || "Gagal upload")
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat upload")
      } finally {
        setUploading(false)
      }
    }
  }

  const handleRemovePart = (pkg: string) => {
    const newFulfillment = { ...fulfillment }
    delete newFulfillment[pkg]
    setFulfillment(newFulfillment)
    if (processingId) localStorage.setItem(`draft_${processingId}`, JSON.stringify(newFulfillment))
  }

  const handleFinalSubmit = async (id: string) => {
    if (Object.keys(fulfillment).length < packagesToProcess.length) {
      toast.error("Masih ada paket yang belum diisi kodenya!")
      return
    }

    setSubmitting(true)
    const finalJsonString = JSON.stringify(fulfillment)
    
    try {
      const res = await processOrder(id, finalJsonString)
      if (res.success) {
        toast.success(res.message)
        localStorage.removeItem(`draft_${id}`)
        setProcessingId(null)
        setFulfillment({})
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (e) {
      toast.error("Gagal memproses pesanan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan tidak boleh kosong!")
      return
    }

    try {
      const res = await rejectOrder(id, rejectReason)
      if (res.success) {
        toast.success(res.message)
        setRejectingId(null)
        setRejectReason("")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (e) {
      toast.error("Gagal menolak pesanan.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-amber-900/40 text-amber-500 border border-amber-800/50 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Menunggu</span>
      case 'PROCESSED': return <span className="bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><Check className="w-3 h-3" /> Selesai</span>
      case 'REJECTED': return <span className="bg-red-900/40 text-red-500 border border-red-800/50 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><X className="w-3 h-3" /> Ditolak</span>
      default: return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>
    }
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

  // Group orders by user
  const groupedOrders = initialOrders.reduce((acc, order) => {
    const username = order.user?.username || 'unknown'
    if (!acc[username]) {
      acc[username] = { user: order.user, orders: [] }
    }
    acc[username].orders.push(order)
    return acc
  }, {} as Record<string, { user: any, orders: any[] }>)

  const toggleUser = (username: string) => {
    setExpandedUsers(prev => ({ ...prev, [username]: !prev[username] }))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
        <thead className="bg-[#0b1220] text-slate-400 text-xs text-left border-b border-slate-700/50">
          <tr>
            <th className="p-4 font-semibold w-[200px]">User</th>
            <th className="p-4 font-semibold">Pesanan</th>
            <th className="p-4 font-semibold w-[150px]">Tanggal</th>
            <th className="p-4 font-semibold w-[150px]">Status</th>
            <th className="p-4 font-semibold w-[450px]">Aksi / Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {initialOrders.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="text-sm font-medium">Belum ada pesanan masuk.</span>
                </div>
              </td>
            </tr>
          ) : (
            Object.values(groupedOrders).map((group: any) => (
              <Fragment key={group.user?.username || "unknown"}>
                <tr 
                  onClick={() => toggleUser(group.user?.username || "unknown")} 
                  className="cursor-pointer border-b border-slate-800 bg-[#162032] hover:bg-[#1E293B] transition-colors"
                >
                  <td className="p-4" colSpan={5}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedUsers[group.user?.username || "unknown"] ? 
                          <ChevronDown className="w-5 h-5 text-slate-400" /> : 
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        }
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200 text-sm">{group.user?.name || "Unknown"}</span>
                          <span className="text-xs text-slate-500">@{group.user?.username || "unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {group.orders.length} Pesanan
                        </span>
                        {group.orders.some((o: any) => o.status === 'PENDING') && (
                          <span className="bg-amber-900/40 text-amber-500 border border-amber-800/50 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {group.orders.filter((o: any) => o.status === 'PENDING').length} Menunggu
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {expandedUsers[group.user?.username || "unknown"] && group.orders.map((order: any, idx: number) => (
                  <tr key={order.id} className="border-b border-slate-800/50 hover:bg-[#0F172A]/50 transition-colors bg-[#0b1220]/30">
                    <td className="p-4 align-top pl-12 relative">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-700/50"></div>
                      <div className="absolute left-6 top-7 w-4 h-px bg-slate-700/50"></div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #{group.orders.length - idx}</span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1 mb-1">
                        {order.packageName.split(', ').map((pkg: string, idx: number) => (
                          <span key={idx} className="font-bold text-blue-400 text-sm leading-tight">{pkg}</span>
                        ))}
                      </div>
                      <div className="text-sm text-slate-400 font-medium">Rp {order.price}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm text-slate-300">{new Date(order.createdAt).toLocaleDateString('id-ID')}</div>
                      <div className="text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString('id-ID')}</div>
                    </td>
                    <td className="p-4 align-top">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 align-top">
                      {order.status === 'PENDING' && (
                        <div className="flex flex-col gap-2">
                          
                          {processingId === order.id ? (
                            <div className="flex flex-col bg-[#0F172A] p-4 rounded-xl border border-slate-700 w-full max-w-[450px] gap-4">
                              
                              {/* Progress Status */}
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold text-slate-400">Progres Pemrosesan:</span>
                                  <button 
                                    onClick={() => setIsGenerateModalOpen(true)}
                                    type="button"
                                    className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-colors"
                                  >
                                    <PlusCircle className="w-3 h-3" /> Buat Voucher
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {packagesToProcess.map(pkg => (
                                    <div key={pkg} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${fulfillment[pkg] ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                      {fulfillment[pkg] ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                      {pkg}
                                      {fulfillment[pkg] && (
                                        <button onClick={() => handleRemovePart(pkg)} className="ml-1 text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
    
                              <div className="h-px w-full bg-slate-800" />
    
                              {/* Input Form */}
                              <div className="flex flex-col gap-3">
                                <select 
                                  className="w-full bg-[#1E293B] border border-slate-700 h-10 px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-sm text-slate-200"
                                  value={selectedPackage}
                                  onChange={(e) => setSelectedPackage(e.target.value)}
                                >
                                  <option value="" disabled>-- Pilih Paket untuk Diisi --</option>
                                  {packagesToProcess.map(pkg => (
                                    <option key={pkg} value={pkg}>{pkg}</option>
                                  ))}
                                </select>
    
                                <div className="flex bg-[#1E293B] rounded-lg p-1">
                                  <button 
                                    onClick={() => setInputType('text')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${inputType === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                  >
                                    <Type className="w-3 h-3" /> Teks/Kode
                                  </button>
                                  <button 
                                    onClick={() => setInputType('file')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${inputType === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                  >
                                    <Upload className="w-3 h-3" /> File PDF
                                  </button>
                                </div>
    
                                {inputType === 'text' ? (
                                  <textarea 
                                    placeholder="Paste kode voucher di sini..."
                                    className="w-full bg-[#1E293B] border border-slate-700 text-sm p-3 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 min-h-[80px] resize-y"
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                  />
                                ) : (
                                  <div className="w-full bg-[#1E293B] border border-slate-700 p-3 rounded-lg text-slate-200 text-sm">
                                    <input 
                                      type="file" 
                                      accept="application/pdf"
                                      onChange={e => setFileInput(e.target.files?.[0] || null)}
                                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-blue-300 hover:file:bg-blue-800"
                                    />
                                  </div>
                                )}
    
                                <button 
                                  onClick={handleSavePart}
                                  disabled={uploading}
                                  className="w-full bg-slate-700 hover:bg-slate-600 text-white h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  Simpan Bagian Ini
                                </button>
                              </div>
    
                              <div className="h-px w-full bg-slate-800" />
    
                              {/* Final Actions */}
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setProcessingId(null)} className="text-slate-400 hover:text-slate-200 px-3 py-2 text-xs font-bold transition-colors">Batal</button>
                                <button 
                                  onClick={() => handleFinalSubmit(order.id)}
                                  disabled={submitting || Object.keys(fulfillment).length < packagesToProcess.length}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Selesaikan Pesanan
                                </button>
                              </div>
                            </div>
                          ) : rejectingId === order.id ? (
                            <div className="flex gap-2 items-center bg-[#0F172A] p-2 rounded-xl border border-slate-700">
                              <input 
                                type="text" 
                                placeholder="Alasan penolakan..."
                                className="bg-[#1E293B] border border-slate-700 text-sm h-9 px-3 rounded-lg text-slate-200 flex-1 focus:outline-none focus:border-red-500"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleReject(order.id)} className="bg-red-600 hover:bg-red-500 text-white h-9 px-3 rounded-lg text-xs font-bold transition-colors">Tolak</button>
                              <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-slate-200 p-2"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleStartProcess(order)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Proses
                              </button>
                              <button 
                                onClick={() => { setRejectingId(order.id); setProcessingId(null); setRejectReason("") }}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      )}
    
                      {order.status === 'PROCESSED' && (
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const parsed = parseVoucherCode(order.voucherCode)
                            if (typeof parsed === 'object' && parsed !== null) {
                              return Object.keys(parsed).map(pkg => (
                                <div key={pkg} className="flex flex-col bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/30">
                                  <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold mb-1">{pkg}</span>
                                  {parsed[pkg].type === 'text' ? (
                                    <pre className="font-mono text-slate-300 font-bold whitespace-pre-wrap text-sm">{parsed[pkg].content}</pre>
                                  ) : (
                                    <a href={parsed[pkg].content} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-max flex items-center gap-2">
                                      <Upload className="w-3 h-3" />
                                      Unduh PDF ({parsed[pkg].filename})
                                    </a>
                                  )}
                                </div>
                              ))
                            } else {
                              return (
                                <div className="flex flex-col bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/30">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">KODE VOUCHER</span>
                                  <pre className="font-mono text-emerald-400 font-bold whitespace-pre-wrap text-sm">{parsed}</pre>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      )}
    
                      {order.status === 'REJECTED' && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">ALASAN</span>
                          <span className="text-red-400 text-xs font-medium">{order.notes}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))
          )}
        </tbody>
      </table>

      {isGenerateModalOpen && (
        <Suspense fallback={null}>
          <GenerateVoucherModal 
            isOpen={isGenerateModalOpen} 
            onClose={() => setIsGenerateModalOpen(false)} 
            routers={routers} 
          />
        </Suspense>
      )}
    </div>
  )
}
