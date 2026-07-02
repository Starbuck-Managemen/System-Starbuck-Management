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

export async function deleteVoucherAction(routerId: string, voucherName: string) {
  if (!routerId || !voucherName) {
    return { error: "ID Router atau Nama Voucher tidak valid." }
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
