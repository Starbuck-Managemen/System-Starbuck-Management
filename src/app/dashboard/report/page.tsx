import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getLiveReportSummary } from "./actions"
import ReportClient from "./ReportClient"
import { RouterSelector } from "@/app/dashboard/voucher/RouterSelector"
import { FileText, Router as RouterIcon, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReportPage({
  searchParams
}: {
  searchParams: Promise<{ routerId?: string }>
}) {
  const cookieStore = await import("next/headers").then(m => m.cookies())
  const resolvedSearchParams = await searchParams;
  const session = await auth()
  let dbUser = null
  if (session?.user && (session.user as any).id) {
    dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    })
  }

  let routerQuery: any = { orderBy: { createdAt: 'desc' } }
  const targetUserId = dbUser?.role === 'USER' && dbUser?.adminId ? dbUser.adminId : dbUser?.id;
  if (dbUser?.role !== 'SUPERADMIN') {
    routerQuery.where = { userId: targetUserId }
  }
  
  // Ambil daftar router
  const routers = await prisma.router.findMany(routerQuery)

  const superAdminRouterId = cookieStore.get('superadmin_router_id')?.value

  let selectedRouterId = resolvedSearchParams.routerId
  const role = dbUser?.role || 'USER'
  
  if (!selectedRouterId) {
    if (role === 'SUPERADMIN') {
      selectedRouterId = superAdminRouterId || undefined
    } else {
      selectedRouterId = routers.length > 0 ? routers[0].id : undefined
    }
  }

  let reportData = null
  let errorMessage = ""

  if (!selectedRouterId && role === 'SUPERADMIN') {
    errorMessage = "Silakan pilih router di menu Dashboard terlebih dahulu."
  } else if (selectedRouterId && !routers.some(r => r.id === selectedRouterId) && role !== 'SUPERADMIN') {
    errorMessage = "Akses ditolak: Router ini tidak valid atau bukan milik Anda."
  } else if (selectedRouterId) {
    const res = await getLiveReportSummary(selectedRouterId)
    if (res.success) {
      reportData = res.data
    } else {
      errorMessage = res.error || "Gagal mengambil data laporan"
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Laporan Keuangan
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Ringkasan pendapatan dari voucher MikroTik yang telah terjual.
            </p>
          </div>
        </div>
        
        {/* Router Selector */}
        {routers.length > 0 ? (
          <div className="flex items-center gap-3">
            <RouterIcon className="w-5 h-5 text-slate-400 hidden md:block" />
            {role !== 'SUPERADMIN' && (
              <RouterSelector routers={routers} selectedRouterId={selectedRouterId || ''} />
            )}
          </div>
        ) : (
          <Link href="/dashboard/router" className="text-blue-500 hover:underline text-sm">
            + Tambah Router Terlebih Dahulu
          </Link>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Main Content */}
      {selectedRouterId ? (
        reportData ? (
          <ReportClient 
            summary={reportData.summary} 
            chartData={reportData.chartData} 
            transactions={reportData.transactions}
            registeredProfiles={reportData.registeredProfiles} 
          />
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-8 text-center text-slate-400">
            Sedang memuat data...
          </div>
        )
      ) : (
        <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-8 text-center text-slate-400">
          Silakan pilih atau tambahkan router terlebih dahulu.
        </div>
      )}
    </div>
  )
}
