'use server'

import prisma from "@/lib/prisma"
import { getVouchers } from "@/lib/mikrotik"

import { parseMikrotikCommentDate, guessOriginalProfile, guessValidityFromProfile, parseMikrotikDuration, enrichVoucher } from "@/lib/mikrotikUtils";

export async function getLiveReportSummary(routerId: string, startDate?: string, endDate?: string) {
  if (!routerId) return { success: false, data: null }

  try {
    // 1. Ambil semua Hotspot Users (Vouchers) dari MikroTik
    const mkUsers = await getVouchers(routerId)

    // 2. Ambil referensi Harga Profil dari Database
    const dbProfiles = await prisma.profile.findMany({
      where: { routerId }
    })

    // Buat map (kamus) harga untuk pencarian cepat
    const priceMap = new Map<string, number>()
    dbProfiles.forEach(p => {
      priceMap.set(p.name, p.price)
    })

    // 3. Proses Transaksi (Voucher Terjual / Pernah Dipakai)
    const transactions = []
    let todayIncome = 0
    let monthIncome = 0
    let vouchersCreatedThisMonth = 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    for (const user of mkUsers) {
      // Filter: Hanya tampilkan voucher yang sudah pernah digunakan/login (uptime != 0s)
      const isUsed = user.uptime && user.uptime !== "0s";
      if (!isUsed) continue;

      const enriched = enrichVoucher(user, priceMap);
      
      const createdAtTimestamp = enriched.createdAt.getTime();

      // Periksa apakah masuk dalam rentang filter
      if (startDate || endDate) {
        let isIncluded = true
        if (startDate) {
          const start = new Date(startDate).getTime()
          if (createdAtTimestamp < start) isIncluded = false
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (createdAtTimestamp > end.getTime()) isIncluded = false
        }
        if (!isIncluded) continue
      }

      // Hitung statistik
      if (createdAtTimestamp >= startOfToday) {
        todayIncome += enriched.price
      }
      if (createdAtTimestamp >= startOfMonth) {
        monthIncome += enriched.price
        vouchersCreatedThisMonth++
      }

      transactions.push({
        id: user.id || user.name,
        amount: enriched.price,
        type: "Income",
        username: user.name,
        voucherType: enriched.actualProfile,
        comment: user.comment,
        createdAt: enriched.createdAt,
        activeAt: enriched.createdAt, // Estimasi saat pertama kali pakai
        expiresAt: enriched.expiresAt,
      })
    }

    // Urutkan transaksi dari terlama ke terbaru
    transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    // 4. Generate Chart Data (12 Months of current year)
    const chartData = []
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]
    
    for (let i = 0; i < 12; i++) {
      let monthTotal = 0
      transactions.forEach(t => {
        if (t.createdAt.getFullYear() === now.getFullYear() && t.createdAt.getMonth() === i) {
          monthTotal += t.amount
        }
      })
      chartData.push({
        date: months[i],
        amount: monthTotal
      })
    }

    return {
      success: true,
      data: {
        summary: {
          todayIncome,
          monthIncome,
          vouchersCreatedThisMonth
        },
        chartData,
        transactions,
        registeredProfiles: Array.from(priceMap.keys())
      }
    }
  } catch (error: any) {
    console.error("Error getLiveReportSummary:", error)
    return { success: false, error: error.message || "Gagal mengambil data dari Router" }
  }
}

export async function getDatabaseReportSummary(routerId: string) {
  if (!routerId) return { success: false, data: null }

  try {
    const orders = await prisma.order.findMany({
      where: { routerId, status: 'PROCESSED' },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch profiles to get unit prices for flattening multi-package orders
    const dbProfiles = await prisma.profile.findMany({
      where: { routerId }
    })
    const priceMap = new Map<string, number>()
    dbProfiles.forEach(p => priceMap.set(p.name, p.price))

    const transactions: any[] = []

    for (const order of orders) {
      let isParsed = false
      if (order.voucherCode && order.voucherCode.startsWith('{')) {
        try {
          const parsed = JSON.parse(order.voucherCode)
          for (const [pkgName, pkgData] of Object.entries(parsed)) {
            const pData = pkgData as any
            const unitPrice = priceMap.get(pkgName) || 0

            if (pData.type === 'text') {
              // Extract multiple codes if they are separated by newline or space
              const codes = pData.content.split(/[\n\r,]+/).map((c: string) => c.trim()).filter(Boolean)
              for (const code of codes) {
                transactions.push({
                  id: `${order.id}-${code}`,
                  amount: unitPrice,
                  type: "Income",
                  username: code,
                  voucherType: pkgName,
                  createdAt: order.createdAt
                })
              }
            } else {
              // PDF Type
              let qty = 1
              // Extract qty from order.packageName, e.g. "1-JAM (x2)"
              const regex = new RegExp(`${pkgName} \\(x(\\d+)\\)`)
              const match = order.packageName.match(regex)
              if (match) qty = parseInt(match[1])

              transactions.push({
                id: `${order.id}-${pkgName}`,
                amount: unitPrice * qty,
                type: "Income",
                username: `[PDF] ${pData.filename}`,
                voucherType: pkgName,
                createdAt: order.createdAt
              })
            }
          }
          isParsed = true
        } catch (e) {
          // If JSON parse fails, fallback
        }
      }

      if (!isParsed) {
        // Single voucher or synced data
        transactions.push({
          id: order.id,
          amount: order.price,
          type: "Income",
          username: order.voucherCode || "Unknown",
          voucherType: order.packageName,
          createdAt: order.createdAt
        })
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    let todayIncome = 0
    let monthIncome = 0
    let vouchersCreatedThisMonth = 0

    transactions.forEach(t => {
      const time = t.createdAt.getTime()
      if (time >= startOfToday) todayIncome += t.amount
      if (time >= startOfMonth) {
        monthIncome += t.amount
        vouchersCreatedThisMonth++
      }
    })

    // Generate monthly chart data (12 months of the current year)
    const chartData = []
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]
    
    for (let i = 0; i < 12; i++) {
      let monthTotal = 0
      transactions.forEach(t => {
        if (t.createdAt.getFullYear() === now.getFullYear() && t.createdAt.getMonth() === i) {
          monthTotal += t.amount
        }
      })
      chartData.push({
        date: months[i],
        amount: monthTotal
      })
    }

    const registeredProfiles = Array.from(new Set(transactions.map(t => t.voucherType)))

    return {
      success: true,
      data: {
        summary: {
          todayIncome,
          monthIncome,
          vouchersCreatedThisMonth
        },
        chartData,
        transactions,
        registeredProfiles
      }
    }
  } catch (error: any) {
    console.error("Error getDatabaseReportSummary:", error)
    return { success: false, error: error.message || "Gagal mengambil data dari Database" }
  }
}

export async function syncMikrotikToDatabase(routerId: string) {
  if (!routerId) return { success: false, message: "Router ID tidak valid" }

  try {
    const report = await getLiveReportSummary(routerId)
    if (!report.success || !report.data) {
      return { success: false, message: "Gagal mengambil data dari MikroTik" }
    }

    const transactions = report.data.transactions
    
    const user = await prisma.user.findFirst()
    if (!user) {
      return { success: false, message: "User Admin tidak ditemukan" }
    }

    let inserted = 0

    for (const t of transactions) {
      // Periksa apakah voucher ini sudah ada di database (sebagai order.voucherCode tunggal atau di dalam JSON multi-paket)
      // Karena kita hanya butuh mengecek voucherCode secara string, kita gunakan 'contains'
      const existing = await prisma.order.findFirst({
        where: {
          routerId: routerId,
          voucherCode: {
            contains: t.id
          }
        }
      })

      if (!existing) {
        await prisma.order.create({
          data: {
            userId: user.id,
            routerId: routerId,
            packageName: t.voucherType || "Unknown",
            price: t.amount,
            status: "PROCESSED",
            voucherCode: t.id,
            createdAt: t.createdAt,
            updatedAt: t.createdAt
          }
        })
        inserted++
      }
    }

    return { success: true, inserted }
  } catch (error: any) {
    console.error("Error syncMikrotikToDatabase:", error)
    return { success: false, message: error.message || "Terjadi kesalahan saat sinkronisasi" }
  }
}
