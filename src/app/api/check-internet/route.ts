import { NextResponse } from "next/server"
import { getMikrotikClient } from "@/lib/mikrotik"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  let client
  try {
    const router = await prisma.router.findFirst({
        where: { host: { contains: 'idn25' } }
    })
    
    if (!router) return NextResponse.json({ error: "Router not found" })
    
    client = await getMikrotikClient(router.id)
    
    // Check internet via ping
    const fetchMenu = client.api().menu("/tool/fetch")
    const fetchRes = await fetchMenu.where("url", "http://google.com").where("keep-result", "no").get()
    
    return NextResponse.json({ success: true, message: "Internet is working", details: fetchRes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to connect or ping" })
  } finally {
    if (client) client.close()
  }
}
