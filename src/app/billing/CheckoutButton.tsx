"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat transaksi")
      }

      // Pastikan Midtrans Snap SDK sudah di-load di layout
      if ((window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            toast.success("Pembayaran berhasil!")
            router.push("/dashboard")
            router.refresh()
          },
          onPending: function (result: any) {
            toast.info("Menunggu pembayaran Anda.")
          },
          onError: function (result: any) {
            toast.error("Pembayaran gagal.")
          },
          onClose: function () {
            toast.warning("Anda menutup pop-up sebelum menyelesaikan pembayaran.")
          }
        })
      } else {
        toast.error("Sistem pembayaran belum siap, silakan refresh halaman.")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-center transition-colors disabled:opacity-50"
    >
      <CreditCard className="w-5 h-5" />
      {isLoading ? "Memproses..." : "Bayar Sekarang dengan QRIS/e-Wallet"}
    </button>
  )
}
