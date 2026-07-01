import { Settings, Wrench } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="h-7 w-7 text-blue-500" />
          Pengaturan Sistem
        </h1>
        <p className="text-[13px] text-slate-400 mt-2 font-medium">
          Konfigurasi global untuk aplikasi buckNet Manager Anda.
        </p>
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-12 border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 bg-blue-900/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
          <Wrench className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 mb-3">Segera Hadir!</h2>
        <p className="text-slate-400 max-w-md">
          Halaman Pengaturan Sistem sedang dalam tahap pengembangan. Nantinya Anda dapat mengubah logo, nama aplikasi, tema warna, dan router default di sini.
        </p>
      </div>

    </div>
  )
}
