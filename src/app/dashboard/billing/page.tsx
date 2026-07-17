import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreditCard } from "lucide-react"
import { BillingClient } from "./BillingClient"
import { getBillingItems } from "./actions"

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await auth()
  
  if (!session?.user?.email && !session?.user?.name) {
    redirect('/login')
  }

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

  const items = await getBillingItems()

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-blue-500" />
            Tagihan & Layanan
          </h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Kelola pengingat jatuh tempo untuk layanan berbayar seperti VPS, Domain, dan VPN.
          </p>
        </div>
      </div>

      <BillingClient initialItems={items} />
    </div>
  )
}
