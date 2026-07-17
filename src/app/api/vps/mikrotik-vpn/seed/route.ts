import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
    const routers = [
      {
        name: 'Aljuandri',
        vpnUser: 'aljuandri',
        vpnPassword: 'AljuandriPassword123',
        vpnIp: '192.168.43.10',
        winboxPort: 8291,
        ipsecPsk: 'AljuandriPSK2026',
        notes: 'Router utama Aljuandri - dikonfigurasi sejak awal',
        extraPorts: JSON.stringify([
          { public: 8110, internal: 8110, label: 'EAP Omada 1' },
          { public: 8221, internal: 8221, label: 'EAP Omada 2' },
          { public: 8222, internal: 8222, label: 'EAP Omada 3' },
          { public: 3244, internal: 8728, label: 'MikroTik API' },
        ]),
      },
      {
        name: 'Starbuck (MutingAlfasera)',
        vpnUser: 'starbuck',
        vpnPassword: 'StarbuckPass2026',
        vpnIp: '192.168.43.11',
        winboxPort: 8292,
        ipsecPsk: 'AljuandriPSK2026',
        notes: 'Router MutingAlfasera Starbuck - Winbox: 103.49.238.231:8292',
        extraPorts: null,
      },
    ]

    const results = []

    for (const r of routers) {
      // Check if duplicate exists
      const existing = await prisma.mikrotikVPN.findFirst({
        where: {
          OR: [
            { vpnUser: r.vpnUser },
            { vpnIp: r.vpnIp },
            { winboxPort: r.winboxPort },
          ],
        },
      })

      if (existing) {
        results.push({ name: r.name, status: "skipped", reason: "Sudah terdaftar" })
        continue
      }

      const created = await prisma.mikrotikVPN.create({
        data: r
      })
      results.push({ name: r.name, status: "created", id: created.id })
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("VPN Seeding error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
