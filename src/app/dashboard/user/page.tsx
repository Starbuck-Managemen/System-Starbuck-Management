import { Users, Search, Plus, User, Pencil, Trash2, Shield } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import UserSearchInput from "./UserSearchInput"
import { getSettings } from "@/app/dashboard/settings/actions"

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserManagementPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  const settings = await getSettings()
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

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

  const role = dbUser?.role || 'USER';

  let userWhere: any = undefined;
  
  if (role === 'SUPERADMIN') {
    // SuperAdmin sees all users. If `q` is present, it will be added below.
    userWhere = {};
  } else if (role === 'ADMIN' && dbUser?.id) {
    // Admin ONLY sees themselves and users they created (adminId = their ID)
    userWhere = {
      OR: [
        { id: dbUser.id },
        { adminId: dbUser.id }
      ]
    };
  } else if (role === 'USER' && dbUser?.id) {
    // Regular User ONLY sees themselves
    userWhere = {
      id: dbUser.id
    };
  } else {
    // Fallback: If no role or dbUser.id, return NO users (prevent leak)
    userWhere = {
      id: 'invalid-id-prevent-leak'
    };
  }

  if (q) {
    userWhere = {
      ...userWhere,
      AND: [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ]
        }
      ]
    }
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Users className="h-7 w-7" />
            User Management
          </h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Kelola seluruh akun pengguna {settings.appName}.
          </p>
        </div>
        <Link href="/dashboard/user/add" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-sm">
          <Plus className="h-[18px] w-[18px]" />
          Add User
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#1E293B] rounded-2xl shadow-md flex flex-col mt-2 overflow-hidden border-none">
        
        {/* Search Bar Area */}
        <div className="p-6 border-b border-slate-700/50">
          <UserSearchInput />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-700/50 text-[13px] font-semibold text-slate-300">
                <th className="py-5 px-6 font-semibold w-24 text-center">Avatar</th>
                <th className="py-5 px-6 font-semibold">Nama</th>
                <th className="py-5 px-6 font-semibold">Username</th>
                <th className="py-5 px-6 font-semibold">Email</th>
                <th className="py-5 px-6 font-semibold text-center">Role</th>
                <th className="py-5 px-6 font-semibold text-center">Status</th>
                <th className="py-5 px-6 font-semibold text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-200">
              {users.map((user) => {
                const now = new Date()
                const isOnline = user.lastActive && (now.getTime() - new Date(user.lastActive).getTime() < 3 * 60 * 1000)
                
                return (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 flex justify-center">
                    <div className="relative h-10 w-10 rounded-full bg-[#0F172A] border-2 border-blue-500 flex items-center justify-center overflow-hidden shrink-0">
                      {user.image ? (
                        <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold">{user.name || '-'}</td>
                  <td className="py-4 px-6 text-slate-300 font-medium">{user.username || '-'}</td>
                  <td className="py-4 px-6 text-slate-300 font-medium">{user.email || '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
                        <Shield className="h-3.5 w-3.5" />
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 px-3 py-1.5 text-[11px] font-bold text-green-400 border border-green-800/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-400 border border-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                          Offline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-3">
                      
                      {/* Edit Button with Tooltip */}
                      <div className="relative group flex items-center justify-center">
                        <Link href={`/dashboard/user/edit/${user.id}`} className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-sm">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <span className="absolute -top-10 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 shadow-lg whitespace-nowrap z-10 border border-slate-700">
                          Edit user
                        </span>
                      </div>
                      
                      {/* Delete Button with Tooltip */}
                      {user.email !== session?.user?.email && (
                        <div className="relative group flex items-center justify-center">
                          <form action={async () => {
                            'use server'
                            const { deleteUser } = await import('./actions')
                            await deleteUser(user.id)
                          }}>
                            <button type="submit" className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-sm">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                          <span className="absolute -top-10 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 shadow-lg whitespace-nowrap z-10 border border-slate-700">
                            Delete user
                          </span>
                        </div>
                      )}
                      
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="p-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[13px] text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-200">{users.length}</span> of <span className="font-bold text-slate-200">{users.length}</span> Users
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#0F172A] hover:text-slate-200 transition-colors">
              &lt;
            </button>
            <button className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              1
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#0F172A] hover:text-slate-200 transition-colors">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
