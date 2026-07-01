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

export async function sendManualWAAction(waNumber: string, message: string) {
  try {
    const waResponse = await fetch('http://127.0.0.1:3001/send-wa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: waNumber, message })
    })

    if (waResponse.ok) {
      return { success: true }
    } else {
      const data = await waResponse.json()
      return { error: data.error || "Gagal mengirim dari Bot WA" }
    }
  } catch (error: any) {
    return { error: "Service Bot WhatsApp (Port 3001) tidak aktif atau belum di-scan." }
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
