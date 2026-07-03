'use client'

import { useActionState, useState } from 'react'
import { updateAccount } from './actions'
import { Save, Key, User, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function AccountForm({ user }: { user: any }) {
  const [state, formAction, isPending] = useActionState(updateAccount, { success: false, error: '', message: '' })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-800 shadow-sm">
      <h2 className="text-lg font-bold text-slate-100 mb-6">Informasi Dasar</h2>
      
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="userId" value={user.id} />

        <div className="grid gap-2">
          <label htmlFor="name" className="text-[13px] font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Nama Lengkap
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name || ''}
            disabled
            className="bg-[#0b1220]/50 border border-slate-700/50 h-12 px-4 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-[13px] font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" /> Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email || ''}
            disabled
            className="bg-[#0b1220]/50 border border-slate-700/50 h-12 px-4 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="phone" className="text-[13px] font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> No. WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            defaultValue={user.phone || ''}
            placeholder="Contoh: 6281234567890"
            className="bg-[#0b1220] border border-slate-700 h-12 px-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-[13px] font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" /> Password Baru (Opsional)
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Biarkan kosong jika tidak diubah"
              className="w-full bg-[#0b1220] border border-slate-700 h-12 px-4 pr-12 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl text-sm text-slate-200 placeholder:text-slate-600"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {state?.error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-3 rounded-xl text-sm font-medium">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="bg-green-900/20 border border-green-900/50 text-green-400 p-3 rounded-xl text-sm font-medium">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Link
            href="/dashboard"
            className="bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Exit
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-[18px] h-[18px]" />
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  )
}
