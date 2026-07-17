"use server"

import { generateVouchers, addManualVoucher, getHotspotServers, getHotspotProfiles } from "@/lib/mikrotik"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function fetchRouterDetails(routerId: string) {
  try {
    const servers = await getHotspotServers(routerId)
    const profiles = await getHotspotProfiles(routerId)
    return { servers, profiles }
  } catch (error) {
    return { servers: [], profiles: [] }
  }
}

export async function processGenerateVoucher(formData: FormData) {
  const routerId = formData.get("routerId") as string
  const server = formData.get("server") as string
  const profile = formData.get("profile") as string
  const amount = parseInt(formData.get("amount") as string)
  const length = parseInt(formData.get("length") as string)
  const limitUptime = formData.get("limitUptime") as string

  if (!routerId || !server || !profile || !amount || !length) {
    return { error: "Semua field harus diisi" }
  }

  if (amount > 100) {
    return { error: "Maksimal generate adalah 100 voucher sekali proses" }
  }

  const result = await generateVouchers(routerId, { server, profile, amount, length, limitUptime })
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true, batchId: result.batchId, vouchers: result.vouchers }
  } else {
    return { error: result.error }
  }
}

export async function generateManualAction(
  routerId: string, 
  data: { server: string, profile: string, name: string, password?: string, waNumber?: string }
) {
  if (!routerId) {
    return { error: "Router belum dipilih." }
  }

  const result = await addManualVoucher(routerId, data)
  
  if (result.success) {
    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}

export async function processManualVoucher(formData: FormData) {
  const routerId = formData.get("routerId") as string
  const server = formData.get("server") as string
  const profile = formData.get("profile") as string
  const name = formData.get("name") as string
  const password = (formData.get("password") as string) || (formData.get("name") as string)
  const waNumber = formData.get("waNumber") as string
  const customerName = formData.get("customerName") as string
  const limitUptime = formData.get("limitUptime") as string

  if (!routerId || !server || !profile || !name) {
    return { error: "Semua field yang wajib harus diisi" }
  }

  const result = await addManualVoucher(routerId, { server, profile, name, password, waNumber, customerName, limitUptime })
  
  if (result.success) {
    // Simpan kontak secara otomatis jika ada nomor WA
    if (waNumber && waNumber.trim() !== "") {
      try {
        const cleanNumber = waNumber.replace(/\D/g, '');
        const contactName = customerName || name || cleanNumber;
        await prisma.savedContact.upsert({
          where: { waNumber: cleanNumber },
          update: { name: contactName },
          create: { waNumber: cleanNumber, name: contactName }
        });
      } catch (err) {
        console.error("Gagal menyimpan kontak:", err);
      }
    }

    revalidatePath("/dashboard/voucher")
    return { success: true }
  } else {
    return { error: result.error }
  }
}
