'use client'

import { useActionState } from 'react'
import { createUser } from '../actions'
import { ArrowLeft, UserPlus, Save } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AddUserPage() {
  const [state, formAction, isPending] = useActionState(createUser, { error: null })

  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/user" className="flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-200 transition-colors mb-3 font-medium">
            <ArrowLeft className="h-[14px] w-[14px]" />
            Kembali ke User Management
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <UserPlus className="h-7 w-7" />
            Tambah User Baru
          </h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Formulir untuk menambahkan akun pengguna baru ke dalam sistem.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-[#1E293B] rounded-2xl shadow-md p-6 sm:p-8 mt-2">
        <form action={formAction} className="flex flex-col gap-6">
          
          {/* Error Alert */}
          {state?.error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-[13px] font-medium">
              {state.error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[13px] font-medium text-slate-300 ml-1">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Masukkan Nama"
                required
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username" className="text-[13px] font-medium text-slate-300 ml-1">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan Username"
                required
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-slate-300 ml-1">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan Email"
                required
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-[13px] font-medium text-slate-300 ml-1">No. WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                type="text"
                placeholder="Contoh: 6281234567890"
                required
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-slate-300 ml-1">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan Password"
                required
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 text-[13px]"
              />
            </div>
            
            <div className="grid gap-2 md:col-span-2 relative">
              <Label htmlFor="role" className="text-[13px] font-medium text-slate-300 ml-1">Role</Label>
              <select 
                id="role"
                name="role"
                required
                className="w-full bg-[#0b1220] border border-slate-700 rounded-xl h-12 px-4 text-[13px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="ADMIN">Administrator</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-6 border-t border-slate-700/50">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? 'Menyimpan...' : (
                <>
                  <Save className="h-[18px] w-[18px]" />
                  Simpan User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
