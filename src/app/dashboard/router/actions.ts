"use server"

import prisma from "@/lib/prisma"
import { getMikrotikClient } from "@/lib/mikrotik"
import { auth } from "@/auth"

export async function createRouter(formData: FormData) {
  try {
    const session = await auth()
    const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null
    
    if (!dbUser) {
      return { error: "Anda harus login untuk membuat router" }
    }
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
        userId: dbUser.id
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
    const session = await auth()
    const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null
    
    if (!dbUser) return { error: "Anda harus login." }

    const existingRouter = await prisma.router.findUnique({ where: { id } })
    if (!existingRouter) return { error: "Router tidak ditemukan." }
    
    if (existingRouter.userId !== dbUser.id && dbUser.role !== 'SUPERADMIN') {
      return { error: "Akses ditolak. Router ini bukan milik Anda." }
    }
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
    
    // Only SUPERADMIN can change ownership
    if (dbUser.role === 'SUPERADMIN') {
      const formUserId = formData.get("userId") as string
      if (formUserId) {
        dataToUpdate.userId = formUserId
      }
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

  let cause = undefined;
  
  try {
    const client = await getMikrotikClient(id)
    ping = Date.now() - startTime
    
    // Cek apakah router benar-benar punya akses internet (ping 8.8.8.8)
    let hasInternet = true;
    try {
      const pingResult = await (client as any).rosApi.write('/ping', ['=address=8.8.8.8', '=count=2']);
      if (Array.isArray(pingResult) && pingResult.length > 0) {
        const timeouts = pingResult.filter((p: any) => p.status === 'timeout' || !p.time);
        if (timeouts.length === pingResult.length) {
          hasInternet = false;
        }
      }
    } catch (e) {
      console.error("Ping error:", e);
    }
    
    client.close()

    if (!hasInternet) {
      status = "Offline"
      cause = "INTERNET_DOWN"
    } else if (ping > 2000) {
      status = "Buruk"
    } else {
      status = "Online"
    }
    
    // Opsional: Update status di database agar data statisnya tidak terlalu usang
    await prisma.router.update({
      where: { id },
      data: { status }
    }).catch(() => {}) // Abaikan error jika update gagal

  } catch (error) {
    status = "Offline"
    cause = "VPN_DOWN"
    
    await prisma.router.update({
      where: { id },
      data: { status }
    }).catch(() => {})
  }

  return { status, ping, cause }
}

export async function deleteRouter(id: string) {
  try {
    const session = await auth()
    const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null
    
    if (!dbUser) return { error: "Anda harus login." }

    const existingRouter = await prisma.router.findUnique({ where: { id } })
    if (!existingRouter) return { error: "Router tidak ditemukan." }
    
    if (existingRouter.userId !== dbUser.id && dbUser.role !== 'SUPERADMIN') {
      return { error: "Akses ditolak. Router ini bukan milik Anda." }
    }

    await prisma.router.delete({
      where: { id }
    })
    revalidatePath("/dashboard/router")
  } catch (error) {
    console.error("Delete Router Error:", error)
  }
}
