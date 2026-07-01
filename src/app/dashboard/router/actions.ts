"use server"

import prisma from "@/lib/prisma"
import { getMikrotikClient } from "@/lib/mikrotik"

export async function createRouter(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const host = formData.get("host") as string
    const apiPort = parseInt(formData.get("apiPort") as string) || 8728
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const status = formData.get("status") as string

    if (!name || !host || !username) {
      return { error: "Nama, Host, dan Username wajib diisi" }
    }

    await prisma.router.create({
      data: {
        name,
        host,
        apiPort,
        username,
        password,
        status,
      }
    })

    revalidatePath("/dashboard/router")
    return { success: "Router berhasil ditambahkan!" }
  } catch (error: any) {
    console.error("Create Router Error:", error)
    return { error: "Terjadi kesalahan pada database." }
  }
}

import { revalidatePath } from "next/cache"

export async function updateRouter(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const host = formData.get("host") as string
    const apiPort = parseInt(formData.get("apiPort") as string) || 8728
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const status = formData.get("status") as string

    if (!name || !host || !username) {
      return { error: "Nama, Host, dan Username wajib diisi" }
    }

    const dataToUpdate: any = {
      name,
      host,
      apiPort,
      username,
      status,
    }

    // Only update password if it's provided
    if (password) {
      dataToUpdate.password = password
    }

    await prisma.router.update({
      where: { id },
      data: dataToUpdate
    })

    revalidatePath("/dashboard/router")
    return { success: "Router berhasil diperbarui!" }
  } catch (error: any) {
    console.error("Update Router Error:", error)
    return { error: "Terjadi kesalahan pada database." }
  }
}

export async function checkRouterStatus(id: string) {
  const startTime = Date.now()
  let status = "Offline"
  let ping: number | null = null

  try {
    const client = await getMikrotikClient(id)
    ping = Date.now() - startTime
    
    // Jika ping lebih dari 2000ms (2 detik) dianggap Buruk
    if (ping > 2000) {
      status = "Buruk"
    } else {
      status = "Online"
    }
    
    // Selalu tutup koneksi setelah test
    client.close()
    
    // Opsional: Update status di database agar data statisnya tidak terlalu usang
    await prisma.router.update({
      where: { id },
      data: { status }
    }).catch(() => {}) // Abaikan error jika update gagal

  } catch (error) {
    status = "Offline"
    
    await prisma.router.update({
      where: { id },
      data: { status }
    }).catch(() => {})
  }

  return { status, ping }
}

export async function deleteRouter(id: string) {
  try {
    await prisma.router.delete({
      where: { id }
    })
    revalidatePath("/dashboard/router")
  } catch (error) {
    console.error("Delete Router Error:", error)
  }
}
