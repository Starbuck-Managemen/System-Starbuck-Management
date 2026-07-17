'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Link as LinkIcon, CheckCircle2, AlertCircle, Clock, CalendarDays, RefreshCw, CreditCard } from 'lucide-react'
import type { BillingItem } from './actions'
import { saveBillingItems, extendDueDate, togglePaidStatus } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function BillingClient({ initialItems }: { initialItems: BillingItem[] }) {
  const [items, setItems] = useState<BillingItem[]>(Array.isArray(initialItems) ? initialItems : [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<BillingItem>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleOpenModal = (item?: BillingItem) => {
    if (item) {
      setFormData(item)
      setEditingId(item.id)
    } else {
      setFormData({
        name: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        cycle: 'MONTHLY',
        website: '',
        notes: '',
        isPaid: false
      })
      setEditingId(null)
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let newItems = [...items]
    if (editingId) {
      newItems = newItems.map(i => i.id === editingId ? { ...i, ...formData } as BillingItem : i)
    } else {
      newItems.push({
        ...(formData as BillingItem),
        id: Math.random().toString(36).substring(2, 9),
        isPaid: false
      })
    }

    const res = await saveBillingItems(newItems)
    if (res.success) {
      toast.success("Data tagihan berhasil disimpan!")
      setItems(newItems)
      setIsModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || "Gagal menyimpan data")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengingat tagihan ini?")) return
    const newItems = items.filter(i => i.id !== id)
    const res = await saveBillingItems(newItems)
    if (res.success) {
      toast.success("Berhasil dihapus")
      setItems(newItems)
    } else {
      toast.error("Gagal menghapus")
    }
  }

  const handleExtend = async (id: string) => {
    if (!confirm("Perpanjang tagihan ini ke siklus berikutnya?")) return
    const res = await extendDueDate(id)
    if (res.success) {
      toast.success("Berhasil diperpanjang!")
      router.refresh()
      window.location.reload()
    } else {
      toast.error("Gagal memperpanjang")
    }
  }

  const handleTogglePaid = async (id: string, isPaid: boolean) => {
    const res = await togglePaidStatus(id, isPaid)
    if (res.success) {
      toast.success(isPaid ? "Ditandai sudah dibayar" : "Ditandai belum dibayar")
      setItems(items.map(i => i.id === id ? { ...i, isPaid } : i))
    } else {
      toast.error("Gagal update status")
    }
  }

  const getStatusInfo = (item: BillingItem) => {
    if (item.isPaid) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-800', text: 'Sudah Dibayar', icon: CheckCircle2 }
    
    if (!item.dueDate) return { color: 'text-slate-400', bg: 'bg-slate-900/30', border: 'border-slate-800', text: 'Tdk Valid', icon: AlertCircle }

    const due = new Date(item.dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (isNaN(diffDays)) return { color: 'text-slate-400', bg: 'bg-slate-900/30', border: 'border-slate-800', text: 'Tdk Valid', icon: AlertCircle }
    if (diffDays < 0) return { color: 'text-red-500', bg: 'bg-red-900/30', border: 'border-red-800', text: `Telat ${Math.abs(diffDays)} Hari`, icon: AlertCircle }
    if (diffDays <= 7) return { color: 'text-amber-500', bg: 'bg-amber-900/30', border: 'border-amber-800', text: `H-${diffDays} Jatuh Tempo`, icon: Clock }
    return { color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-800', text: 'Aman', icon: CheckCircle2 }
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Actions */}
      <div className="flex justify-end">
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus className="h-[18px] w-[18px]" /> Tambah Tagihan
        </button>
      </div>

      {/* Grid of Bills */}
      {items.length === 0 ? (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
          <CreditCard className="h-12 w-12 text-slate-600" />
          <p>Belum ada tagihan yang dicatat.<br/>Klik Tambah Tagihan untuk mulai memonitor layanan Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const status = getStatusInfo(item)
            const Icon = status.icon
            
            return (
              <div key={item.id} className="bg-[#1E293B] rounded-2xl border border-slate-700/50 p-5 flex flex-col relative overflow-hidden group hover:border-slate-600 transition-colors">
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-blue-600 hover:text-white transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-red-600 hover:text-white transition-colors" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`w-max px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 mb-4 ${status.bg} ${status.color} ${status.border}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {status.text}
                </div>

                {/* Info */}
                <h3 className="font-bold text-slate-200 text-lg">{item.name}</h3>
                <div className="text-xl font-black text-white mt-1 mb-4">
                  Rp {new Intl.NumberFormat('id-ID').format(item.amount)}
                  <span className="text-sm font-medium text-slate-500 ml-1">/{item.cycle === 'MONTHLY' ? 'bln' : 'thn'}</span>
                </div>

                <div className="flex flex-col gap-2 mt-auto text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                    <span>Jatuh Tempo: <strong className="text-slate-300">{item.dueDate && !isNaN(new Date(item.dueDate).getTime()) ? new Date(item.dueDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</strong></span>
                  </div>
                  {item.website && typeof item.website === 'string' && (
                    <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 w-max">
                      <LinkIcon className="w-4 h-4" />
                      <span>Buka Website Provider</span>
                    </a>
                  )}
                  {item.notes && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      {item.notes}
                    </div>
                  )}
                </div>
                
                <div className="h-px w-full bg-slate-800 my-4" />
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleTogglePaid(item.id, !item.isPaid)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${item.isPaid ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {item.isPaid ? 'Batal Bayar' : 'Tandai Lunas'}
                  </button>
                  {item.isPaid && (
                    <button 
                      onClick={() => handleExtend(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Perpanjang
                    </button>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-[#1E293B] rounded-2xl shadow-xl border border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-100">{editingId ? 'Edit Tagihan' : 'Tambah Tagihan'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nama Layanan</label>
                <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="Contoh: VPS DigitalOcean" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Nominal (Rp)</label>
                  <input required type="number" min="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Siklus Tagihan</label>
                  <select required value={formData.cycle || 'MONTHLY'} onChange={e => setFormData({...formData, cycle: e.target.value as any})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                    <option value="MONTHLY">Bulanan</option>
                    <option value="YEARLY">Tahunan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Tanggal Jatuh Tempo Berikutnya</label>
                <input required type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Website Provider (Opsional)</label>
                <input type="text" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="https://..." />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Catatan Tambahan (Opsional)</label>
                <input type="text" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-11 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="Metode bayar, dsb..." />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-11 font-bold transition-colors">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 font-bold transition-colors disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}
