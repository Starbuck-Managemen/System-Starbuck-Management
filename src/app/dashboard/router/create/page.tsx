import { CreateForm } from "./CreateForm"
import { Server } from "lucide-react"

export default function CreateRouterPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-500" />
            Tambah Router (MikroTik)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Masukkan detail koneksi VPN Mikhmon Anda agar sistem bisa terhubung ke router.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-sm p-6 md:p-8">
        <CreateForm />
      </div>
    </div>
  )
}
