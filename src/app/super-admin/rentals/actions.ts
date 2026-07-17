'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ----------------------------------------------------
// HOUSE MANAGEMENT
// ----------------------------------------------------

export async function getHouses() {
  return await prisma.rentalHouse.findMany({
    orderBy: { name: 'asc' },
    include: {
      invoices: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }
    }
  })
}

export async function createHouse(data: { name: string, tenantName: string, tenantPhone: string, price: number, dueDate: number }) {
  try {
    await prisma.rentalHouse.create({
      data: {
        name: data.name,
        tenantName: data.tenantName || null,
        tenantPhone: data.tenantPhone || null,
        price: data.price,
        dueDate: data.dueDate,
        status: "OCCUPIED"
      }
    })
    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateHouse(id: string, data: { name: string, tenantName: string, tenantPhone: string, price: number, dueDate: number }) {
  try {
    await prisma.rentalHouse.update({
      where: { id },
      data: {
        name: data.name,
        tenantName: data.tenantName || null,
        tenantPhone: data.tenantPhone || null,
        price: data.price,
        dueDate: data.dueDate,
      }
    })
    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteHouse(id: string) {
  try {
    await prisma.rentalHouse.delete({
      where: { id }
    })
    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ----------------------------------------------------
// INVOICE MANAGEMENT
// ----------------------------------------------------

export async function generateInvoice(houseId: string, month: number, year: number) {
  try {
    const house = await prisma.rentalHouse.findUnique({ where: { id: houseId } })
    if (!house) throw new Error("Rumah tidak ditemukan")

    // Check if invoice already exists
    const existing = await prisma.rentalInvoice.findFirst({
      where: { houseId, month, year }
    })
    if (existing) throw new Error("Tagihan untuk bulan ini sudah ada!")

    // Create due date
    const dueDate = new Date(year, month - 1, house.dueDate)

    await prisma.rentalInvoice.create({
      data: {
        houseId,
        month,
        year,
        amountDue: house.price,
        amountPaid: 0,
        status: "UNPAID",
        dueDate
      }
    })
    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ----------------------------------------------------
// GET TRANSACTIONS
// ----------------------------------------------------

export async function getRentalPayments() {
  return await prisma.rentalPayment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { house: true }
  })
}

export async function recordManualPayment(houseId: string, amount: number) {
  try {
    const house = await prisma.rentalHouse.findUnique({ where: { id: houseId } })
    if (!house) throw new Error("Kamar tidak ditemukan")

    // 1. Buat record RentalPayment
    const payment = await prisma.rentalPayment.create({
      data: {
        houseId,
        amount,
        paymentMethod: 'CASH', // Manual payment is assumed Cash or Transfer Manual
        status: 'SUCCESS',
        paymentToken: `MANUAL-${houseId}-${Date.now()}`
      }
    });

    // 2. FIFO Ledger System
    const unpaidInvoices = await prisma.rentalInvoice.findMany({
      where: {
        houseId,
        status: { not: 'PAID' }
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    });

    let remainingMoney = payment.amount;

    for (const invoice of unpaidInvoices) {
      if (remainingMoney <= 0) break;

      const sisaTagihan = invoice.amountDue - invoice.amountPaid;
      
      if (remainingMoney >= sisaTagihan) {
        // Lunas
        await prisma.rentalInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: invoice.amountDue,
            status: 'PAID'
          }
        });
        remainingMoney -= sisaTagihan;
      } else {
        // Bayar sebagian
        await prisma.rentalInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: invoice.amountPaid + remainingMoney,
            status: 'PARTIAL'
          }
        });
        remainingMoney = 0;
      }
    }

    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteRentalPayment(id: string) {
  try {
    await prisma.rentalPayment.delete({
      where: { id }
    })
    revalidatePath('/super-admin/rentals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function simulateRentalCron() {
  try {
    // Panggil GET secara internal ke API URL localhost
    const res = await fetch('http://127.0.0.1:3000/api/cron/rental-reminder?token=' + (process.env.CRON_SECRET || ''))
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal eksekusi')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
