import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const labels = await prisma.tunnelLabel.findMany()
    return NextResponse.json(labels)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { port, label, description } = await req.json()

    if (!port || !label) {
      return NextResponse.json({ error: "Port dan Label wajib diisi" }, { status: 400 })
    }

    const tunnelLabel = await prisma.tunnelLabel.upsert({
      where: { port: String(port) },
      update: { label, description },
      create: { port: String(port), label, description },
    })

    return NextResponse.json(tunnelLabel)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
