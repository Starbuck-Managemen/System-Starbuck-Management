'use client'

import { useActionState, useState } from 'react'
import { registerUser } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Star } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, { error: null })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
      <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
        <CardContent className="flex flex-col items-center justify-center pt-2">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center justify-center mb-8">
            <Star className="w-10 h-10 fill-blue-500 text-blue-500 mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Buat Akun</h1>
            <p className="text-xs text-slate-400 mt-2 font-light">Daftar untuk mengakses buckNet Manager</p>
          </div>

          {/* Form */}
          <form action={formAction} className="w-full flex flex-col gap-5">
            
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-normal text-slate-300 ml-1">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Masukkan Nama Lengkap"
                required
                disabled={isPending}
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username" className="text-xs font-normal text-slate-300 ml-1">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Buat Username"
                required
                disabled={isPending}
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-normal text-slate-300 ml-1">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                disabled={isPending}
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
              />
            </div>

            <div className="grid gap-2 relative">
              <Label htmlFor="password" className="text-xs font-normal text-slate-300 ml-1">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat Password" 
                  required 
                  disabled={isPending}
                  className="bg-[#0b1220] border-slate-700 h-12 px-4 pr-12 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
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

            <div className="grid gap-2">
              <Label htmlFor="role" className="text-xs font-normal text-slate-300 ml-1">Daftar Sebagai</Label>
              <select
                id="role"
                name="role"
                required
                disabled={isPending}
                className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl text-sm text-slate-200 appearance-none border cursor-pointer"
              >
                <option value="USER">User (Akses Terbatas)</option>
                <option value="ADMIN">Admin (Akses Penuh)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? "Mendaftarkan..." : "Daftar"}
            </button>
            
            {state?.error && (
              <div className="text-sm text-red-500 text-center mt-1 font-medium bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                {state.error}
              </div>
            )}
          </form>

          <div className="mt-6 text-sm text-slate-400">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
              Login di sini
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
