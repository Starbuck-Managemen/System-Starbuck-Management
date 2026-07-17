"use client"

import { useState } from "react"
import { CreditCard, Search, ArrowRight, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Profile = {
  id: string
  name: string
  price: number
}

export default function BuyForm({ routerId, profiles }: { routerId: string, profiles: Profile[] }) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [isOldUser, setIsOldUser] = useState(false)
  const [step, setStep] = useState(1)
  const [previousVoucher, setPreviousVoucher] = useState("")
  const [selectedProfileId, setSelectedProfileId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)
  const isMonthlyProfile = selectedProfile ? selectedProfile.name.toLowerCase().includes("bulan") : false

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return toast.error("Nomor WhatsApp harus diisi")
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/hotspot/lookup?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      
      if (data.found && data.name) {
        setName(data.name)
        setIsOldUser(true)
        toast.success(`Selamat datang kembali, ${data.name}!`)
      } else {
        setIsOldUser(false)
      }
      setStep(2)
    } catch (err: any) {
      toast.error("Gagal memeriksa nomor.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedProfileId) return toast.error("Pilih paket voucher terlebih dahulu")
    if (!name) return toast.error("Nama panggilan harus diisi")

    setIsLoading(true)
    try {
      const res = await fetch("/api/hotspot/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routerId,
          profileId: selectedProfileId,
          phone,
          name,
          previousVoucher: isMonthlyProfile ? previousVoucher : undefined
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat transaksi")

      if ((window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            toast.success("Pembayaran berhasil!")
            router.push(`/buy/status/${data.orderId}`)
          },
          onPending: function (result: any) {
            toast.info("Menunggu pembayaran Anda.")
            router.push(`/buy/status/${data.orderId}`)
          },
          onError: function (result: any) {
            toast.error("Pembayaran gagal.")
          },
          onClose: function () {
            toast.warning("Pop-up ditutup sebelum selesai.")
          }
        })
      } else {
        toast.error("Sistem pembayaran belum siap, refresh halaman.")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nomor WhatsApp</label>
          <input 
            type="tel" 
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: 08123456789"
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-500 mt-2">Kode voucher akan dikirimkan otomatis ke nomor ini.</p>
        </div>
        <button 
          type="submit" 
          disabled={isLoading || phone.length < 9}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 font-bold transition-colors disabled:opacity-50"
        >
          {isLoading ? "Mengecek..." : "Lanjutkan"} <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
          <UserIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Nama Panggilan</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama Anda"
            className="w-full bg-transparent border-b border-slate-700 pb-1 text-white font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-white mb-3">Pilih Paket Internet</h3>
        <div className="space-y-3">
          {profiles.map(p => (
            <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedProfileId === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-[#0F172A] hover:border-slate-500'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="profile" 
                  value={p.id}
                  checked={selectedProfileId === p.id}
                  onChange={() => {
                    setSelectedProfileId(p.id)
                    setPreviousVoucher("") // reset previous voucher when changing profile
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-slate-200">{p.name}</span>
              </div>
              <span className="font-bold text-white">Rp {p.price.toLocaleString('id-ID')}</span>
            </label>
          ))}
        </div>
      </div>

      {isMonthlyProfile && (
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
          <label className="block text-sm font-bold text-blue-400 mb-2">Perpanjangan Voucher (Opsional)</label>
          <p className="text-xs text-blue-200/70 mb-3">Punya voucher bulanan sebelumnya? Masukkan kodenya di bawah agar bisa diperpanjang (tidak perlu ganti kode).</p>
          <input 
            type="text" 
            value={previousVoucher}
            onChange={(e) => setPreviousVoucher(e.target.value)}
            placeholder="Kode Voucher Lama"
            className="w-full bg-[#0F172A] border border-blue-500/30 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button 
          onClick={() => setStep(1)}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
        >
          Kembali
        </button>
        <button 
          onClick={handlePayment}
          disabled={isLoading || !selectedProfileId || !name}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          <CreditCard className="w-5 h-5" />
          {isLoading ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </div>
    </div>
  )
}
