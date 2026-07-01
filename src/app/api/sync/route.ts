import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import { getLiveReportSummary } from "@/app/dashboard/report/actions"

export async function GET(request: Request) {
  try {
    const routers = await prisma.router.findMany()
    if (routers.length === 0) {
      return NextResponse.json({ error: "No routers found" })
    }

    const routerId = routers[0].id
    
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: "No users found" })
    }

    const report = await getLiveReportSummary(routerId)

    if (!report.success || !report.data) {
      return NextResponse.json({ error: "Failed to get mikrotik data" })
    }

    const transactions = report.data.transactions
    let inserted = 0
    
    // June timeframe
    const juneStart = new Date("2026-06-01T00:00:00+09:00").getTime()
    const julyStart = new Date("2026-07-01T00:00:00+09:00").getTime()

    for (const t of transactions) {
      const time = t.createdAt.getTime()
      if (time >= juneStart && time < julyStart) {
        const existing = await prisma.order.findFirst({
          where: {
            routerId: routerId,
            voucherCode: t.id
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
    }

    return NextResponse.json({ success: true, inserted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
