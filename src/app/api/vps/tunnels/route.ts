import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    // Since the app runs ON the VPS, we can execute iptables directly
    // No SSH needed. Requires passwordless sudo for iptables (setup via setup-sudoers.ps1)
    let stdout: string
    try {
      stdout = execSync("sudo iptables -t nat -L PREROUTING -n -v --line-numbers", {
        encoding: "utf-8",
        timeout: 10000,
      })
    } catch (execError: any) {
      // Fallback: try without sudo (some systems allow this)
      try {
        stdout = execSync("iptables -t nat -L PREROUTING -n -v --line-numbers", {
          encoding: "utf-8",
          timeout: 10000,
        })
      } catch {
        return NextResponse.json({
          error: execError.message || "Failed to read iptables",
          tip: "Pastikan user yang menjalankan aplikasi memiliki izin sudo untuk iptables. Jalankan setup-sudoers.ps1 terlebih dahulu."
        }, { status: 500 })
      }
    }

    // Parse iptables output
    // Example line:
    // 1    0     0 DNAT       tcp  --  *      *       0.0.0.0/0  0.0.0.0/0  tcp dpt:8110 to:192.168.43.10:8110
    const lines = stdout.split("\n")
    const tunnels: { publicPort: string; vpnIp: string; internalPort: string; raw: string }[] = []

    for (const line of lines) {
      if (line.includes("DNAT") && line.includes("dpt:")) {
        // Match pattern: tcp dpt:PORT to:IP:PORT
        const match = line.match(/tcp dpt:(\d+) to:([\d\.]+):(\d+)/)
        if (match) {
          tunnels.push({
            publicPort: match[1],
            vpnIp: match[2],
            internalPort: match[3],
            raw: line.trim(),
          })
        }
      }
    }

    return NextResponse.json({ tunnels })
  } catch (error: any) {
    console.error("Tunnel Fetch Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
