import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import BuyForm from "./BuyForm"
import Script from "next/script"
import { Wifi } from "lucide-react"

export default async function BuyPage({ params }: { params: Promise<{ routerId: string }> }) {
  const resolvedParams = await params;
  const router = await prisma.router.findUnique({
    where: { id: resolvedParams.routerId },
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  })

  if (!router) return notFound()

  const profiles = await prisma.profile.findMany({
    where: { routerId: router.id, price: { gt: 0 } },
    orderBy: { price: 'asc' }
  })

  // Jika tidak ada profil yang dijual, tampilkan pesan
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Wifi className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Belum Ada Paket Tersedia</h1>
          <p className="text-slate-400">Admin hotspot ini belum mengatur paket internet yang dijual.</p>
        </div>
      </div>
    )
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  const snapScriptUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || ''

  const hotspotName = router.user.name || "WiFi Hotspot"

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <Script src={snapScriptUrl} data-client-key={clientKey} strategy="beforeInteractive" />
      
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wifi className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Beli Voucher WiFi</h1>
            <p className="text-blue-200 text-sm">di jaringan {hotspotName}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <BuyForm routerId={router.id} profiles={profiles} />
        </div>
      </div>
    </div>
  )
}
