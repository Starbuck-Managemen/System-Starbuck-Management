import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ShoppingCart } from "lucide-react"
import { OrderForm } from "./OrderForm"
import { OrderHistory } from "./OrderHistory"

export default async function UserOrderPage() {
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

  if (!dbUser) return null

  // Get the first router to serve as the default source for profiles
  const defaultRouter = await prisma.router.findFirst()

  let profiles = []
  if (defaultRouter) {
    profiles = await prisma.profile.findMany({
      where: { routerId: defaultRouter.id }
    })
  }

  // Get order history
  const orders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' }
  })

  // Mark all unread PROCESSED orders as read
  await prisma.order.updateMany({
    where: { 
      userId: dbUser.id, 
      status: 'PROCESSED',
      isRead: false
    },
    data: {
      isRead: true
    }
  })

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-blue-500" />
          Beli Voucher
        </h1>
        <p className="text-[13px] text-slate-400 mt-2 font-medium">
          Pilih dan pesan paket internet yang Anda butuhkan. Pesanan Anda akan langsung dikirim ke Admin untuk diproses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OrderForm user={dbUser} profiles={profiles} routerId={defaultRouter?.id} />
        <OrderHistory orders={orders} />
      </div>

    </div>
  )
}
