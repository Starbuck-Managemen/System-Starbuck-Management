import { RouterOSClient } from "routeros-client"
import prisma from "@/lib/prisma"

/**
 * Mendapatkan instance RouterOSClient yang terhubung ke MikroTik
 * @param routerId ID Router dari database
 */
export async function getMikrotikClient(routerId: string) {
  const router = await prisma.router.findUnique({
    where: { id: routerId }
  })

  if (!router) {
    throw new Error("Router tidak ditemukan di database.")
  }

  const client = new RouterOSClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password || "",
    timeout: 10,
    keepalive: true
  })

  try {
    await client.connect()
    return client
  } catch (error) {
    console.error("Gagal terhubung ke MikroTik:", error)
    throw new Error("Gagal terhubung ke Router MikroTik. Pastikan VPN aktif dan kredensial benar.")
  }
}

/**
 * Mengambil daftar Voucher (Hotspot Users) dari router
 */
export async function getVouchers(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    
    // Ambil data hotspot users
    const usersMenu = client.api().menu("/ip/hotspot/user")
    const users = await usersMenu.get()

    // Ambil data active users untuk menggantikan uptime "0s" yang belum logout
    const activeMenu = client.api().menu("/ip/hotspot/active")
    const activeUsers = await activeMenu.get()
    const activeMap = new Map();
    activeUsers.forEach((a: any) => {
      activeMap.set(a.user, a.uptime || "0s");
    });
    
    return users.map((user: any) => {
      let finalUptime = user.uptime || "0s";
      const isActive = activeMap.has(user.name);
      
      // MikroTik tidak mengupdate uptime di '/ip/hotspot/user' sampai pelanggan logout.
      // Jadi jika uptime masih 0s tapi dia sedang aktif, kita gunakan uptime dari session aktifnya.
      if (finalUptime === "0s" && isActive) {
        finalUptime = activeMap.get(user.name);
      }

      return {
        id: user.id || user[".id"],
        name: user.name,
        password: user.password || "",
        profile: user.profile,
        uptime: finalUptime,
        limitUptime: user["limit-uptime"] || "",
        bytesIn: user["bytes-in"],
        bytesOut: user["bytes-out"],
        comment: user.comment || "",
        disabled: user.disabled === "true" || user.disabled === true,
        isActive: isActive,
      }
    })
  } catch (error) {
    console.error("Error getVouchers:", error)
    throw error
  } finally {
    if (client) {
      client.close()
    }
  }
}

/**
 * Mengambil daftar Hotspot Server
 */
export async function getHotspotServers(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const servers = await client.api().menu("/ip/hotspot").get()
    return servers.map((s: any) => ({
      name: s.name,
      profile: s.profile
    }))
  } catch (error) {
    console.error("Error getHotspotServers:", error)
    return []
  } finally {
    if (client) client.close()
  }
}

/**
 * Mengambil daftar Hotspot User Profile
 */
export async function getHotspotProfiles(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const profiles = await client.api().menu("/ip/hotspot/user/profile").get()
    return profiles.map((p: any) => ({
      name: p.name,
      sharedUsers: p["shared-users"] || "1",
      rateLimit: p["rate-limit"] || ""
    }))
  } catch (error) {
    console.error("Error getHotspotProfiles:", error)
    return []
  } finally {
    if (client) client.close()
  }
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Tanpa O, 0, I, 1 agar tidak membingungkan
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Membuat Hotspot Profile baru
 */
export async function addHotspotProfile(
  routerId: string,
  data: { name: string; sharedUsers: string; rateLimit: string }
) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user/profile")
    
    const profileData: any = {
      name: data.name,
      "shared-users": data.sharedUsers || "1"
    }
    
    let rl = data.rateLimit ? data.rateLimit.trim() : ""
    if (rl.toLowerCase() === "unlimited" || rl.toLowerCase() === "none") {
      rl = ""
    }

    if (rl) {
      profileData["rate-limit"] = rl
    }

    await menu.add(profileData)
    
    return { success: true }
  } catch (error: any) {
    console.error("Error addHotspotProfile:", error)
    return { success: false, error: error.message || "Gagal membuat profil di MikroTik" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Mengupdate Hotspot Profile yang ada
 */
export async function updateHotspotProfile(
  routerId: string,
  oldName: string,
  data: { name: string; sharedUsers: string; rateLimit: string }
) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user/profile")
    
    const profiles = await menu.where("name", oldName).get()
    if (profiles.length > 0) {
      const internalId = profiles[0].id || profiles[0]['.id']
      if (internalId) {
        const profileData: any = {
          name: data.name,
          "shared-users": data.sharedUsers || "1"
        }
        
        let rl = data.rateLimit ? data.rateLimit.trim() : ""
        if (rl.toLowerCase() === "unlimited" || rl.toLowerCase() === "none") {
          rl = ""
        }

        if (rl) {
          profileData["rate-limit"] = rl
        }
        
        await menu.set(profileData, internalId)
        return { success: true }
      }
    }
    
    return { success: false, error: "Profil tidak ditemukan di router MikroTik." }
  } catch (error: any) {
    console.error("Error updateHotspotProfile:", error)
    return { success: false, error: error.message || "Gagal mengupdate profil di MikroTik" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Menghapus Hotspot Profile
 */
export async function deleteHotspotProfile(routerId: string, profileName: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user/profile")
    
    // Jangan izinkan hapus profil default
    if (profileName === "default") {
      return { success: false, error: "Profil default tidak boleh dihapus." }
    }

    const profiles = await menu.where("name", profileName).get()
    if (profiles.length > 0) {
      const internalId = profiles[0].id || profiles[0]['.id']
      if (internalId) {
        await menu.remove(internalId)
        return { success: true }
      }
    }
    
    return { success: false, error: "Profil tidak ditemukan di router MikroTik." }
  } catch (error: any) {
    console.error("Error deleteHotspotProfile:", error)
    return { success: false, error: error.message || "Gagal menghapus profil di MikroTik" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Membangkitkan / Membuat (Generate) Voucher secara massal
 */
export async function generateVouchers(
  routerId: string, 
  data: { server: string, profile: string, amount: number, length: number, limitUptime?: string }
) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const batchId = `gen-${Math.floor(Date.now() / 1000)}`
    let generated = 0
    let generatedVouchers: string[] = []
    
    for (let i = 0; i < data.amount; i++) {
      const voucherCode = generateRandomString(data.length)
      
      const userData: any = {
        server: data.server,
        name: voucherCode,
        password: voucherCode,
        profile: data.profile,
        comment: `buckNet-${batchId}` // Penanda batch untuk laporan
      }

      if (data.limitUptime && data.limitUptime.trim() !== "") {
        userData["limit-uptime"] = data.limitUptime.trim()
      }

      await menu.add(userData)
      generatedVouchers.push(voucherCode)
      generated++
    }
    
    return { success: true, count: generated, batchId, vouchers: generatedVouchers }
  } catch (error: any) {
    console.error("Error generateVouchers:", error)
    return { success: false, error: error.message || "Gagal membuat voucher" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Membuat satu voucher / hotspot user secara manual
 */
export async function addManualVoucher(
  routerId: string, 
  data: { server: string, profile: string, name: string, password?: string, waNumber?: string, customerName?: string, limitUptime?: string }
) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    // Simpan WA, Creation Date, dan Customer Name di dalam comment
    const createdTimestamp = Date.now()
    let finalComment = "buckNet-manual"
    if (data.waNumber) {
      finalComment = `buckNet-manual|WA:${data.waNumber}|Created:${createdTimestamp}`
    } else if (data.customerName) {
      finalComment = `buckNet-manual|Created:${createdTimestamp}` // Selalu buat Created jika ada nama/manual
    }
    
    if (data.customerName) {
      finalComment += `|Nama:${data.customerName}`
    }
    
    const userData: any = {
      server: data.server,
      name: data.name,
      password: data.password || data.name,
      profile: data.profile,
      comment: finalComment
    }

    if (data.limitUptime && data.limitUptime.trim() !== "") {
      userData["limit-uptime"] = data.limitUptime.trim()
    }

    await menu.add(userData)
    
    return { success: true }
  } catch (error: any) {
    console.error("Error addManualVoucher:", error)
    
    // Tangani error khusus "already have user"
    if (error.message && error.message.includes("already have user")) {
      return { success: false, error: `Voucher dengan nama '${data.name}' sudah ada/aktif.` }
    }
    
    return { success: false, error: error.message || "Gagal menambah voucher manual" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Menghapus voucher (hotspot user) dari MikroTik
 */
export async function deleteVoucher(routerId: string, voucherIdOrName: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)

    // Coba hapus dari active list dulu
    try {
      const activeMenu = client.api().menu("/ip/hotspot/active")
      if (!voucherIdOrName.startsWith('*')) {
        const activeUsers = await activeMenu.where("user", voucherIdOrName).get()
        if (activeUsers.length > 0) {
          const id = activeUsers[0].id || activeUsers[0]['.id']
          if (id) await activeMenu.remove(id)
        }
      }
    } catch (e) {}

    const menu = client.api().menu("/ip/hotspot/user")
    
    if (voucherIdOrName.startsWith('*')) {
      await menu.remove(voucherIdOrName)
      return { success: true }
    } else {
      const users = await menu.where("name", voucherIdOrName).get()
      if (users.length > 0) {
        const internalId = users[0].id || users[0]['.id']
        if (internalId) {
          await menu.remove(internalId)
          return { success: true }
        }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error deleteVoucher:", error)
    return { success: false, error: error.message || "Gagal menghapus voucher" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Mengubah profil pengguna (Biasanya digunakan untuk Warning/Peringatan di Layar Browser)
 */
export async function changeUserProfile(routerId: string, voucherName: string, newProfile: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const users = await menu.where("name", voucherName).get()
    if (users.length > 0) {
      const internalId = users[0].id || users[0]['.id']
      if (internalId) {
        await menu.set({ profile: newProfile }, internalId)
        
        // Agar profil baru (misal: limit speed) langsung berlaku, 
        // kita harus 'kick' (hapus) dia dari active session agar dia login ulang otomatis
        const activeMenu = client.api().menu("/ip/hotspot/active")
        const activeUsers = await activeMenu.where("user", voucherName).get()
        if (activeUsers.length > 0) {
          const activeId = activeUsers[0].id || activeUsers[0]['.id']
          if (activeId) {
            await activeMenu.remove(activeId)
          }
        }
        
        return { success: true }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error changeUserProfile:", error)
    return { success: false, error: error.message || "Gagal mengubah profil voucher" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Memperbarui nomor WA pelanggan di comment MikroTik
 */
export async function updateVoucherWA(routerId: string, voucherName: string, waNumber: string, remainingDays?: number) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const users = await menu.where("name", voucherName).get()
    if (users.length > 0) {
      const internalId = users[0].id || users[0]['.id']
      if (internalId) {
        const oldComment = users[0].comment || ""
        
        // Jika tidak ada Created, tambahkan Created berdasarkan remainingDays
        let createdStr = `Created:${Date.now()}`
        if (oldComment.includes("Created:")) {
          const parts = oldComment.split("|")
          parts.forEach((p: string) => {
            if (p.startsWith("Created:")) createdStr = p
          })
        } else if (remainingDays !== undefined && remainingDays >= 0 && remainingDays <= 30) {
          // Jika pelanggan lama, hitung mundur tanggal pembuatannya
          const elapsedDays = 30 - remainingDays;
          const pastDate = Date.now() - (elapsedDays * 24 * 60 * 60 * 1000);
          createdStr = `Created:${pastDate}`;
        }
        
        const newComment = `buckNet-manual|WA:${waNumber}|${createdStr}`
        await menu.set({ comment: newComment }, internalId)
        return { success: true }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error updateVoucherWA:", error)
    return { success: false, error: error.message || "Gagal mengupdate WhatsApp" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Menambahkan string tambahan ke komentar voucher (misal untuk REMINDED tag)
 */
export async function appendVoucherComment(routerId: string, voucherName: string, extraString: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const users = await menu.where("name", voucherName).get()
    if (users.length > 0) {
      const internalId = users[0].id || users[0]['.id']
      if (internalId) {
        const oldComment = users[0].comment || ""
        let newComment = oldComment
        
        // Hapus tag REMINDED lama jika ada, lalu tambah yang baru
        if (extraString.startsWith("REMINDED:")) {
           const parts = oldComment.split("|").filter((p: string) => !p.startsWith("REMINDED:"))
           newComment = parts.join("|")
        }
        
        newComment = newComment ? `${newComment}|${extraString}` : extraString
        
        await menu.set({ comment: newComment }, internalId)
        return { success: true }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error appendVoucherComment:", error)
    return { success: false, error: error.message || "Gagal mengupdate komentar" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Memperpanjang masa aktif voucher bulanan (Reset Created & Enable User)
 */
export async function renewVoucher(routerId: string, voucherName: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const users = await menu.where("name", voucherName).get()
    if (users.length > 0) {
      const internalId = users[0].id || users[0]['.id']
      if (internalId) {
        const oldComment = users[0].comment || ""
        let waNumber = ""
        
        // Ambil nomor WA jika ada
        if (oldComment.includes("WA:")) {
          const parts = oldComment.split("|")
          parts.forEach((p: string) => {
            if (p.startsWith("WA:")) waNumber = p.substring(3)
          })
        }
        
        // Reset waktu mulai dan hapus penanda Warned
        const newComment = waNumber ? `buckNet-manual|WA:${waNumber}|Created:${Date.now()}` : `buckNet-manual|Created:${Date.now()}`
        
        // Update comment dan nyalakan ulang user (enable)
        await menu.set({ comment: newComment, disabled: "no" }, internalId)
        
        // Bersihkan sesi aktif mereka jika ada (agar login dengan fresh)
        const activeMenu = client.api().menu("/ip/hotspot/active")
        const activeUsers = await activeMenu.where("user", voucherName).get()
        for (const activeUser of activeUsers) {
          const activeId = activeUser.id || activeUser['.id']
          if (activeId) await activeMenu.remove(activeId)
        }

        return { success: true }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error renewVoucher:", error)
    return { success: false, error: error.message || "Gagal memperpanjang voucher" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Mematikan (Disable) voucher secara manual
 */
export async function disableVoucher(routerId: string, voucherName: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const menu = client.api().menu("/ip/hotspot/user")
    
    const users = await menu.where("name", voucherName).get()
    if (users.length > 0) {
      const internalId = users[0].id || users[0]['.id']
      if (internalId) {
        await menu.set({ disabled: "yes" }, internalId)
        
        // Bersihkan sesi aktif mereka
        const activeMenu = client.api().menu("/ip/hotspot/active")
        const activeUsers = await activeMenu.where("user", voucherName).get()
        for (const activeUser of activeUsers) {
          const activeId = activeUser.id || activeUser['.id']
          if (activeId) await activeMenu.remove(activeId)
        }

        return { success: true }
      }
    }
    
    return { success: false, error: "Voucher tidak ditemukan di router." }
  } catch (error: any) {
    console.error("Error disableVoucher:", error)
    return { success: false, error: error.message || "Gagal mematikan voucher" }
  } finally {
    if (client) client.close()
  }
}

/**
 * Mengambil daftar user yang sedang aktif login (sedang menggunakan voucher)
 */
export async function getActiveHotspotUsers(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const activeUsers = await client.api().menu("/ip/hotspot/active").get()
    return activeUsers
  } catch (error) {
    console.error("Error getActiveHotspotUsers:", error)
    return []
  } finally {
    if (client) client.close()
  }
}

/**
 * Menghitung estimasi total pendapatan dari voucher yang sudah terpakai
 * (Mengecek uptime != 0s dan mencoba mengambil angka harga dari nama profil)
 */
export async function calculateTotalRevenue(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const users = await client.api().menu("/ip/hotspot/user").get()
    
    let totalRevenue = 0
    let soldCount = 0

    users.forEach((u: any) => {
      // Jika uptime bukan "0s" atau tidak kosong, berarti sudah terpakai/laku
      if (u.uptime && u.uptime !== "0s") {
        soldCount++
        
        // Coba ekstrak harga dari nama profil (misal: "1JAM-2000" -> 2000)
        // Kita cari angka yang lebih besar dari 100 (karena asumsi harga IDR > 100)
        const profileName = u.profile || ""
        const numbers = profileName.match(/\d+/g)
        if (numbers) {
          // Cari angka terbesar dari nama profil yang kemungkinan adalah harga
          const possiblePrices = numbers.map(Number).filter((n: number) => n >= 500)
          if (possiblePrices.length > 0) {
            totalRevenue += Math.max(...possiblePrices)
          }
        }
      }
    })

    return { totalRevenue, soldCount }
  } catch (error) {
    console.error("Error calculateTotalRevenue:", error)
    return { totalRevenue: 0, soldCount: 0 }
  } finally {
    if (client) client.close()
  }
}

/**
 * Mengambil informasi uptime dari router MikroTik
 */
export async function getRouterUptime(routerId: string) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const resource = await client.api().menu("/system/resource").get()
    
    if (resource && resource.length > 0) {
      return resource[0].uptime
    }
    return null
  } catch (error) {
    console.error("Error getRouterUptime:", error)
    return null
  } finally {
    if (client) client.close()
  }
}


/**
 * Mengambil log sistem dari router MikroTik untuk analisa penyebab disconnect
 * Membaca /log dan memfilter entri yang relevan dengan disconnect/restart
 */
export async function getRouterLogs(routerId: string, maxEntries: number = 50) {
  let client
  try {
    client = await getMikrotikClient(routerId)
    const logMenu = client.api().menu("/log")
    const allLogs = await logMenu.get()
    
    // Ambil entri terakhir saja
    const recentLogs = allLogs.slice(-maxEntries)
    
    return recentLogs.map((entry: any) => ({
      time: entry.time || "",
      topics: entry.topics || "",
      message: entry.message || "",
    }))
  } catch (error) {
    console.error("Error getRouterLogs:", error)
    return []
  } finally {
    if (client) client.close()
  }
}

/**
 * Menganalisa log router untuk menentukan penyebab disconnect
 * Mengembalikan ringkasan analisis dalam bahasa Indonesia
 */
export function analyzeRouterLogs(logs: { time: string; topics: string; message: string }[]): {
  cause: string;
  details: string[];
} {
  const details: string[] = []
  let cause = "Tidak diketahui"
  
  // Kategori log yang relevan
  let hasPowerEvent = false
  let hasInterfaceDown = false
  let hasDhcpIssue = false
  let hasWirelessDisconnect = false
  let hasSystemReboot = false
  let hasLoginFailure = false
  let hasPppoeIssue = false
  let hasVpnIssue = false

  for (const log of logs) {
    const msg = (log.message || "").toLowerCase()
    const topics = (log.topics || "").toLowerCase()

    // Deteksi power/reboot
    if (msg.includes("router rebooted") || msg.includes("system started") || msg.includes("power") || msg.includes("ups")) {
      hasPowerEvent = true
      details.push(`⚡ [${log.time}] ${log.message}`)
    }
    
    // Deteksi system reboot/shutdown
    if (msg.includes("system shutdown") || msg.includes("reboot") || msg.includes("startup")) {
      hasSystemReboot = true
      details.push(`🔄 [${log.time}] ${log.message}`)
    }

    // Deteksi interface down
    if ((msg.includes("link down") || msg.includes("lost carrier") || msg.includes("interface") && msg.includes("down")) && !msg.includes("link up")) {
      hasInterfaceDown = true
      details.push(`🔌 [${log.time}] ${log.message}`)
    }

    // Deteksi DHCP gagal
    if (topics.includes("dhcp") && (msg.includes("no response") || msg.includes("timeout") || msg.includes("nak"))) {
      hasDhcpIssue = true
      details.push(`🌐 [${log.time}] ${log.message}`)
    }

    // Deteksi wireless disconnect
    if (topics.includes("wireless") && (msg.includes("disconnected") || msg.includes("lost connection") || msg.includes("deauthenticated"))) {
      hasWirelessDisconnect = true
      details.push(`📡 [${log.time}] ${log.message}`)
    }

    // Deteksi PPPoE issue
    if (topics.includes("pppoe") && (msg.includes("terminated") || msg.includes("timeout") || msg.includes("authentication failed"))) {
      hasPppoeIssue = true
      details.push(`📞 [${log.time}] ${log.message}`)
    }

    // Deteksi VPN/L2TP/SSTP issue
    if ((topics.includes("l2tp") || topics.includes("sstp") || topics.includes("ovpn") || topics.includes("ipsec")) && 
        (msg.includes("disconnected") || msg.includes("terminated") || msg.includes("timeout") || msg.includes("failed"))) {
      hasVpnIssue = true
      details.push(`🔒 [${log.time}] ${log.message}`)
    }

    // Deteksi login failure
    if (msg.includes("login failure") || msg.includes("authentication failed")) {
      hasLoginFailure = true
    }
  }

  // Tentukan penyebab utama berdasarkan prioritas
  if (hasPowerEvent || hasSystemReboot) {
    cause = "⚡ Mati Lampu / Router di-Restart"
  } else if (hasVpnIssue) {
    cause = "🔒 Koneksi VPN Terputus"
  } else if (hasPppoeIssue) {
    cause = "📞 Koneksi PPPoE/ISP Terputus"
  } else if (hasInterfaceDown) {
    cause = "🔌 Interface/Kabel Jaringan Terputus"
  } else if (hasWirelessDisconnect) {
    cause = "📡 Koneksi Wireless Terputus"
  } else if (hasDhcpIssue) {
    cause = "🌐 DHCP Gagal Mendapatkan IP"
  } else {
    cause = "🌐 Koneksi Internet/VPN Sempat Terputus"
  }

  // Batasi detail maksimal 8 entri agar pesan WA tidak terlalu panjang
  const limitedDetails = details.slice(-8)

  return { cause, details: limitedDetails }
}
