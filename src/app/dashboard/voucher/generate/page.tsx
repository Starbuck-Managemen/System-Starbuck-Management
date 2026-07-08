import prisma from "@/lib/prisma"
import { getHotspotProfiles, getHotspotServers } from "@/lib/mikrotik"
import { Ticket, ArrowLeft, PlusCircle } from "lucide-react"
import Link from "next/link"
import { GenerateForm } from "./GenerateForm"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function GenerateVoucherPage({
  searchParams
}: {
  searchParams: { routerId?: string }
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: session.user.email || "" },
        { username: session.user.name || "" }
      ]
    }
  })

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPERADMIN') {
    redirect('/dashboard') // Redirect non-admins to dashboard
  }

  const routers = await prisma.router.findMany()
  
  if (routers.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          Belum ada router yang ditambahkan.
        </div>
      </div>
    )
  }

  const selectedRouterId = searchParams.routerId || routers[0].id

  let servers: any[] = []
  let profiles: any[] = []
  let errorMessage = ""

  try {
    servers = await getHotspotServers(selectedRouterId)
    profiles = await getHotspotProfiles(selectedRouterId)
  } catch (error) {
    errorMessage = "Gagal mengambil data Server/Profil dari Router."
  }

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-orange-500" /> 
            Generate Voucher
          </h1>
          <p className="text-slate-400 mt-2">Buat voucher baru secara massal ke router MikroTik.</p>
        </div>
        
        <Link 
          href="/dashboard/voucher"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
          {errorMessage}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl max-w-3xl">
        <GenerateForm 
          routers={routers} 
          servers={servers} 
          profiles={profiles} 
          selectedRouterId={selectedRouterId} 
        />
      </div>
    </div>
  )
}
