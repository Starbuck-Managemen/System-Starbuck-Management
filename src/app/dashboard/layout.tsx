import { auth, signOut } from "@/auth"
import { Home, Users, Ticket, Wifi, FileText, Settings, Search, Bell, Menu, Star, User, Tag, BookOpen, ShoppingCart, ClipboardList } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/UserNav"
import { Breadcrumb } from "@/components/Breadcrumb"
import { Clock } from "@/components/Clock"
import { NotificationBell } from "@/components/NotificationBell"
import { MobileSidebar } from "@/components/MobileSidebar"
import { Toaster } from "sonner"
import { SessionPing } from "@/components/SessionPing"
import { ForceLogout } from "@/components/ForceLogout"

import prisma from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  let dbUser = null
  if (session?.user && (session.user as any).id) {
    dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    })
  } else if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
  } else if (session?.user?.name) {
    dbUser = await prisma.user.findFirst({
      where: { username: session.user.name }
    })
  }

  if (dbUser && session?.user && (session.user as any).sessionToken) {
    if (dbUser.currentSessionToken !== (session.user as any).sessionToken) {
      return <ForceLogout message="Sesi Anda berakhir karena akun Anda baru saja login di perangkat lain." />
    }
  }
  
  let pendingOrdersCount = 0
  let unreadOrdersCount = 0
  
  if (dbUser?.role === 'ADMIN') {
    pendingOrdersCount = await prisma.order.count({
      where: { status: 'PENDING' }
    })
  } else if (dbUser?.role === 'USER') {
    unreadOrdersCount = await prisma.order.count({
      where: { 
        userId: dbUser.id,
        status: 'PROCESSED',
        isRead: false
      }
    })
  }

  // TODO: Ganti dengan data error aktual dari backend
  const errorCount = 0 

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] text-slate-100 font-sans print:bg-white print:text-black">
      <Toaster theme="dark" richColors position="top-center" />
      
      {/* Sidebar */}
      <aside className="hidden w-[260px] flex-col bg-[#111827] border-r border-slate-800 md:flex print:hidden">
        <div className="flex h-20 items-center px-6 gap-3 border-b border-slate-800">
          <Star className="w-7 h-7 fill-blue-600 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight tracking-wide">buckNet</span>
            <span className="text-[11px] text-slate-400 font-medium">Manager</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
            <Home className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Dashboard</span>
          </Link>
          
          {dbUser?.role === 'ADMIN' && (
            <Link href="/dashboard/user" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
              <Users className="h-[18px] w-[18px]" />
              <span className="font-semibold text-[13px]">User</span>
            </Link>
          )}

          {dbUser?.role !== 'ADMIN' && (
            <Link href="/dashboard/order" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
              <ShoppingCart className="h-[18px] w-[18px]" />
              <span className="font-semibold text-[13px] flex-1">Beli Voucher</span>
              {unreadOrdersCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse">
                  {unreadOrdersCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/dashboard/voucher" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
            <Ticket className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Data Voucher</span>
          </Link>

          {dbUser?.role === 'ADMIN' && (
            <>
              <Link href="/dashboard/router" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
                <Wifi className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Router</span>
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
                <Tag className="h-[18px] w-[18px]" />
                <span className="font-semibold text-[13px]">Profile & Harga</span>
              </Link>
              <Link href="/dashboard/orders" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
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

          <Link href="/dashboard/report" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
            <FileText className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Laporan</span>
          </Link>
          
          {dbUser?.role === 'ADMIN' && (
            <Link href="/dashboard/guide" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50">
              <BookOpen className="h-[18px] w-[18px]" />
              <span className="font-semibold text-[13px]">Panduan Penggunaan</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible print:h-auto">
        {/* Header */}
        <header className="flex h-20 items-center justify-between bg-[#1E293B] px-4 md:px-8 border-b border-slate-800 shadow-sm shrink-0 print:hidden">
          
          <div className="flex items-center gap-4">
            <MobileSidebar 
              dbUser={dbUser} 
              pendingOrdersCount={pendingOrdersCount} 
              unreadOrdersCount={unreadOrdersCount} 
            />
            <div className="hidden md:flex text-[13px] font-medium text-slate-400">
              <Breadcrumb />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 max-w-lg mx-auto">
             {/* Search bar removed per user request */}
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="hidden lg:flex items-center gap-2 text-sm font-bold tracking-widest text-slate-100">
              <Clock loginTime={(session?.user as any)?.loginTime} />
            </div>
            <div className="flex items-center border-l border-slate-700 pl-4 ml-2">
              <UserNav user={dbUser || undefined} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0F172A] p-4 lg:p-8 print:overflow-visible print:p-0 print:h-auto print:block">
          {children}
          <SessionPing />
        </main>
      </div>
    </div>
  )
}
