import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import prisma from "@/lib/prisma"

function runCmd(cmd: string): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { encoding: "utf-8", timeout: 15000 })
    return { success: true, output: output.trim() }
  } catch (e: any) {
    return { success: false, output: e.message || String(e) }
  }
}

// DELETE — Hapus MikroTik VPN dan bersihkan konfigurasi VPS
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const router = await prisma.mikrotikVPN.findUnique({ where: { id } })
    if (!router) {
      return NextResponse.json({ error: "Router tidak ditemukan." }, { status: 404 })
    }

    const errors: string[] = []

    // 1. Hapus iptables DNAT untuk Winbox
    const dnatDel = runCmd(
      `sudo iptables -t nat -D PREROUTING -p tcp --dport ${router.winboxPort} -j DNAT --to-destination ${router.vpnIp}:8291`
    )
    if (!dnatDel.success) errors.push(`Hapus DNAT winbox: ${dnatDel.output}`)

    // 2. Hapus iptables FORWARD rule
    const forwardDel = runCmd(
      `sudo iptables -D FORWARD -d ${router.vpnIp} -p tcp --dport 8291 -j ACCEPT`
    )
    if (!forwardDel.success) errors.push(`Hapus FORWARD: ${forwardDel.output}`)

    // 3. Hapus extra ports
    if (router.extraPorts) {
      try {
        const extraPortsArr: { public: number; internal: number }[] = JSON.parse(router.extraPorts)
        for (const ep of extraPortsArr) {
          const epDel = runCmd(
            `sudo iptables -t nat -D PREROUTING -p tcp --dport ${ep.public} -j DNAT --to-destination ${router.vpnIp}:${ep.internal}`
          )
          if (!epDel.success) errors.push(`Hapus DNAT port ${ep.public}: ${epDel.output}`)
        }
      } catch {}
    }

    // 4. Hapus user dari /etc/ppp/chap-secrets
    const chapDel = runCmd(
      `sudo sed -i '/^${router.vpnUser} /d' /etc/ppp/chap-secrets`
    )
    if (!chapDel.success) errors.push(`Hapus chap-secrets: ${chapDel.output}`)

    // 5. Simpan iptables permanen
    const saveResult = runCmd("sudo netfilter-persistent save")
    if (!saveResult.success) errors.push(`netfilter save: ${saveResult.output}`)

    // 6. Hapus dari database
    await prisma.mikrotikVPN.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      warnings: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Router dihapus dari DB tapi ada peringatan: ${errors.join(", ")}`
        : `Router "${router.name}" berhasil dihapus!`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT — Update Router (nama, notes, extraPorts) dan sinkronisasi iptables
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const router = await prisma.mikrotikVPN.findUnique({ where: { id } })
    if (!router) {
      return NextResponse.json({ error: "Router tidak ditemukan." }, { status: 404 })
    }

    const { name, notes, extraPorts } = await req.json()
    const errors: string[] = []

    // Parse extra ports
    const oldPorts: any[] = router.extraPorts ? JSON.parse(router.extraPorts) : []
    const newPorts: any[] = extraPorts || []

    // 1. Cari port yang dihapus (ada di old, tidak ada di new)
    const deletedPorts = oldPorts.filter(
      (op) => !newPorts.some((np) => np.public === op.public && np.internal === op.internal)
    )
    for (const ep of deletedPorts) {
      const epDel = runCmd(
        `sudo iptables -t nat -D PREROUTING -p tcp --dport ${ep.public} -j DNAT --to-destination ${router.vpnIp}:${ep.internal}`
      )
      if (!epDel.success) errors.push(`Hapus DNAT port ${ep.public}: ${epDel.output}`)
    }

    // 2. Cari port yang baru ditambahkan (ada di new, tidak ada di old)
    const addedPorts = newPorts.filter(
      (np) => !oldPorts.some((op) => op.public === np.public && op.internal === np.internal)
    )
    for (const ep of addedPorts) {
      const epAdd = runCmd(
        `sudo iptables -t nat -A PREROUTING -p tcp --dport ${ep.public} -j DNAT --to-destination ${router.vpnIp}:${ep.internal}`
      )
      if (!epAdd.success) errors.push(`Tambah DNAT port ${ep.public}: ${epAdd.output}`)
    }

    // 3. Simpan iptables permanen jika ada perubahan port
    if (deletedPorts.length > 0 || addedPorts.length > 0) {
      const saveResult = runCmd("sudo netfilter-persistent save")
      if (!saveResult.success) errors.push(`netfilter save: ${saveResult.output}`)
    }

    // 4. Update ke database
    const updatedRouter = await prisma.mikrotikVPN.update({
      where: { id },
      data: {
        name: name !== undefined ? name : router.name,
        notes: notes !== undefined ? notes : router.notes,
        extraPorts: extraPorts !== undefined ? (newPorts.length > 0 ? JSON.stringify(newPorts) : null) : router.extraPorts,
      },
    })

    return NextResponse.json({
      success: true,
      router: updatedRouter,
      warnings: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? "Router diperbarui tetapi ada peringatan konfigurasi VPS."
        : "Router berhasil diperbarui!",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
