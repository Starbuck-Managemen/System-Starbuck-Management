'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export type BillingItem = {
  id: string
  name: string
  amount: number
  dueDate: string // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY'
  website: string
  notes: string
  isPaid: boolean
  lastReminded?: number
}

export async function getBillingItems(): Promise<BillingItem[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'SUPERADMIN_BILLING_REMINDERS' }
  })

  if (!setting || !setting.value) {
    return []
  }

  try {
    return JSON.parse(setting.value) as BillingItem[]
  } catch {
    return []
  }
}

export async function saveBillingItems(items: BillingItem[]) {
  const session = await auth()
  const role = (session as any)?.user?.role || (session as any)?.role

  if (role !== "SUPERADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.setting.upsert({
      where: { key: 'SUPERADMIN_BILLING_REMINDERS' },
      update: { value: JSON.stringify(items) },
      create: { key: 'SUPERADMIN_BILLING_REMINDERS', value: JSON.stringify(items) },
    })
    
    revalidatePath('/dashboard/billing')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function togglePaidStatus(id: string, isPaid: boolean) {
  const items = await getBillingItems()
  const updatedItems = items.map(item => {
    if (item.id === id) {
      // If setting to paid, automatically push the due date to the next cycle?
      // For now, let's just mark it as paid. The user can manually edit it next month.
      // Or better, let's just toggle the flag.
      return { ...item, isPaid }
    }
    return item
  })
  
  return saveBillingItems(updatedItems)
}

export async function extendDueDate(id: string) {
  const items = await getBillingItems()
  const updatedItems = items.map(item => {
    if (item.id === id) {
      const currentDue = new Date(item.dueDate)
      if (item.cycle === 'MONTHLY') {
        currentDue.setMonth(currentDue.getMonth() + 1)
      } else {
        currentDue.setFullYear(currentDue.getFullYear() + 1)
      }
      return { ...item, dueDate: currentDue.toISOString().split('T')[0], isPaid: false }
    }
    return item
  })
  
  return saveBillingItems(updatedItems)
}
