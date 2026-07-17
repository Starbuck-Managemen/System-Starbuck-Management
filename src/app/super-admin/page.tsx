import prisma from "@/lib/prisma"
import { Users, Wifi, DollarSign } from "lucide-react"

export default async function SuperAdminDashboard() {
  const totalClients = await prisma.user.count({
    where: { role: "ADMIN" }
  })
  
  const totalRouters = await prisma.router.count()
  
  // Calculate real revenue from SaaS payments
  const saasTransactions = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      voucherType: { startsWith: 'SaaS' }
    }
  })
  
  const totalRevenue = saasTransactions._sum.amount || 0;
  
  // Get recent SaaS transactions for the table
  const saasHistory = await prisma.transaction.findMany({
    where: { voucherType: { startsWith: 'SaaS' } },
    include: { user: { select: { name: true, username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to latest 50 to prevent huge loads
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-100">Super Admin Dashboard</h1>
        <p className="text-slate-400">Pantau performa bisnis SaaS Anda secara global.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-medium text-sm">Total Klien (Admin)</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-100">{totalClients}</h2>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-medium text-sm">Total Router Terhubung</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wifi className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-100">{totalRouters}</h2>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-medium text-sm">Estimasi Pendapatan</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-100">Rp {totalRevenue.toLocaleString("id-ID")}</h2>
          </div>
        </div>
      </div>
      
      {/* Laporan Pendapatan SaaS Section */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100">Riwayat Pembayaran SaaS</h2>
          <p className="text-slate-400 text-sm">Daftar transaksi pembayaran biaya berlangganan dari para Admin.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="pb-3 font-medium px-4">Tanggal</th>
                <th className="pb-3 font-medium px-4">Klien (Admin)</th>
                <th className="pb-3 font-medium px-4">Paket</th>
                <th className="pb-3 font-medium px-4">Order ID</th>
                <th className="pb-3 font-medium px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {saasHistory.length > 0 ? (
                saasHistory.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-slate-300">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{tx.user?.name || tx.user?.username || 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{tx.user?.email || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{tx.voucherType}</td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-mono">{tx.username}</td>
                    <td className="py-4 px-4 text-right font-medium text-emerald-400">
                      Rp {tx.amount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada transaksi masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
