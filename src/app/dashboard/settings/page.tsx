import { Settings } from "lucide-react"
import SettingsForm from "./SettingsForm"
import { getSettings } from "./actions"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()
  const routers = await prisma.router.findMany({ select: { id: true, name: true }})

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="h-7 w-7 text-blue-500" />
          Pengaturan Sistem
        </h1>
        <p className="text-[13px] text-slate-400 mt-2 font-medium">
          Konfigurasi global untuk aplikasi {settings.appName} Anda.
        </p>
      </div>

      <SettingsForm initialData={settings} routers={routers} />

    </div>
  )
}
