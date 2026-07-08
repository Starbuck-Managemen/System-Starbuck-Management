import prisma from "@/lib/prisma"
import { getVouchers } from "@/lib/mikrotik"
import { Ticket, Router as RouterIcon, AlertCircle, PlusCircle } from "lucide-react"
import Link from "next/link"
import { VoucherPageClientHeader } from "./VoucherPageClientHeader"
import { VoucherTable } from "./VoucherTable"
import { AutoReminderPanel } from "./AutoReminderPanel"
import { auth } from "@/auth"

export const dynamic = "force-dynamic";

export default async function VoucherPage({
  searchParams
}: {
  searchParams: Promise<{ routerId?: string }>
}) {
  const cookieStore = await import("next/headers").then(m => m.cookies())
  const resolvedSearchParams = await searchParams;
  
  const session = await auth()
  let dbUser = null
  if (session?.user && (session.user as any).id) {
    dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
  } else if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  } else if (session?.user?.name) {
    dbUser = await prisma.user.findFirst({ where: { username: session.user.name } })
  }
  const role = dbUser?.role || 'USER'

  let routerQuery: any = { orderBy: { createdAt: 'desc' } }
  const targetUserId = dbUser?.role === 'USER' && dbUser?.adminId ? dbUser.adminId : dbUser?.id;
  if (dbUser?.role !== 'SUPERADMIN') {
    routerQuery.where = { userId: targetUserId }
  }
  // Ambil daftar router
  const routers = await prisma.router.findMany(routerQuery)

  const superAdminRouterId = cookieStore.get('superadmin_router_id')?.value

  let selectedRouterId = resolvedSearchParams.routerId
  
  if (!selectedRouterId) {
    if (role === 'SUPERADMIN') {
      selectedRouterId = superAdminRouterId || undefined
    } else {
      selectedRouterId = routers.length > 0 ? routers[0].id : undefined
    }
  }

  let vouchers: any[] = []
  let errorMessage = ""

  if (!selectedRouterId && role === 'SUPERADMIN') {
    errorMessage = "Silakan pilih router di menu Dashboard terlebih dahulu."
  } else if (selectedRouterId && !routers.some(r => r.id === selectedRouterId) && role !== 'SUPERADMIN') {
    errorMessage = "Akses ditolak: Router ini tidak valid atau bukan milik Anda."
  } else if (selectedRouterId) {
    try {
      const rawVouchers = await getVouchers(selectedRouterId)
      
      const dbProfiles = await prisma.profile.findMany({
        where: { routerId: selectedRouterId }
      })
      const priceMap = new Map<string, number>()
      dbProfiles.forEach(p => priceMap.set(p.name, p.price))

      // Use dynamic import to avoid potential circular dependency issues with mikrotik.ts if any
      const { enrichVoucher } = await import('@/lib/mikrotikUtils')
      
      vouchers = rawVouchers.map(v => {
        const enriched = enrichVoucher(v, priceMap)
        return {
          ...v,
          actualProfile: enriched.actualProfile,
          price: enriched.price,
          createdAt: enriched.createdAt.toISOString(),
          expiresAt: enriched.expiresAt ? enriched.expiresAt.toISOString() : null
        }
      })
    } catch (error: any) {
      errorMessage = error.message || "Gagal mengambil data dari Router"
    }
  }

  // Filter default pengguna hotspot (seperti default profil admin, jangan dihapus tapi disembunyikan jika perlu)
  // Untuk saat ini kita tampilkan semua

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-orange-500" />
            Voucher / Hotspot Users
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Data terhubung langsung (Live) dengan Router MikroTik Anda.
          </p>
        </div>
        
        {/* Router Selector & Generate Button */}
        {routers.length > 0 ? (
          <VoucherPageClientHeader routers={routers} selectedRouterId={selectedRouterId || ''} role={role} />
        ) : (
          <Link href="/dashboard/router" className="text-blue-500 hover:underline text-sm">
            + Tambah Router Terlebih Dahulu
          </Link>
        )}
      </div>

      {role === 'ADMIN' && (
        <AutoReminderPanel />
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-sm overflow-hidden flex-1">

        <VoucherTable 
          vouchers={vouchers} 
          routerId={selectedRouterId || null} 
          errorMessage={errorMessage} 
          role={role}
        />
      </div>
    </div>
  )
}
