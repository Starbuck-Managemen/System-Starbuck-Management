'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function getSettings() {
  const settings = await prisma.setting.findMany()
  
  // Default values
  const defaultSettings = {
    appName: "STARBUCK MANAGER",
    appLogo: "/logo.jpg",
    themeColor: "blue",
    defaultRouterId: "",
  }
  
  const parsed = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)
  
  return { ...defaultSettings, ...parsed }
}

export async function saveSettings(data: Record<string, string>) {
  const session = await auth()
  const role = (session as any)?.user?.role || (session as any)?.role
  
  if (role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  for (const [key, value] of Object.entries(data)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
  
  return { success: true }
}
