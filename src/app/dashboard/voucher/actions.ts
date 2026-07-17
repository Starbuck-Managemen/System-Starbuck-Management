"use server"

import { deleteVoucher, changeUserProfile, updateVoucherWA, renewVoucher, disableVoucher } from "@/lib/mikrotik"
import { revalidatePath } from "next/cache"

export async function updateWAAction(routerId: string, voucherName: string, waNumber: string, remainingDays?: number) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
  }

  const result = await updateVoucherWA(routerId, voucherName, waNumber, remainingDays)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}



export async function renewVoucherAction(routerId: string, voucherName: string) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
  }

  const result = await renewVoucher(routerId, voucherName)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}

export async function disableVoucherAction(routerId: string, voucherName: string) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
  }

  const result = await disableVoucher(routerId, voucherName)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}

import prisma from "@/lib/prisma"
import { enrichVoucher } from "@/lib/mikrotikUtils"
import { getVouchers } from "@/lib/mikrotik"

export async function deleteVoucherAction(routerId: string, voucherName: string) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
  }

  // 1. Ambil data voucher untuk menyimpan jejak pendapatannya
  try {
    const router = await prisma.router.findUnique({ where: { id: routerId } })
    if (router) {
      const vouchers = await getVouchers(routerId)
      const targetVoucher = vouchers.find((v: any) => v.name === voucherName)
      
      if (targetVoucher) {
        const dbProfiles = await prisma.profile.findMany({ where: { routerId } })
        const priceMap = new Map<string, number>()
        dbProfiles.forEach(p => priceMap.set(p.name, p.price))
        
        const enriched = enrichVoucher(targetVoucher, priceMap)
        
        const existingTx = await prisma.transaction.findFirst({
          where: { username: voucherName, createdAt: enriched.createdAt }
        })
        
        if (!existingTx) {
          await prisma.transaction.create({
            data: {
              userId: router.userId,
              amount: enriched.price,
              type: "Income",
              username: voucherName,
              voucherType: enriched.actualProfile,
              activeAt: enriched.createdAt,
              expiresAt: enriched.expiresAt,
              createdAt: enriched.createdAt,
            }
          })
        }
      }
    }
  } catch (e) {
    console.error("Gagal menyimpan backup transaksi:", e)
  }

  const result = await deleteVoucher(routerId, voucherName)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}

export async function changeProfileAction(routerId: string, voucherName: string, newProfile: string) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
  }

  const result = await changeUserProfile(routerId, voucherName, newProfile)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}
