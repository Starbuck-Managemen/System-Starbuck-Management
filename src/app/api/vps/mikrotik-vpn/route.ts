import { NextRequest, NextResponse } from "next/server"
import { execSync, exec } from "child_process"
import prisma from "@/lib/prisma"
import net from "net"
import util from "util"

const execPromise = util.promisify(exec)

function runCmd(cmd: string): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { encoding: "utf-8", timeout: 15000 })
    return { success: true, output: output.trim() }
  } catch (e: any) {
    return { success: false, output: e.message || String(e) }
  }
}

async function checkRouterOnline(vpnIp: string): Promise<boolean> {
  // 1. Coba Ping (ICMP) - timeout 1.5 detik
  try {
    await execPromise(`ping -c 1 -W 1 ${vpnIp}`, { timeout: 1500 })
    return true
  } catch {
    // 2. Fallback ke TCP port 8291 check (Winbox) - timeout 1 detik
    return new Promise<boolean>((resolve) => {
      const socket = new net.Socket()
      let resolved = false

      const cleanUp = () => {
        resolved = true
        socket.removeAllListeners()
        socket.destroy()
      }

      socket.setTimeout(1000)
      socket.once("connect", () => {
        if (!resolved) {
          cleanUp()
          resolve(true)
        }
      })
      const fail = () => {
        if (!resolved) {
          cleanUp()
          resolve(false)
        }
      }
      socket.once("error", fail)
      socket.once("timeout", fail)
      socket.connect(8291, vpnIp)
    })
  }
}

async function checkPortOnline(vpnIp: string, port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = new net.Socket()
    let resolved = false

    const cleanUp = () => {
      resolved = true
      socket.removeAllListeners()
      socket.destroy()
    }

    socket.setTimeout(1200)
    socket.once("connect", () => {
      if (!resolved) {
        cleanUp()
        resolve(true)
      }
    })
    const fail = () => {
      if (!resolved) {
        cleanUp()
        resolve(false)
      }
    }
    socket.once("error", fail)
    socket.once("timeout", fail)
    socket.connect(port, vpnIp)
  })
}

// GET — Daftar semua MikroTik VPN yang terdaftar
export async function GET() {
  try {
    const routers = await prisma.mikrotikVPN.findMany({
      orderBy: { createdAt: "asc" },
    })

    const routersWithStatus = await Promise.all(
      routers.map(async (r) => {
        const isOnline = await checkRouterOnline(r.vpnIp)
        
        let extraPortsParsed: any[] = []
        if (r.extraPorts) {
          try {
            extraPortsParsed = JSON.parse(r.extraPorts)
            if (isOnline) {
              extraPortsParsed = await Promise.all(
                extraPortsParsed.map(async (ep: any) => {
                  const isPortOnline = await checkPortOnline(r.vpnIp, ep.internal)
                  return { ...ep, isOnline: isPortOnline }
                })
              )
            } else {
              extraPortsParsed = extraPortsParsed.map((ep: any) => ({
                ...ep,
                isOnline: false
              }))
            }
          } catch (e) {
            console.error("Gagal memeriksa extraPorts untuk router:", r.name, e)
          }
        }

        return {
          ...r,
          isActive: isOnline,
          extraPorts: extraPortsParsed.length > 0 ? JSON.stringify(extraPortsParsed) : null
        }
      })
    )

    return NextResponse.json({ routers: routersWithStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — Tambah MikroTik VPN baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, vpnUser, vpnPassword, vpnIp, winboxPort, extraPorts, ipsecPsk, notes } = body

    // Validasi field wajib
    if (!name || !vpnUser || !vpnPassword || !vpnIp || !winboxPort) {
      return NextResponse.json({ error: "Semua field wajib harus diisi." }, { status: 400 })
    }

    // Cek duplikat di DB
    const existing = await prisma.mikrotikVPN.findFirst({
      where: { OR: [{ vpnUser }, { vpnIp }, { winboxPort: Number(winboxPort) }] },
    })
    if (existing) {
      return NextResponse.json({
        error: `Duplikat! User "${existing.vpnUser}", IP "${existing.vpnIp}", atau port ${existing.winboxPort} sudah terdaftar.`
      }, { status: 409 })
    }

    const errors: string[] = []

    // 1. Tambah user ke /etc/ppp/chap-secrets
    const chapEntry = `${vpnUser} l2tpd ${vpnPassword} ${vpnIp}`
    const chapResult = runCmd(`echo '${chapEntry}' | sudo tee -a /etc/ppp/chap-secrets`)
    if (!chapResult.success) errors.push(`chap-secrets: ${chapResult.output}`)

    // 2. Tambah iptables DNAT untuk Winbox
    const dnatResult = runCmd(
      `sudo iptables -t nat -A PREROUTING -p tcp --dport ${winboxPort} -j DNAT --to-destination ${vpnIp}:8291`
    )
    if (!dnatResult.success) errors.push(`iptables DNAT winbox: ${dnatResult.output}`)

    // 3. Tambah iptables FORWARD rule
    const forwardResult = runCmd(
      `sudo iptables -I FORWARD -d ${vpnIp} -p tcp --dport 8291 -j ACCEPT`
    )
    if (!forwardResult.success) errors.push(`iptables FORWARD: ${forwardResult.output}`)

    // 4. Proses extra ports
    const extraPortsArr: { public: number; internal: number; label?: string }[] = extraPorts || []
    for (const ep of extraPortsArr) {
      const epResult = runCmd(
        `sudo iptables -t nat -A PREROUTING -p tcp --dport ${ep.public} -j DNAT --to-destination ${vpnIp}:${ep.internal}`
      )
      if (!epResult.success) errors.push(`iptables DNAT port ${ep.public}: ${epResult.output}`)
    }

    // 5. Restart xl2tpd
    const restartResult = runCmd("sudo systemctl restart xl2tpd")
    if (!restartResult.success) errors.push(`xl2tpd restart: ${restartResult.output}`)

    // 6. Simpan iptables permanen
    const saveResult = runCmd("sudo netfilter-persistent save")
    if (!saveResult.success) errors.push(`netfilter save: ${saveResult.output}`)

    // 7. Simpan ke database
    const newRouter = await prisma.mikrotikVPN.create({
      data: {
        name,
        vpnUser,
        vpnPassword,
        vpnIp,
        winboxPort: Number(winboxPort),
        extraPorts: extraPortsArr.length > 0 ? JSON.stringify(extraPortsArr) : null,
        ipsecPsk: ipsecPsk || "AljuandriPSK2026",
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      router: newRouter,
      warnings: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? "Router ditambahkan ke DB tapi ada peringatan konfigurasi VPS."
        : "Router berhasil ditambahkan dan VPS sudah dikonfigurasi!",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
