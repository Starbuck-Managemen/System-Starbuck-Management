import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Star, Users, ArrowLeft, Home, MessageSquare, Network, Router } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/UserNav"
import { Toaster } from "sonner"
import { SuperAdminMobileSidebar } from "@/components/SuperAdminMobileSidebar"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  let dbUser = null
  if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
  } else if (session?.user?.name) {
    dbUser = await prisma.user.findFirst({
      where: { username: session.user.name }
    })
  }

  if (!dbUser || dbUser.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] text-slate-100 font-sans">
      <Toaster theme="dark" richColors position="top-center" />
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[260px] flex-col bg-[#111827] border-r border-slate-800">
        <div className="flex h-20 items-center px-6 gap-3 border-b border-slate-800">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight tracking-wide text-emerald-400 truncate max-w-[170px]">SUPER ADMIN</span>
            <span className="text-[11px] text-slate-400 font-medium">Bucknet Manager</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <Link href="/super-admin" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <Home className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Dashboard</span>
          </Link>
          <Link href="/super-admin/clients" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <Users className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Manajemen Klien</span>
          </Link>
          <Link href="/super-admin/rentals" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <Home className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Rumah Sewa</span>
          </Link>
          <Link href="/dashboard/wa-bot" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <MessageSquare className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">WA Bot</span>
          </Link>
          <Link href="/super-admin/tunnel-generator" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <Network className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">Tunnel Generator</span>
          </Link>
          <Link href="/super-admin/mikrotik-manager" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-[#1E293B] hover:text-slate-50 focus:bg-emerald-600 focus:text-slate-50">
            <Router className="h-[18px] w-[18px]" />
            <span className="font-semibold text-[13px]">MikroTik VPN</span>
          </Link>
          
          <div className="pt-6 mt-6 border-t border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-blue-600 hover:text-white">
              <ArrowLeft className="h-[18px] w-[18px]" />
              <span className="font-semibold text-[13px]">Kembali ke App</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 items-center justify-between bg-[#1E293B] px-4 md:px-8 border-b border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center gap-4 md:hidden">
            <SuperAdminMobileSidebar />
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-5">
            <div className="flex items-center border-l border-slate-700 pl-4 ml-2">
              <UserNav user={dbUser} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0F172A] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
