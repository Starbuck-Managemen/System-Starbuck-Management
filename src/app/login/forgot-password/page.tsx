'use client'

import { useActionState, useState } from 'react'
import { requestPasswordReset } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [errorMessage, dispatch, isPending] = useActionState(requestPasswordReset, undefined)
  const [success, setSuccess] = useState(false)

  // Intercept the form submission to show success state if no error
  const actionWrapper = async (formData: FormData) => {
    const result = await dispatch(formData)
    if (result === 'success') {
      setSuccess(true)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
      <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
        <CardContent className="flex flex-col items-center justify-center pt-2">
          
          <div className="flex flex-col items-center justify-center mb-8">
            <KeyRound className="w-10 h-10 text-blue-500 mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Lupa Password?</h1>
            <p className="text-xs text-slate-400 mt-2 font-light text-center">
              Masukkan username Anda. Kami akan mengirimkan instruksi ke nomor WhatsApp yang terdaftar di akun Anda.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center w-full gap-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-sm w-full">
                Link reset password telah dikirim ke WhatsApp Anda! Silakan periksa pesan dari Bot buckNet.
              </div>
              <Link href="/login" className="w-full">
                <button type="button" className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Kembali ke Login
                </button>
              </Link>
            </div>
          ) : (
            <form action={actionWrapper} className="w-full flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-xs font-normal text-slate-300 ml-1">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="masukkan username"
                  required
                  disabled={isPending}
                  className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? "Memproses..." : "Kirim Link Reset WA"}
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
                <ArrowLeft size={16} /> Kembali ke Login
              </Link>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
