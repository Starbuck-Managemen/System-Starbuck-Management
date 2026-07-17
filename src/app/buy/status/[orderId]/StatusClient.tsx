"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, XCircle, Copy, Wifi } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function StatusClient({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState("PENDING")
  const [voucher, setVoucher] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/hotspot/status/${orderId}`)
        const data = await res.json()
        
        if (data.status) {
          setStatus(data.status)
          if (data.status === 'SUCCESS' && data.voucherCode) {
            setVoucher(data.voucherCode)
            clearInterval(interval)
          } else if (data.status === 'FAILED') {
            clearInterval(interval)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Check immediately, then every 3 seconds
    checkStatus()
    interval = setInterval(checkStatus, 3000)

    return () => clearInterval(interval)
  }, [orderId])

  const copyToClipboard = () => {
    if (voucher) {
      navigator.clipboard.writeText(voucher)
      toast.success("Kode voucher disalin!")
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
        
        {status === 'PENDING' && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Menunggu Pembayaran</h1>
            <p className="text-slate-400">Silakan selesaikan pembayaran Anda di pop-up Midtrans atau halaman aplikasi pembayaran Anda.</p>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Pembayaran Gagal</h1>
            <p className="text-slate-400">Waktu pembayaran telah habis atau dibatalkan.</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white">Pembayaran Berhasil!</h1>
              <p className="text-emerald-400 text-sm mt-1">Voucher WiFi Anda siap digunakan.</p>
            </div>

            <div className="bg-[#0F172A] p-6 rounded-xl border border-slate-700 relative group">
              <p className="text-sm text-slate-400 mb-2">KODE VOUCHER ANDA:</p>
              <div className="text-4xl font-black text-white tracking-wider">
                {voucher || "MEMUAT..."}
              </div>
              <button 
                onClick={copyToClipboard}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                title="Salin Kode"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs text-slate-500 text-left">
                * Kode voucher ini juga telah dikirimkan ke nomor WhatsApp Anda.<br/>
                * Buka halaman login WiFi Anda dan masukkan kode di atas pada kolom Username/Kode Voucher.
              </p>
              
              <a 
                href="http://logout.net" // Standar MikroTik login url (opsional)
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors mt-2"
              >
                <Wifi className="w-5 h-5" /> Login ke WiFi Sekarang
              </a>
              
              <button
                onClick={() => router.push(`/invoice/hotspot/${orderId}`)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors mt-2 border border-slate-700"
              >
                📄 Lihat Struk Pembayaran
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
