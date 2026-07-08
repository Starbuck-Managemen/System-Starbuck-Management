"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Ticket, Wifi, FileText, Menu, Star, Tag, BookOpen, ShoppingCart, ClipboardList, X, MessageSquare } from "lucide-react"

interface MobileSidebarProps {
  dbUser: any;
  pendingOrdersCount: number;
  unreadOrdersCount: number;
  hasRouters?: boolean;
  appName?: string;
  appLogo?: string;
}

export function MobileSidebar({ dbUser, pendingOrdersCount, unreadOrdersCount, hasRouters = true, appName = "STARBUCK", appLogo = "/logo.jpg" }: MobileSidebarProps) {
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
                <img src={appLogo} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                <div className="flex flex-col">
                  <span className="font-bold text-xl leading-tight tracking-wide text-white truncate max-w-[150px]" title={appName}>{appName}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Manager</span>
                </div>
              </div>
              <button onClick={closeMenu} className="text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
              <Link href="/dashboard" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                <Home className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Dashboard</span>
              </Link>
              
              {(dbUser?.role === 'SUPERADMIN' || (dbUser?.role === 'ADMIN' && hasRouters)) && (
                <Link href="/dashboard/user" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/user') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <Users className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">User</span>
                </Link>
              )}

              {dbUser?.role === 'USER' && (
                <Link href="/dashboard/order" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/order') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px] flex-1">Beli Voucher</span>
                  {unreadOrdersCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse">
                      {unreadOrdersCount}
                    </span>
                  )}
                </Link>
              )}

              {(dbUser?.role !== 'ADMIN' || hasRouters) && (
                <Link href="/dashboard/voucher" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/voucher') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <Ticket className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">Data Voucher</span>
                </Link>
              )}

              {(dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPERADMIN') && (
                <>
                  <Link href="/dashboard/router" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/router') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                    <Wifi className="h-[18px] w-[18px]" />
                    <span className="font-semibold text-[13px]">Router</span>
                  </Link>
                  {(dbUser?.role === 'SUPERADMIN' || (dbUser?.role === 'ADMIN' && hasRouters)) && (
                    <>
                      <Link href="/dashboard/profile" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/profile') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                        <Tag className="h-[18px] w-[18px]" />
                        <span className="font-semibold text-[13px]">Profile & Harga</span>
                      </Link>
                      <Link href="/dashboard/orders" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/orders') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                        <ClipboardList className="h-[18px] w-[18px]" />
                        <span className="font-semibold text-[13px] flex-1">Pesanan Masuk</span>
                        {pendingOrdersCount > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse">
                            {pendingOrdersCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                </>
              )}

              {(dbUser?.role === 'SUPERADMIN' || (dbUser?.role === 'ADMIN' && hasRouters)) && (
                <Link href="/dashboard/report" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/report') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <FileText className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">Laporan</span>
                </Link>
              )}
              
              {dbUser?.role === 'ADMIN' && hasRouters && (
                <Link href="/dashboard/wa-bot" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/wa-bot') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <MessageSquare className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">WA Bot</span>
                </Link>
              )}
              
              {(dbUser?.role === 'SUPERADMIN' || (dbUser?.role === 'ADMIN' && hasRouters)) && (
                <Link href="/dashboard/guide" onClick={closeMenu} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive('/dashboard/guide') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}>
                  <BookOpen className="h-[18px] w-[18px]" />
                  <span className="font-semibold text-[13px]">Panduan Penggunaan</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
