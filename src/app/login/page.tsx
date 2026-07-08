'use client'

import { useActionState, useState, useEffect } from 'react'
import { authenticate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { getSettings } from "@/app/dashboard/settings/actions"

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({ appName: "STARBUCK MANAGER", appLogo: "/logo.jpg" })

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#0F172A]">
      <Card className="w-full max-w-[420px] border-0 bg-[#1E293B] text-slate-100 shadow-2xl rounded-[20px] py-8 px-4 sm:px-6">
        <CardContent className="flex flex-col items-center justify-center pt-2">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img src={settings.appLogo} alt={`${settings.appName} Logo`} className="w-72 h-28 object-cover object-center rounded-2xl shadow-lg" />
          </div>

          {/* Form */}
          <form action={dispatch} className="w-full flex flex-col gap-6">
            
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

            <div className="grid gap-2 relative">
              <Label htmlFor="password" className="text-xs font-normal text-slate-300 ml-1">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan Password" 
                  required 
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

            <div className="flex items-center justify-between mt-1 mb-2 px-1">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded border-slate-600 bg-[#0b1220] checked:bg-blue-500 checked:border-blue-500 focus:ring-blue-500 focus:ring-offset-[#1E293B] cursor-pointer" 
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-slate-300 font-medium cursor-pointer"
                >
                  Remember Me
                </label>
              </div>
              <Link href="/login/forgot-password" className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? "Signing In..." : "Sign In"}
            </button>
            
            {errorMessage && (
              <div className="text-sm text-red-500 text-center mt-2">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="mt-6 text-sm text-slate-400 text-center">
            Belum punya akun?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
              Daftar sekarang
            </Link>
          </div>

          <div className="mt-8 text-[11px] text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} {settings.appName}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
