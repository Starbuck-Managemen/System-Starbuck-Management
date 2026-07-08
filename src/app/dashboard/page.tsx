import prisma from "@/lib/prisma"
import { getVouchers } from "@/lib/mikrotik"
import { getLiveReportSummary } from "@/app/dashboard/report/actions"
import { Router as RouterIcon, Users, CreditCard, Activity, ArrowRight, ShieldCheck, PlusCircle, PieChart } from "lucide-react"
import Link from "next/link"
import { TrafficMonitor } from "./TrafficMonitor"
import { LiveRouterStatus } from "./router/LiveRouterStatus"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSettings } from "@/app/dashboard/settings/actions"
import { cookies } from "next/headers"
import { GlobalRouterSelector } from "@/components/GlobalRouterSelector"

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth()
  const settings = await getSettings()
  
  let dbUser = null
  if (session?.user && (session.user as any).id) {
    dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    })
  } else if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
  } else if (session?.user?.name) {
    dbUser = await prisma.user.findFirst({
      where: { username: session.user.name }
    })
  }

  let routerQuery: any = { orderBy: { createdAt: 'desc' } }
  const targetUserId = dbUser?.role === 'USER' && dbUser?.adminId ? dbUser.adminId : dbUser?.id;
  if (dbUser?.role !== 'SUPERADMIN') {
    routerQuery.where = { userId: targetUserId }
  }
  const routers = await prisma.router.findMany(routerQuery)

  // Redirect admin/tenant ke halaman tambah router jika belum ada router
  if (routers.length === 0 && dbUser?.role === 'ADMIN') {
    redirect('/dashboard/router/create')
  }

  const cookieStore = await cookies()
  const selectedRouterId = cookieStore.get('superadmin_router_id')?.value

  // Ambil router yang dipilih (khusus SUPERADMIN via cookie) atau default router pertama
  let primaryRouter = null
  if (dbUser?.role === 'SUPERADMIN') {
    if (selectedRouterId) {
      primaryRouter = routers.find(r => r.id === selectedRouterId) || null
    }
  } else {
    primaryRouter = routers.length > 0 ? routers[0] : null
  }
  
  let stats = { active: 0, unused: 0, offline: 0, disabled: 0, total: 0 }
  let totalRevenue = 0
  let totalSold = 0
  let isConnected = false

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateRangeStr = `${formatDate(firstDay)} - ${formatDate(lastDay)}`;

  if (primaryRouter) {
    try {
      const reportRes = await getLiveReportSummary(primaryRouter.id)
      if (reportRes.success && reportRes.data) {
        totalRevenue = reportRes.data.summary.monthIncome || 0
        totalSold = reportRes.data.summary.vouchersCreatedThisMonth || 0
      }

      const allVouchers = await getVouchers(primaryRouter.id)
      stats.total = allVouchers.length
      
      allVouchers.forEach(v => {
        if (v.disabled) stats.disabled++
        else if (v.isActive) stats.active++
        else if (v.uptime === "0s") stats.unused++
        else stats.offline++
      })

      isConnected = true
    } catch (e) {
      // Error koneksi diabaikan untuk dashboard, tetap tampilkan offline
      isConnected = false
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Ringkasan sistem manajemen {settings.appName} Anda.</p>
        </div>
        
        {dbUser?.role === 'SUPERADMIN' && routers.length > 0 && (
          <GlobalRouterSelector routers={routers} selectedId={selectedRouterId || null} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Router Status */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Total Router</p>
              <h3 className="text-3xl font-bold text-white mt-2">{routers.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
              <RouterIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 text-sm border-t border-slate-700/50 pt-4">
            <span className="text-slate-400">Live Status:</span>
            {primaryRouter ? (
              <LiveRouterStatus routerId={primaryRouter.id} initialStatus={primaryRouter.status} />
            ) : (
              <span className="text-slate-500">Belum ada router</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Vouchers */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Total Database Voucher</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.total}</h3>
            </div>
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            Voucher terdaftar di MikroTik
          </div>
        </div>

        {/* Card 3: Profiles */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Pendapatan Bulan Ini</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                <span className="text-lg text-slate-400">Rp</span> {new Intl.NumberFormat("id-ID").format(totalRevenue)}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-slate-700/50 pt-4">
            <span className="text-sm text-slate-400">Dari {totalSold} voucher bulan ini</span>
            <span className="text-xs text-slate-500 font-medium">{dateRangeStr}</span>
          </div>
        </div>
      </div>

      {/* Voucher Stats Row */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Status Voucher (Live)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] p-4 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-medium mb-1">ACTIVE (Online)</p>
            <h4 className="text-3xl font-bold text-emerald-400">{stats.active}</h4>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-medium mb-1">BELUM DIPAKAI</p>
            <h4 className="text-3xl font-bold text-blue-400">{stats.unused}</h4>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-medium mb-1">OFFLINE</p>
            <h4 className="text-3xl font-bold text-slate-300">{stats.offline}</h4>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
            <p className="text-slate-400 text-xs font-medium mb-1">NONAKTIF</p>
            <h4 className="text-3xl font-bold text-red-400">{stats.disabled}</h4>
          </div>
        </div>
      </div>

      {/* Live Traffic Monitor */}
      {primaryRouter && <TrafficMonitor routerId={primaryRouter.id} />}

    </div>
  )
}
