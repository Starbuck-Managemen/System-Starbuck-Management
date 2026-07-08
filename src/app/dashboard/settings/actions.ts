'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function getSettings(userId?: string, role?: string, adminId?: string) {
  const settings = await prisma.setting.findMany()
  
  // Default values
  const defaultSettings = {
    appName: "STARBUCK MANAGER",
    appLogo: "/logo.jpg",
    themeColor: "blue",
    defaultRouterId: "",
    voucherName: "",
    voucherLogo: "",
  }
  
  const parsed = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)
  
  const result = { ...defaultSettings, ...parsed }

  const targetId = role === 'USER' && adminId ? adminId : userId;
  if (targetId && role !== 'SUPERADMIN') {
    if (parsed[`${targetId}_voucherName`]) result.voucherName = parsed[`${targetId}_voucherName`];
    if (parsed[`${targetId}_voucherLogo`]) result.voucherLogo = parsed[`${targetId}_voucherLogo`];
    if (parsed[`${targetId}_defaultRouterId`]) result.defaultRouterId = parsed[`${targetId}_defaultRouterId`];
  }
  
  return result
}

export async function saveSettings(data: Record<string, string>) {
  const session = await auth()
  const role = (session as any)?.user?.role || (session as any)?.role
  const userId = (session as any)?.user?.id || (session as any)?.id

  if (role === "SUPERADMIN") {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
  } else if (role === "ADMIN") {
    const allowedKeys = ['voucherName', 'voucherLogo', 'defaultRouterId']
    for (const [key, value] of Object.entries(data)) {
      if (allowedKeys.includes(key)) {
        const prefixedKey = `${userId}_${key}`;
        await prisma.setting.upsert({
          where: { key: prefixedKey },
          update: { value },
          create: { key: prefixedKey, value },
        })
      }
    }
  } else {
    throw new Error("Unauthorized")
  }
  
  return { success: true }
}
