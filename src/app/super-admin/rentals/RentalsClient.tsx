'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, AlertCircle, Building2, User, Phone, Wallet, Calendar, Banknote, Clock as ClockIcon, MessageCircle, Trash2, Megaphone, Printer } from 'lucide-react'
import { createHouse, updateHouse, deleteHouse, generateInvoice, recordManualPayment, deleteRentalPayment, simulateRentalCron } from './actions'
import { broadcastToRentals } from './broadcastActions'
import { toast } from 'sonner'
import { Clock } from '@/components/Clock'
import { useRouter } from 'next/navigation'

export function RentalsClient({ houses, payments }: { houses: any[], payments: any[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('HOUSES')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    tenantName: '',
    tenantPhone: '',
    price: 0,
    dueDate: 1
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return toast.error('Pesan pengumuman tidak boleh kosong')
    if (!confirm(broadcastTarget === 'ALL' ? 'Yakin ingin mengirim pengumuman ini ke seluruh penyewa?' : 'Yakin ingin mengirim pengumuman ke penyewa ini?')) return

    setIsBroadcasting(true)
    const toastId = toast.loading('Mengirim pengumuman...')
    const res = await broadcastToRentals(broadcastMessage, broadcastTarget === 'ALL' ? undefined : broadcastTarget)
    if (res.success) {
      toast.success(res.message, { id: toastId })
      setIsBroadcastModalOpen(false)
      setBroadcastMessage('')
    } else {
      toast.error(res.error || 'Gagal mengirim pengumuman', { id: toastId })
    }
    setIsBroadcasting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    let res;
    if (editingId) {
      res = await updateHouse(editingId, formData)
    } else {
      res = await createHouse(formData)
    }

    if (res.success) {
      toast.success(editingId ? 'Rumah sewa berhasil diupdate' : 'Rumah sewa berhasil ditambahkan')
      setIsAdding(false)
      setEditingId(null)
      setFormData({ name: '', tenantName: '', tenantPhone: '', price: 0, dueDate: 1 })
      router.refresh()
    } else {
      toast.error(res.error || 'Terjadi kesalahan')
    }
    setIsSubmitting(false)
  }

  const handleEdit = (house: any) => {
    setFormData({
      name: house.name,
      tenantName: house.tenantName || '',
      tenantPhone: house.tenantPhone || '',
      price: house.price,
      dueDate: house.dueDate
    })
    setEditingId(house.id)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus rumah ini beserta seluruh tagihannya?')) {
      const res = await deleteHouse(id)
      if (res.success) {
        toast.success('Berhasil dihapus')
        router.refresh()
      } else {
        toast.error('Gagal menghapus')
      }
    }
  }

  const handleGenerateInvoice = async (houseId: string) => {
    const d = new Date()
    const res = await generateInvoice(houseId, d.getMonth() + 1, d.getFullYear())
    if (res.success) {
      toast.success('Tagihan bulan ini berhasil dibuat!')
      router.refresh()
    } else {
      toast.error(res.error || 'Gagal membuat tagihan')
    }
  }

  const handleManualPayment = async (houseId: string, houseName: string) => {
    const amountStr = prompt(`Masukkan nominal uang tunai yang dibayar oleh ${houseName}:`)
    if (!amountStr) return;
    
    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      return toast.error("Nominal tidak valid")
    }

    const res = await recordManualPayment(houseId, amount)
    if (res.success) {
      toast.success('Pembayaran manual berhasil dicatat!')
      router.refresh()
    } else {
      toast.error(res.error || 'Gagal mencatat pembayaran')
    }
  }

  const calculateTotalArrears = (invoices: any[]) => {
    return invoices.reduce((acc, inv) => {
      if (inv.status !== 'PAID') {
        return acc + (inv.amountDue - inv.amountPaid)
      }
      return acc
    }, 0)
  }

  const handleSimulateWA = async () => {
    const toastId = toast.loading('Mensimulasikan pengecekan WA Bot...')
    try {
      const res = await simulateRentalCron()
      if (res.success) {
        toast.success('Pengecekan WA Bot berhasil dijalankan!', { id: toastId })
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menjalankan WA Bot', { id: toastId })
      }
    } catch (e: any) {
      toast.error('Gagal memanggil API: ' + e.message, { id: toastId })
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (confirm('Yakin ingin menghapus riwayat pembayaran ini? (Hanya untuk simulasi)')) {
      const res = await deleteRentalPayment(id)
      if (res.success) {
        toast.success('Riwayat berhasil dihapus')
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menghapus riwayat')
      }
    }
  }

  const calculateDaysRemaining = (dueDate: number, isPaid: boolean) => {
    const today = new Date()
    let targetMonth = today.getMonth()

    if (isPaid) {
      // Jika lunas, arahkan jatuh tempo ke bulan berikutnya
      targetMonth += 1
    }

    const target = new Date(today.getFullYear(), targetMonth, dueDate)
    
    const diffTime = target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24))
    
    if (diffDays === 0) return "Jatuh Tempo Hari Ini!"
    if (diffDays > 0) return `H-${diffDays} (Tinggal ${diffDays} Hari)`
    return `Terlewat ${Math.abs(diffDays)} Hari`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Manajemen Rumah Sewa</h1>
          <p className="text-slate-400">Kelola kamar/rumah sewa, penagihan otomatis WA, dan sistem piutang (Ledger).</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-emerald-400 font-mono text-lg shadow-inner">
          <ClockIcon className="w-5 h-5 text-emerald-500" />
          <Clock />
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('HOUSES')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'HOUSES' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Daftar Rumah / Kamar
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'HISTORY' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Riwayat Pembayaran
        </button>
      </div>

      {activeTab === 'HOUSES' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSimulateWA}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Simulasikan WA Bot
            </button>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Megaphone className="w-4 h-4" /> Pengumuman
            </button>
            <button
              onClick={() => {
                if (isAdding) {
                  setIsAdding(false)
                  setEditingId(null)
                  setFormData({ name: '', tenantName: '', tenantPhone: '', price: 0, dueDate: 1 })
                } else {
                  setIsAdding(true)
                }
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isAdding ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Kamar</>}
            </button>
          </div>

          {isAdding && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">{editingId ? 'Edit Kamar' : 'Tambah Kamar Baru'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-400">Nama Kamar (misal: Kamar 1)</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-400">Harga per Bulan</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-400">Nama Penyewa</label>
                  <input type="text" value={formData.tenantName} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-400">Nomor WhatsApp</label>
                  <input type="text" value={formData.tenantPhone} onChange={e => setFormData({ ...formData, tenantPhone: e.target.value })} className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-400">Tgl Jatuh Tempo (1-31)</label>
                  <input type="number" min="1" max="31" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: Number(e.target.value) })} className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Kamar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {houses.map(house => {
              const totalArrears = calculateTotalArrears(house.invoices)
              
              return (
                <div key={house.id} className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold text-lg text-slate-100">{house.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(house)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded">Edit</button>
                      <button onClick={() => handleDelete(house.id)} className="text-xs px-2 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded">Hapus</button>
                      
                      {totalArrears > 0 ? (
                        <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Nunggak
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lunas
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3 text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{house.tenantName || 'Kosong'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-mono">{house.tenantPhone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold">Rp {house.price.toLocaleString('id-ID')} /bln</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">Tgl Tagih: Tiap tgl {house.dueDate}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-lg flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Info Waktu</span>
                        <span className={`text-xs font-semibold ${totalArrears === 0 ? 'text-emerald-400' : calculateDaysRemaining(house.dueDate, totalArrears === 0).includes('Terlewat') ? 'text-rose-400' : 'text-amber-400'}`}>
                          {calculateDaysRemaining(house.dueDate, totalArrears === 0)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Total Tagihan / Tunggakan</span>
                      <span className={`text-xl font-bold ${totalArrears > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        Rp {totalArrears.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-800 flex gap-2">
                    <button 
                      onClick={() => handleGenerateInvoice(house.id)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      Buat Tagihan
                    </button>
                    <button 
                      onClick={() => handleManualPayment(house.id, house.name)}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Banknote className="w-3 h-3" /> Bayar Manual
                    </button>
                    <button 
                      onClick={() => {
                        window.open(`/rentals/pay/${house.id}`, '_blank')
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      Web Midtrans
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Riwayat Pembayaran Sewa</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="pb-3 font-medium px-4">Tanggal</th>
                  <th className="pb-3 font-medium px-4">Kamar</th>
                  <th className="pb-3 font-medium px-4">Penyewa</th>
                  <th className="pb-3 font-medium px-4">Metode</th>
                  <th className="pb-3 font-medium px-4 text-right">Nominal Masuk</th>
                  <th className="pb-3 font-medium px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-slate-300">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 font-medium text-emerald-400">{p.house.name}</td>
                    <td className="py-4 px-4 text-slate-300">{p.house.tenantName}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-100">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 flex items-center justify-center gap-3">
                      <button 
                        onClick={() => window.open(`/invoice/rental/${p.paymentToken}`, '_blank')}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Lihat / Cetak Struk"
                      >
                        <Printer className="w-4 h-4 mx-auto" />
                      </button>
                      <button 
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-rose-400 hover:text-rose-300 transition-colors"
                        title="Hapus riwayat (Hanya untuk simulasi)"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada riwayat pembayaran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-xl font-bold text-slate-100 mb-2">Kirim Pengumuman</h2>
            <p className="text-slate-400 text-sm mb-4">Pesan akan dikirimkan ke target yang Anda pilih. Pengiriman massal akan diberi jeda otomatis untuk mencegah blokir (Anti-Spam).</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-400 mb-1">Target Penerima</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                value={broadcastTarget}
                onChange={e => setBroadcastTarget(e.target.value)}
                disabled={isBroadcasting}
              >
                <option value="ALL">📢 Semua Penyewa (Kirim Serentak)</option>
                {houses.map(h => (
                  <option key={h.id} value={h.id}>Kamar {h.name} ({h.tenantName || 'Tanpa Nama'})</option>
                ))}
              </select>
            </div>

            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 min-h-[150px] mb-4"
              placeholder="Ketik isi pengumuman Anda di sini..."
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              disabled={isBroadcasting}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                disabled={isBroadcasting}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>Mengirim...</>
                ) : (
                  <><Megaphone className="w-4 h-4" /> Mulai Kirim</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
