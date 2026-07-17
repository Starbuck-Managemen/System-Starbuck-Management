"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Star, Users, ArrowLeft, Home, MessageSquare, Network } from "lucide-react";

export function SuperAdminMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const closeMenu = () => setIsOpen(false)
  const isActive = (path: string) => pathname === path

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="md:hidden text-slate-400 hover:text-slate-50">
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />
          
          <div className="relative w-[260px] bg-[#111827] h-full flex flex-col border-r border-slate-800 animate-in slide-in-from-left duration-200">
            <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl leading-tight tracking-wide text-emerald-400 truncate max-w-[150px]">SUPER ADMIN</span>
                </div>
              </div>
              <button onClick={closeMenu} className="text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
              <Link href="/super-admin" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/super-admin') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <Home className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Dashboard</span>
              </Link>
              
              <Link href="/super-admin/clients" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/super-admin/clients') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <Users className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Manajemen Klien</span>
              </Link>
              
              <Link href="/super-admin/rentals" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/super-admin/rentals') || pathname.startsWith('/super-admin/rentals') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <Home className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Rumah Sewa</span>
              </Link>
              
              <Link href="/dashboard/wa-bot" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/wa-bot') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <MessageSquare className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">WA Bot</span>
              </Link>
              
              <Link href="/super-admin/tunnel-generator" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/super-admin/tunnel-generator') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <Network className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Tunnel Generator</span>
              </Link>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <Link href="/dashboard" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-blue-600 hover:text-white">
                  <ArrowLeft className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">Kembali ke App</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
