import prisma from "@/lib/prisma"
import { Users } from "lucide-react"
import ClientRowActions from "./ClientRowActions"

export default async function ClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "ADMIN" },
    include: {
      routers: true
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Manajemen Klien
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola masa aktif dan status berlangganan admin.</p>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/50 text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-4">Nama Klien</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Status & Masa Aktif</th>
                <th className="px-6 py-4 text-center">Jml Router</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">
                        {client.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{client.name}</div>
                        <div className="text-xs text-slate-400">Terdaftar: {client.createdAt.toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300">{client.phone || '-'}</div>
                    <div className="text-xs text-slate-500">{client.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      {client.subscriptionStatus === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">Aktif</span>
                      ) : client.subscriptionStatus === 'Trial' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">Trial</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/20">Expired</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      S/d: {client.subscriptionEndsAt ? client.subscriptionEndsAt.toLocaleDateString('id-ID') : (client.trialEndsAt ? client.trialEndsAt.toLocaleDateString('id-ID') : 'Selamanya')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {client.routers.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ClientRowActions clientId={client.id} status={client.subscriptionStatus} />
                  </td>
                </tr>
              ))}
              
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Belum ada klien yang terdaftar.
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
