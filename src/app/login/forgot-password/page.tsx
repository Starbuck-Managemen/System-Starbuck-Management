'use client'

import { useState, useTransition, useEffect } from 'react'
import { resetPasswordWithWA } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, ArrowLeft, CheckCircle2, MessageCircle, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { getSettings } from "@/app/dashboard/settings/actions"

export default function ForgotPasswordPage() {
  const [result, setResult] = useState<{ status: string; message?: string; newPassword?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState({ appName: "SYSTEM", appLogo: "/logo.jpg" })

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await resetPasswordWithWA(undefined, formData)
      setResult(res)
    })
  }

  const handleCopy = () => {
    if (result?.newPassword) {
      navigator.clipboard.writeText(result.newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
      <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
        <CardContent className="flex flex-col items-center justify-center pt-2">

          {/* ===== FORM RESET ===== */}
          {!result || result.status === 'error' ? (
            <>
              <div className="flex flex-col items-center justify-center mb-8">
                <img src={settings.appLogo} alt="Logo" className="w-16 h-16 object-contain mb-4 rounded-xl shadow-md" />
                <h1 className="text-2xl font-bold tracking-tight">Lupa Password?</h1>
                <p className="text-xs text-slate-400 mt-2 font-light text-center">
                  Masukkan username dan nomor WhatsApp Anda. Password baru akan dikirim langsung ke WhatsApp Anda.
                </p>
              </div>

              <form action={handleSubmit} className="w-full flex flex-col gap-5">
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

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-xs font-normal text-slate-300 ml-1">Nomor WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="contoh: 6281234567890"
                    required
                    disabled={isPending}
                    className="bg-[#0b1220] border-slate-700 h-12 px-4 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl placeholder:text-slate-500 placeholder:text-sm"
                  />
                  <p className="text-[11px] text-slate-500 ml-1">Gunakan format 62xxx (tanpa tanda +)</p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-1"
                >
                  {isPending ? "Memproses..." : "Reset Password"}
                </button>

                {result?.status === 'error' && (
                  <div className="text-sm text-red-500 text-center mt-1">
                    {result.message}
                  </div>
                )}
              </form>

              <div className="mt-6 text-sm text-slate-400 text-center w-full">
                <Link href="/login" className="flex items-center justify-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors">
                  <ArrowLeft size={16} /> Kembali ke Login
                </Link>
              </div>
            </>
          ) : null}

          {/* ===== SUKSES: Password dikirim via WA ===== */}
          {result?.status === 'success_wa' && (
            <div className="flex flex-col items-center w-full gap-5">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              <h1 className="text-2xl font-bold tracking-tight">Password Terkirim!</h1>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-sm w-full">
                {result.message}
              </div>
              <p className="text-xs text-slate-400 text-center">
                Cek pesan WhatsApp dari Bot {settings.appName} untuk mendapatkan password baru Anda.
              </p>
              <Link href="/login" className="w-full">
                <button type="button" className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Pergi ke Halaman Login
                </button>
              </Link>
            </div>
          )}

          {/* ===== SUKSES: Bot WA offline, tampilkan password di layar ===== */}
          {result?.status === 'success_no_wa' && (
            <div className="flex flex-col items-center w-full gap-5">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Password Baru</h1>
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-center text-xs w-full">
                {result.message}
              </div>
              
              {/* Password display with copy button */}
              <div className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <code className="text-lg font-mono text-white tracking-widest">{result.newPassword}</code>
                <button 
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-white transition-colors p-2"
                  title="Salin password"
                >
                  {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                </button>
              </div>
              
              <p className="text-[11px] text-red-400/80 text-center">
                ⚠️ Catat atau salin password di atas. Halaman ini tidak bisa dibuka ulang.
              </p>

              <Link href="/login" className="w-full">
                <button type="button" className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Pergi ke Halaman Login
                </button>
              </Link>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
