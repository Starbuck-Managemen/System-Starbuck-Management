"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

async function ensureSuperAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" }
  })
  
  if (user?.role !== "SUPERADMIN") {
    throw new Error("Forbidden")
  }
}

export async function extendSubscription(clientId: string, days: number = 30) {
  await ensureSuperAdmin()
  
  const client = await prisma.user.findUnique({ where: { id: clientId } })
  if (!client) throw new Error("Client not found")

  const now = new Date()
  let newEndDate = client.subscriptionEndsAt && client.subscriptionEndsAt > now 
    ? new Date(client.subscriptionEndsAt.getTime() + days * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: clientId },
    data: {
      subscriptionStatus: "Active",
      subscriptionEndsAt: newEndDate,
    }
  })
  
  revalidatePath("/super-admin/clients")
  return { success: true }
}

export async function extendForever(clientId: string) {
  await ensureSuperAdmin()
  
  await prisma.user.update({
    where: { id: clientId },
    data: {
      subscriptionStatus: "Active",
      subscriptionEndsAt: null,
      trialEndsAt: null,
    }
  })
  
  revalidatePath("/super-admin/clients")
  return { success: true }
}

export async function banClient(clientId: string) {
  await ensureSuperAdmin()
  
  await prisma.user.update({
    where: { id: clientId },
    data: {
      subscriptionStatus: "Banned"
    }
  })
  
  revalidatePath("/super-admin/clients")
  return { success: true }
}
