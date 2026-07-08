import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { Tag, Router as RouterIcon } from "lucide-react"
import Link from "next/link"
import { getProfilesWithPrice } from "./actions"
import ProfileClient from "./ProfileClient"
import { RouterSelector } from "@/app/dashboard/voucher/RouterSelector"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ routerId?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth()
  let dbUser = null
  if (session?.user && (session.user as any).id) {
    dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    })
  }

  let routerQuery: any = { orderBy: { createdAt: 'desc' } }
  if (dbUser?.role !== 'SUPERADMIN') {
    routerQuery.where = { userId: dbUser?.id }
  }
  
  // Ambil daftar router
  const routers = await prisma.router.findMany(routerQuery)

  const selectedRouterId = resolvedSearchParams.routerId || (routers.length > 0 ? routers[0].id : null)

  let profiles: any[] = []
  let errorMessage = ""

  if (selectedRouterId && !routers.some(r => r.id === selectedRouterId) && dbUser?.role !== 'SUPERADMIN') {
    errorMessage = "Akses ditolak: Router ini tidak valid atau bukan milik Anda."
  } else if (selectedRouterId) {
    const res = await getProfilesWithPrice(selectedRouterId)
    if (res.success) {
      profiles = res.data
    } else {
      errorMessage = res.error || "Gagal mengambil data profil"
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-500" />
            Profile & Harga
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Atur daftar harga untuk setiap profil MikroTik Anda di sini.
          </p>
        </div>
        
        {/* Router Selector */}
        {routers.length > 0 ? (
          <div className="flex items-center gap-3">
            <RouterIcon className="w-5 h-5 text-slate-400" />
            <RouterSelector routers={routers} selectedRouterId={selectedRouterId} />
          </div>
        ) : (
          <Link href="/dashboard/router" className="text-blue-500 hover:underline text-sm">
            + Tambah Router Terlebih Dahulu
          </Link>
        )}
      </div>

      {/* Main Content */}
      {selectedRouterId ? (
        <ProfileClient routerId={selectedRouterId} profiles={profiles} errorMessage={errorMessage} />
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-8 text-center text-slate-400">
          Silakan pilih atau tambahkan router terlebih dahulu.
        </div>
      )}
    </div>
  )
}
