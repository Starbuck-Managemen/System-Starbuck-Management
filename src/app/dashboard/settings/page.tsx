import { Settings } from "lucide-react"
import SettingsForm from "./SettingsForm"
import { getSettings } from "./actions"
import prisma from "@/lib/prisma"

import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  
  let dbUser = null
  if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
  } else if (session?.user?.name) {
    dbUser = await prisma.user.findFirst({
      where: { username: session.user.name }
    })
  }

  const settings = await getSettings(dbUser?.id, dbUser?.role, dbUser?.adminId || undefined)

  let routerQuery: any = { select: { id: true, name: true } }
  const targetUserId = dbUser?.role === 'USER' && dbUser?.adminId ? dbUser.adminId : dbUser?.id;
  
  if (dbUser?.role !== 'SUPERADMIN') {
    routerQuery.where = { userId: targetUserId }
  }

  const routers = await prisma.router.findMany(routerQuery)

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="h-7 w-7 text-blue-500" />
          Pengaturan Sistem
        </h1>
        <p className="text-[13px] text-slate-400 mt-2 font-medium">
          Konfigurasi {dbUser?.role === 'SUPERADMIN' ? 'global untuk aplikasi' : 'khusus untuk voucher'} {settings.appName}.
        </p>
      </div>

      <SettingsForm initialData={settings} routers={routers} role={dbUser?.role || 'USER'} />

    </div>
  )
}
