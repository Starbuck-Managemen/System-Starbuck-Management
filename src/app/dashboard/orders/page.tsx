import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ClipboardList, AlertCircle } from "lucide-react"
import { OrdersTable } from "./OrdersTable"
import { redirect } from "next/navigation"

export default async function AdminOrdersPage() {
  const session = await auth()
  
  if (!session?.user?.email && !session?.user?.name) {
    return null
  }

  // Get user data
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

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get all routers
  const routers = await prisma.router.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-blue-500" />
            Pesanan Masuk
          </h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Kelola dan proses pesanan voucher dari pengguna.
          </p>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <OrdersTable initialOrders={orders} routers={routers} />
      </div>

    </div>
  )
}
