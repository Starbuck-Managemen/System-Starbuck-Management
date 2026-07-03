'use client'

import { useActionState, useState, useEffect } from 'react'
import { resetPassword } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, EyeOff, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [errorMessage, dispatch, isPending] = useActionState(resetPassword, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Get token from URL
    const searchParams = new URLSearchParams(window.location.search)
    const t = searchParams.get('token')
    if (t) setToken(t)
  }, [])

  const actionWrapper = async (formData: FormData) => {
    formData.append('token', token)
    const result = await dispatch(formData)
    if (result === 'success') {
      setSuccess(true)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
        <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
          <CardContent className="flex flex-col items-center justify-center pt-2 text-center gap-4">
             <div className="text-red-400">Token tidak ditemukan atau tidak valid.</div>
             <Link href="/login/forgot-password" className="text-blue-500 hover:underline text-sm">Kembali ke Lupa Password</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
      <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
        <CardContent className="flex flex-col items-center justify-center pt-2">
          
          <div className="flex flex-col items-center justify-center mb-8">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Buat Password Baru</h1>
            <p className="text-xs text-slate-400 mt-2 font-light text-center">
              Silakan masukkan password baru yang kuat untuk akun Anda.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center w-full gap-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-sm w-full">
                Password Anda berhasil diubah! Anda sudah bisa menggunakan password baru untuk masuk.
              </div>
              <Link href="/login" className="w-full">
                <button type="button" className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Pergi ke Halaman Login
                </button>
              </Link>
            </div>
          ) : (
            <form action={actionWrapper} className="w-full flex flex-col gap-6">
              
              <div className="grid gap-2 relative">
                <Label htmlFor="password" className="text-xs font-normal text-slate-300 ml-1">Password Baru</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan Password Baru" 
                    required 
                    minLength={6}
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
              
              {errorMessage && errorMessage !== 'success' && (
                <div className="text-sm text-red-500 text-center mt-2">
                  {errorMessage}
                </div>
              )}
            </form>
          )}

          {!success && (
            <div className="mt-6 text-sm text-slate-400 text-center w-full">
              <Link href="/login" className="flex items-center justify-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors">
                <ArrowLeft size={16} /> Batal & Kembali ke Login
              </Link>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
