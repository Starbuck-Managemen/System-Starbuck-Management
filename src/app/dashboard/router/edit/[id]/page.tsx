import { EditForm } from "./EditForm"
import { Server } from "lucide-react"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

export default async function EditRouterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const router = await prisma.router.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!router) {
    notFound()
  }

  const session = await auth()
  const role = (session?.user as any)?.role || 'USER'
  
  let adminUsers: any[] = []
  if (role === 'SUPERADMIN') {
    adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, username: true }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-500" />
            Edit Router
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ubah detail koneksi VPN Mikhmon Anda jika ada perubahan.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-sm p-6 md:p-8">
        <EditForm initialData={router} adminUsers={adminUsers} sessionRole={role} />
      </div>
    </div>
  )
}
