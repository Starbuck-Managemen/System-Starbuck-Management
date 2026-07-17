'use client'

import { useState, useEffect } from 'react'
import { Building2, AlertCircle, CheckCircle2 } from 'lucide-react'

// Declare Midtrans Snap global
declare global {
  interface Window {
    snap: any;
  }
}

export function RentalPayClient({ house, invoices }: { house: any, invoices: any[] }) {
  const totalArrears = invoices.reduce((acc, inv) => {
    if (inv.status !== 'PAID') {
      return acc + (inv.amountDue - inv.amountPaid)
    }
    return acc
  }, 0)

  const [amount, setAmount] = useState<number>(totalArrears > 0 ? totalArrears : house.price)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Load Midtrans Snap script
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return;

    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js'; // Use production or sandbox URL as needed based on env later, defaulting to production for this app
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (amount <= 0) return alert('Nominal harus lebih dari 0')
    setIsProcessing(true)

    try {
      const res = await fetch('/api/rental/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId: house.id, amount })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal memulai pembayaran')

      window.snap.pay(data.token, {
        onSuccess: function(result: any) {
          setOrderId(data.orderId)
          setIsSuccess(true)
        },
        onPending: function(result: any) {
          alert('Pembayaran tertunda. Silakan selesaikan instruksi pembayaran.')
        },
        onError: function(result: any) {
          alert('Pembayaran gagal.')
          setIsProcessing(false)
        },
        onClose: function() {
          setIsProcessing(false)
        }
      })
    } catch (error: any) {
      alert(error.message)
      setIsProcessing(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Pembayaran Berhasil!</h2>
        <p className="text-slate-400 max-w-md">
          Terima kasih. Pembayaran Anda sedang diproses oleh sistem dan tagihan Anda akan segera diperbarui secara otomatis.
        </p>
        <div className="flex gap-4 mt-4">
          <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors border border-slate-700">
            Kembali
          </button>
          {orderId && (
            <a href={`/invoice/rental/${orderId}`} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors font-bold inline-flex items-center gap-2">
              📄 Lihat Struk Pembayaran
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-2">
          <Building2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Portal Pembayaran Sewa</h1>
        <p className="text-slate-400">Silakan selesaikan pembayaran untuk rumah sewa Anda.</p>
      </div>

      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex flex-col gap-2">
          <span className="text-slate-400 text-sm">Informasi Penyewa</span>
          <h2 className="text-xl font-bold text-slate-100">{house.name}</h2>
          <span className="text-emerald-400 font-medium">{house.tenantName || 'Penyewa'}</span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Rincian Tagihan</h3>
            
            {invoices.length === 0 ? (
              <div className="p-4 bg-slate-800/50 rounded-lg text-center text-slate-400">
                Belum ada tagihan yang diterbitkan.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {invoices.map(inv => {
                  const sisa = inv.amountDue - inv.amountPaid
                  return (
                    <div key={inv.id} className="flex justify-between items-center p-3 border border-slate-800 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-200 font-medium">Bulan {inv.month}/{inv.year}</span>
                        <span className="text-xs text-slate-500">Tenggat: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-slate-200">Rp {sisa.toLocaleString('id-ID')}</span>
                        {inv.status === 'PARTIAL' && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Dicicil</span>}
                        {inv.status === 'UNPAID' && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">Belum Lunas</span>}
                        {inv.status === 'PAID' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Lunas</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900 rounded-xl flex justify-between items-center border border-slate-800">
            <span className="text-slate-300 font-medium">Total Tunggakan</span>
            <span className={`text-2xl font-bold ${totalArrears > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Rp {totalArrears.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-medium">Nominal yang ingin dibayar (Rp)</label>
            <p className="text-xs text-slate-500 mb-2">Anda bisa merubah nominal ini jika ingin membayar sebagian (mencicil) atau membayar lebih.</p>
            <input 
              type="number" 
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-[#0F172A] border-2 border-slate-700 rounded-xl px-4 py-3 text-xl text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors w-full"
            />
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing || amount <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors mt-2 shadow-lg shadow-emerald-900/20"
          >
            {isProcessing ? 'Memproses...' : 'Lanjutkan Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  )
}
