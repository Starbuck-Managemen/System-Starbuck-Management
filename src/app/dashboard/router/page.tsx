import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Plus, Edit, Trash2, Server } from "lucide-react"
import { deleteRouter } from "./actions"
import { LiveRouterStatus } from "./LiveRouterStatus"

export default async function RouterPage() {
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
  const routers = await prisma.router.findMany(routerQuery)

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-6 h-6 text-green-500" />
            Router Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola perangkat MikroTik Anda untuk sinkronisasi Voucher.
          </p>
        </div>
        <Link 
          href="/dashboard/router/create" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors w-fit"
        >
          <Plus className="w-5 h-5" />
          Add Router
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <thead className="bg-[#0F172A] text-xs uppercase text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nama Router</th>
                <th scope="col" className="px-6 py-4">VPN Host / IP</th>
                <th scope="col" className="px-6 py-4">API Port</th>
                <th scope="col" className="px-6 py-4">Username</th>
                <th scope="col" className="px-6 py-4 text-center">Status</th>
                <th scope="col" className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {routers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada router yang ditambahkan.
                  </td>
                </tr>
              ) : (
                routers.map((router) => (
                  <tr key={router.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {router.name}
                    </td>
                    <td className="px-6 py-4">
                      {router.host}
                    </td>
                    <td className="px-6 py-4">
                      {router.apiPort}
                    </td>
                    <td className="px-6 py-4">
                      {router.username}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <LiveRouterStatus routerId={router.id} initialStatus={router.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Edit Button */}
                        <div className="relative group">
                          <Link 
                            href={`/dashboard/router/edit/${router.id}`}
                            className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 border border-slate-700">
                            Edit Router
                          </div>
                        </div>

                        {/* Delete Form */}
                        <form action={async () => {
                          'use server'
                          await deleteRouter(router.id)
                        }}>
                          <div className="relative group">
                            <button 
                              type="submit"
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 border border-slate-700">
                              Delete Router
                            </div>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
