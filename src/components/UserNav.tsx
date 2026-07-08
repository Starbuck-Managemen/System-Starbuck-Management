'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Key, Settings, LogOut, ChevronDown } from 'lucide-react'
import { logOut } from '@/app/login/actions'
import Link from 'next/link'

export function UserNav({ user }: { user?: { name?: string | null, email?: string | null, role?: string | null, image?: string | null } }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayName = user?.name || "System Administrator"
  const displayRole = user?.role || "Administrator"

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg border border-transparent transition-colors outline-none focus:outline-none ${isOpen ? 'border-slate-700 bg-[#0F172A]' : 'hover:border-slate-700 hover:bg-[#0F172A]'}`}
      >
        <div className="flex flex-col text-right max-w-[100px] sm:max-w-[150px]">
          <span className="text-[13px] font-bold text-slate-100 leading-tight truncate">{displayName}</span>
          <span className="text-[11px] font-medium text-slate-400 truncate">{displayRole}</span>
        </div>
        <div className="h-9 w-9 rounded-full bg-[#1E293B] border border-slate-600 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#1E293B] border border-slate-700 shadow-xl overflow-hidden py-1 z-50">
          <Link href="/dashboard/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#0F172A] hover:text-slate-100 transition-colors" onClick={() => setIsOpen(false)}>
            <User className="h-[18px] w-[18px]" />
            Pengaturan Akun
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#0F172A] hover:text-slate-100 transition-colors" onClick={() => setIsOpen(false)}>
            <Settings className="h-[18px] w-[18px]" />
            Pengaturan Sistem
          </Link>
          <div className="h-px bg-slate-700 my-1 mx-2"></div>
          <form action={logOut} className="w-full">
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[#0F172A] hover:text-red-300 transition-colors">
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
