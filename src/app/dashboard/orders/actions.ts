'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function processOrder(orderId: string, voucherCode: string) {
  const session = await auth()
  
  // Ensure the user is an admin
  const admin = await prisma.user.findUnique({ where: { email: session?.user?.email || "" }})
  if (admin?.role !== 'ADMIN') {
    return { success: false, error: "Tidak diizinkan." }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PROCESSED",
        voucherCode: voucherCode.trim(),
        notes: null
      }
    })
    
    revalidatePath('/dashboard/orders')
    return { success: true, message: "Pesanan berhasil diproses!" }
  } catch (error: any) {
    return { success: false, error: "Gagal memproses pesanan: " + error.message }
  }
}

export async function rejectOrder(orderId: string, reason: string) {
  const session = await auth()
  
  const admin = await prisma.user.findUnique({ where: { email: session?.user?.email || "" }})
  if (admin?.role !== 'ADMIN') {
    return { success: false, error: "Tidak diizinkan." }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        notes: reason.trim(),
        voucherCode: null
      }
    })
    
    revalidatePath('/dashboard/orders')
    return { success: true, message: "Pesanan berhasil ditolak!" }
  } catch (error: any) {
    return { success: false, error: "Gagal menolak pesanan: " + error.message }
  }
}
