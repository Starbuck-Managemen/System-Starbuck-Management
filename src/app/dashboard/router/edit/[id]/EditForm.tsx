"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateRouter } from "../../actions"
import { toast } from "sonner"
import { Save, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function EditForm({ initialData, adminUsers = [], sessionRole = 'USER' }: { initialData: any, adminUsers?: any[], sessionRole?: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await updateRouter(initialData.id, formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success)
        router.push("/dashboard/router")
        router.refresh()
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Nama Router</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialData.name}
            placeholder="Contoh: RB750Gr3 Pusat"
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">VPN Host / IP Address</label>
          <input
            name="host"
            type="text"
            required
            defaultValue={initialData.host}
            placeholder="Contoh: id-1.mikhmon.online"
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">API Port</label>
          <input
            name="apiPort"
            type="number"
            required
            defaultValue={initialData.apiPort}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Username MikroTik</label>
          <input
            name="username"
            type="text"
            required
            defaultValue={initialData.username}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Password MikroTik (Baru)</label>
          <input
            name="password"
            type="password"
            placeholder="Kosongkan jika tidak ingin diubah"
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">Kosongkan jika tidak ada perubahan password.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Status Awal</label>
          <select
            name="status"
            defaultValue={initialData.status}
            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {sessionRole === 'SUPERADMIN' && (
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-300">Pemilik Router (Tenant)</label>
            <select
              name="userId"
              defaultValue={initialData.userId || ""}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">- Tidak ada (Bebas) -</option>
              {adminUsers.map((admin: any) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name || admin.username}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Hanya SUPERADMIN yang dapat memindahkan kepemilikan router ini.</p>
          </div>
        )}

      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
        <Link 
          href="/dashboard/router"
          className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Perubahan
        </button>
      </div>
    </form>
  )
}
