import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { User, Shield } from "lucide-react"
import Link from "next/link"
import { AccountForm } from "./AccountForm"
import { AvatarUpload } from "./AvatarUpload"

export default async function AccountPage() {
  const session = await auth()
  
  if (!session?.user?.email && !session?.user?.name) {
    return null
  }

  // Get fresh user data
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

  if (!dbUser) return null

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <User className="h-7 w-7 text-blue-500" />
            Pengaturan Akun
          </h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Kelola profil pribadi dan keamanan akun Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Sidebar Info */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col items-center text-center">
            
            {/* Component Upload Avatar (Client Component) */}
            <AvatarUpload user={dbUser} />

            <h2 className="text-xl font-bold text-slate-100 mt-4">{dbUser.name}</h2>
            <p className="text-sm text-slate-400">@{dbUser.username}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/50">
              <Shield className="h-3.5 w-3.5" />
              {dbUser.role}
            </div>
          </div>
        </div>

        {/* Form Settings */}
        <div className="col-span-1 md:col-span-2">
          <AccountForm user={dbUser} />
        </div>

      </div>

    </div>
  )
}
