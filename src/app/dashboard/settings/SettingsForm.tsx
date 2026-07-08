'use client'

import { useState, useRef } from "react"
import { saveSettings } from "./actions"
import { toast } from "sonner"
import { Save, Upload, Loader2 } from "lucide-react"

export default function SettingsForm({ initialData, routers, role }: { initialData: Record<string, string>, routers: { id: string, name: string }[], role: string }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const data = new FormData()
    data.append("file", file)
    data.append("folder", "system")

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      })
      const result = await res.json()
      if (result.success) {
        if (role === 'SUPERADMIN') {
          setFormData(prev => ({ ...prev, appLogo: result.url }))
        } else {
          setFormData(prev => ({ ...prev, voucherLogo: result.url }))
        }
        toast.success("Logo berhasil diunggah!")
      } else {
        toast.error(result.error || "Gagal mengunggah logo")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await saveSettings(formData)
      toast.success("Pengaturan berhasil disimpan!")
      window.location.reload()
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1E293B] rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col gap-6">
      
      {/* App / Voucher Logo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">
          {role === 'SUPERADMIN' ? 'Logo Aplikasi Global' : 'Logo Cetak Voucher'}
        </label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
            {(role === 'SUPERADMIN' ? formData.appLogo : formData.voucherLogo) ? (
              <img src={role === 'SUPERADMIN' ? formData.appLogo : formData.voucherLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-500">No Logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <button 
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Unggah Logo Baru
            </button>
            <p className="text-xs text-slate-500 mt-2">Rekomendasi: Format PNG transparan (Max 2MB).<br/>Ukuran ideal: <b>720 x 280 pixel</b> (Rasio memanjang).</p>
          </div>
        </div>
      </div>

      {/* App / Voucher Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">
          {role === 'SUPERADMIN' ? 'Nama Aplikasi Global' : 'Nama Pada Cetak Voucher'}
        </label>
        <input 
          type="text" 
          name={role === 'SUPERADMIN' ? 'appName' : 'voucherName'}
          value={role === 'SUPERADMIN' ? (formData.appName || "") : (formData.voucherName || "")} 
          onChange={handleChange}
          placeholder="e.g. STARBUCK MANAGER"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          required
        />
      </div>

      {/* Default Router */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">Router Default (Otomatis Dipilih)</label>
        <select 
          name="defaultRouterId"
          value={formData.defaultRouterId} 
          onChange={handleChange}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">-- Tidak Ada Router Default --</option>
          {routers.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Router ini akan otomatis terpilih di menu cetak voucher dan dashboard.</p>
      </div>

      {/* Save Button */}
      <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end">
        <button 
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Pengaturan
        </button>
      </div>
    </form>
  )
}
