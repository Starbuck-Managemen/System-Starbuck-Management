import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AlertCircle, CheckCircle, CreditCard, LogOut } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/UserNav"
import CheckoutButton from "./CheckoutButton"

export default async function BillingPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  let dbUser = null
  if ((session.user as any).id) {
    dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
  }

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Jika status aktif, tidak perlu ada di halaman ini
  if (dbUser.subscriptionStatus === 'Active' || dbUser.subscriptionStatus === 'Trial') {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-slate-100 items-center py-20 px-4">
      <div className="absolute top-6 right-6">
        <UserNav user={dbUser} />
      </div>

      <div className="max-w-xl w-full bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-rose-500/10 p-8 border-b border-rose-500/20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-rose-500 mb-2">Masa Aktif Berakhir</h1>
          <p className="text-slate-300">
            Akses ke dashboard Anda telah ditangguhkan sementara karena masa berlangganan Anda telah habis pada 
            <strong className="text-slate-100 ml-1">
              {dbUser.subscriptionEndsAt ? dbUser.subscriptionEndsAt.toLocaleDateString('id-ID') : (dbUser.trialEndsAt ? dbUser.trialEndsAt.toLocaleDateString('id-ID') : '-')}
            </strong>.
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold mb-4 text-center">Perpanjang Langganan Anda</h2>
          
          <div className="space-y-4">
            <div className="border border-emerald-500 rounded-xl p-5 relative overflow-hidden bg-emerald-500/5 transition-colors">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                PRO
              </div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-emerald-400">Paket Pro</h3>
                <span className="text-xl font-bold">Rp 25.000<span className="text-sm font-normal text-slate-400">/bln</span></span>
              </div>
              <ul className="text-sm text-slate-300 space-y-2 mt-4 mb-6">
                <li className="flex gap-2 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Router Tidak Terbatas (Unlimited)</li>
                <li className="flex gap-2 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Cetak Voucher Tanpa Batas</li>
                <li className="flex gap-2 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Notifikasi Bot WhatsApp</li>
                <li className="flex gap-2 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Dukungan Prioritas & Otomatis Aktif</li>
              </ul>
              
              <CheckoutButton />
            </div>
          </div>
          
          <div className="mt-4 text-center">
             <p className="text-xs text-slate-400">Pembayaran diproses otomatis 24 jam melalui QRIS / e-Wallet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
