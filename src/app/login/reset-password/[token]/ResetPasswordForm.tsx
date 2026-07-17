'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { KeyRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { updatePasswordWithToken } from './actions'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
    >
      {pending ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : (
        <>
          Simpan Password Baru
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  )
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [success, setSuccess] = useState(false)

  async function action(formData: FormData) {
    const pw = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!pw || pw.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }

    if (pw !== confirm) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    const res = await updatePasswordWithToken(token, pw)
    if (res.error) {
      toast.error(res.error)
    } else {
      setSuccess(true)
      toast.success(res.message)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-inter">
        <div className="max-w-md w-full bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Berhasil Diubah!</h2>
          <p className="text-slate-400 mb-6">
            Akun Anda kini lebih aman. Silakan login menggunakan password baru Anda.
          </p>
          <a href="/login" className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all">
            Pergi ke Halaman Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-inter relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Buat Password Baru</h1>
            <p className="text-slate-400 text-sm mt-2">
              Silakan masukkan password baru Anda yang kuat dan mudah diingat.
            </p>
          </div>

          <form action={action} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Konfirmasi Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  name="confirm"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
