'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function createOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email && !session?.user?.name) {
    return { success: false, error: "Tidak diizinkan." }
  }

  const userId = formData.get('userId') as string
  const routerId = formData.get('routerId') as string
  const packageName = formData.get('packageName') as string
  const price = parseFloat(formData.get('price') as string)

  if (!userId || !routerId || !packageName) {
    return { success: false, error: "Data tidak lengkap." }
  }

  try {
    await prisma.order.create({
      data: {
        userId,
        routerId,
        packageName,
        price,
        status: "PENDING"
      }
    })
    
    revalidatePath('/dashboard/order')
    return { success: true, message: "Pesanan berhasil dibuat!" }
  } catch (error: any) {
    return { success: false, error: "Gagal membuat pesanan: " + error.message }
  }
}
