'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Tag, AlertCircle, Plus, Edit, Trash2, Activity, Save, X } from 'lucide-react'
import { createProfileAction, editProfileAction, deleteProfileAction } from './actions'
import { useRouter } from 'next/navigation'

interface ProfileProps {
  routerId: string
  profiles: {
    name: string
    sharedUsers: string
    rateLimit: string
    price: number
  }[]
  errorMessage?: string
}

export default function ProfileClient({ routerId, profiles, errorMessage }: ProfileProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [originalName, setOriginalName] = useState("")
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sharedUsers: "1",
    rateLimit: "",
    price: ""
  })
  const [isSaving, setIsSaving] = useState(false)

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value).replace('Rp', 'Rp ')
  }

  const openCreateModal = () => {
    setModalMode('create')
    setFormData({ name: "", sharedUsers: "1", rateLimit: "1M/1M", price: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (p: any) => {
    setModalMode('edit')
    setOriginalName(p.name)
    setFormData({
      name: p.name,
      sharedUsers: p.sharedUsers || "1",
      rateLimit: p.rateLimit || "",
      price: p.price ? p.price.toString() : ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (profileName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus profil "${profileName}" secara permanen dari MikroTik?`)) return
    
    setIsSaving(true)
    const res = await deleteProfileAction(routerId, profileName)
    setIsSaving(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal menghapus profil")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      name: formData.name,
      sharedUsers: formData.sharedUsers,
      rateLimit: formData.rateLimit,
      price: parseInt(formData.price) || 0
    }

    let res;
    if (modalMode === 'create') {
      res = await createProfileAction(routerId, payload)
    } else {
      res = await editProfileAction(routerId, originalName, payload)
    }

    setIsSaving(false)

    if (res.success) {
      setIsModalOpen(false)
      router.refresh()
    } else {
      alert(res.error || "Gagal menyimpan profil")
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/50 antialiased" 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' 
      }}
    >
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="py-6 px-6 border-b border-slate-700 bg-[#0F172A] text-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {modalMode === 'create' ? 'Tambah Profil Baru' : 'Edit Profil'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nama Profil</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              placeholder="Misal: 1-BULAN"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shared Users</label>
              <input
                type="number"
                min="1"
                required
                value={formData.sharedUsers}
                onChange={(e) => setFormData({...formData, sharedUsers: e.target.value})}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rate Limit</label>
              <input
                type="text"
                value={formData.rateLimit}
                onChange={(e) => setFormData({...formData, rateLimit: e.target.value})}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="1M/1M"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Harga Jual (Rp)</label>
            <div className="relative flex items-center">
              <span className="absolute text-slate-400 font-bold text-lg" style={{ left: '1.25rem' }}>Rp</span>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-lg outline-none"
                style={{ paddingLeft: '3.5rem' }}
                placeholder="50000"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Masukkan angka saja tanpa titik
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {isSaving ? (
                'Menyimpan...'
              ) : (
                <><Save className="w-4 h-4" /> Simpan Profil</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (errorMessage) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 mb-6">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-500" />
              Manajemen Profil Hotspot
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Buat, edit, atur kecepatan, dan tentukan harga jual untuk setiap profil MikroTik Anda.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Profil
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left whitespace-nowrap">
              <thead className="text-sm text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-semibold rounded-tl-lg">Nama Profil</th>
                  <th className="px-5 py-4 font-semibold">Speed Limit</th>
                  <th className="px-5 py-4 font-semibold">Shared Users</th>
                  <th className="px-5 py-4 font-semibold">Harga (Rp)</th>
                  <th className="px-5 py-4 font-semibold text-right rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length > 0 ? (
                  profiles.map((p) => (
                    <tr key={p.name} className="border-b border-slate-800/50 hover:bg-[#0F172A]/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-200">
                        {p.name}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-blue-400 text-base font-mono">
                          <Activity className="w-4 h-4" />
                          <span>{p.rateLimit || 'Unlimited'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-400 text-base">
                          <Users className="w-4 h-4" />
                          <span>{p.sharedUsers}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold text-lg ${p.price > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.price > 0 ? formatIDR(p.price) : 'Belum Diset'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit Profil"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.name)}
                            disabled={p.name === 'default' || isSaving}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title={p.name === 'default' ? "Profil Default tidak bisa dihapus" : "Hapus Profil"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-base">
                      Tidak ada profil ditemukan di router ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL TAMBAH / EDIT DENGAN PORTAL */}
      {mounted && isModalOpen && createPortal(modalContent, document.body)}
    </div>
  )
}
