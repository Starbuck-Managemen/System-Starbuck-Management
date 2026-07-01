import prisma from "@/lib/prisma"
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
  const resolvedSearchParams = await searchParams;
  // Ambil daftar router
  const routers = await prisma.router.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const selectedRouterId = resolvedSearchParams.routerId || (routers.length > 0 ? routers[0].id : null)

  let reportData = null
  let errorMessage = ""

  if (selectedRouterId) {
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
            <RouterIcon className="w-5 h-5 text-slate-400" />
            <RouterSelector routers={routers} selectedRouterId={selectedRouterId} />
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
