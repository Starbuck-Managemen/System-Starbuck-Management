import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkRouterStatus } from "@/app/dashboard/router/actions"
import { getRouterUptime, getRouterLogs, analyzeRouterLogs } from "@/lib/mikrotik"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max duration for vercel

// Helper to parse Mikrotik uptime string to seconds
// Examples: "1w2d3h4m5s", "2d3h4m5s", "4h5m12s", "12s"
function parseMikrotikUptime(uptimeStr: string): number {
  if (!uptimeStr) return 0;
  
  let totalSeconds = 0;
  
  const wMatch = uptimeStr.match(/(\d+)w/);
  const dMatch = uptimeStr.match(/(\d+)d/);
  const hMatch = uptimeStr.match(/(\d+)h/);
  const mMatch = uptimeStr.match(/(\d+)m/);
  const sMatch = uptimeStr.match(/(\d+)s/);
  
  if (wMatch) totalSeconds += parseInt(wMatch[1]) * 7 * 24 * 3600;
  if (dMatch) totalSeconds += parseInt(dMatch[1]) * 24 * 3600;
  if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
  if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
  if (sMatch) totalSeconds += parseInt(sMatch[1]);
  
  return totalSeconds;
}

// Format durasi offline ke string yang mudah dibaca
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} detik`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours < 24) return `${hours} jam ${mins} menit`
  const days = Math.floor(hours / 24)
  return `${days} hari ${hours % 24} jam`
}

// Global variable to keep track of running state to prevent overlaps
let isRunning = false

export async function GET(req: Request) {
  // Verifikasi token untuk keamanan cron
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  
  if (token !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isRunning) {
    return NextResponse.json({ message: "Already running" })
  }

  isRunning = true
  console.log("[ROUTER-MONITOR] Memulai pengecekan status router...")

  try {
    const routers = await prisma.router.findMany()
    const sendWaMessage = async (userId: string, message: string) => {
      try {
        const owner = await prisma.user.findUnique({ where: { id: userId } })
        console.log(`[ROUTER-MONITOR] Coba kirim WA ke ${owner?.username} (Phone: ${owner?.phone}, Role: ${owner?.role})`)
        // Hanya kirim notifikasi WA jika pemiliknya adalah ADMIN
        if (owner && owner.phone && owner.role === 'ADMIN') {
          console.log(`[ROUTER-MONITOR] Mengirim request ke WA API (clientId: ${userId})`)
          const waRes = await fetch('http://127.0.0.1:3001/send-wa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: userId, number: owner.phone, message })
          })
          const waData = await waRes.json();
          console.log(`[ROUTER-MONITOR] Respon WA API:`, waData)
        } else {
          console.log(`[ROUTER-MONITOR] Gagal kirim WA: Owner tidak ditemukan / nomor kosong / bukan ADMIN`)
        }
      } catch (e) {
        console.error("Gagal kirim WA notifikasi downtime", e)
      }
    }

    let logs = [];

    for (const router of routers) {
      try {
        console.log(`[ROUTER-MONITOR] Mengecek ${router.name}...`)
        const result = await checkRouterStatus(router.id)
        
        if (result.status === "Offline") {
          if (!router.isNotifiedOffline) {
            console.log(`[ROUTER-MONITOR] Router ${router.name} terdeteksi OFFLINE!`)
            
            const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            
            // Catat waktu offline dan penyebabnya
            await prisma.router.update({
              where: { id: router.id },
              data: { 
                lastOfflineAt: new Date(),
                offlineCause: result.cause,
                isNotifiedOffline: true
              }
            })
            
            let causeStr = result.cause === "VPN_DOWN" ? "Koneksi VPN Server Terputus" : (result.cause === "INTERNET_DOWN" ? "Akses Internet Mikrotik (Starlink) Terputus" : "Koneksi Terputus");
            const message = `⚠️ *[ALERT - ROUTER OFFLINE]*\n\nRouter *${router.name}* terdeteksi *OFFLINE* ❌\n\n🔍 *Penyebab:* ${causeStr}\n📍 Host: ${router.host}\n🕐 Waktu: ${waktu}\n\n_Sistem sedang menunggu koneksi pulih untuk menganalisa log..._`
            
            if (router.userId) {
              await sendWaMessage(router.userId, message)
            }
            
            logs.push({ 
              action: "notify_offline", 
              message
            })
          }
        } else { // Online atau Buruk (terkoneksi)
          if (router.isNotifiedOffline && router.lastOfflineAt) {
            console.log(`[ROUTER-MONITOR] Router ${router.name} terdeteksi ONLINE kembali! Menganalisa penyebab...`)
            
            const now = new Date()
            const waktu = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            const offlineDurationMs = now.getTime() - router.lastOfflineAt.getTime()
            const offlineDurationSecs = Math.floor(offlineDurationMs / 1000)
            const durasiStr = formatDuration(offlineDurationSecs)
            
            // Ambil uptime dari router
            const uptimeStr = await getRouterUptime(router.id)
            let uptimeAnalysis = ""
            let isRestarted = false
            
            if (uptimeStr) {
              const uptimeSecs = parseMikrotikUptime(uptimeStr)
              console.log(`[ROUTER-MONITOR] ${router.name} - Uptime: ${uptimeStr} (${uptimeSecs}s), Offline Duration: ${offlineDurationSecs}s`)
              
              // Jika uptime lebih kecil dari durasi offline → router pasti restart
              if (uptimeSecs < offlineDurationSecs + 120 || uptimeSecs < 300) {
                isRestarted = true
                uptimeAnalysis = `Router Uptime: ${uptimeStr} _(ter-reset, router pernah restart)_`
              } else {
                uptimeAnalysis = `Router Uptime: ${uptimeStr} _(tidak ter-reset)_`
              }
            }
            
            // ===== AMBIL DAN ANALISA LOG ROUTER =====
            let logAnalysisStr = ""
            try {
              const routerLogs = await getRouterLogs(router.id, 50)
              
              if (routerLogs.length > 0) {
                const analysis = analyzeRouterLogs(routerLogs)
                
                // Jika log mikrotik tidak menemukan alasan spesifik, gunakan offlineCause dari database
                if (analysis.cause === "🌐 Koneksi Internet/VPN Sempat Terputus" && (router as any).offlineCause) {
                  const dbCause = (router as any).offlineCause;
                  analysis.cause = dbCause === "VPN_DOWN" ? "🔌 Koneksi VPN Server Terputus" : "📡 Akses Internet (Starlink) Terputus";
                }

                logAnalysisStr = `\n\n🔍 *Analisa Penyebab:*\n${analysis.cause}`
                
                if (analysis.details.length > 0) {
                  logAnalysisStr += `\n\n📋 *Log Router Terkait:*`
                  for (const detail of analysis.details) {
                    logAnalysisStr += `\n${detail}`
                  }
                }
              } else {
                let fallbackCause = "🌐 Koneksi Internet/VPN Sempat Terputus";
                if ((router as any).offlineCause) {
                  const dbCause = (router as any).offlineCause;
                  fallbackCause = dbCause === "VPN_DOWN" ? "🔌 Koneksi VPN Server Terputus" : "📡 Akses Internet (Starlink) Terputus";
                }

                logAnalysisStr = "\n\n🔍 *Analisa Penyebab:*\n" + (isRestarted 
                  ? "⚡ Mati Lampu / Router di-Restart (log kosong setelah restart)" 
                  : fallbackCause)
              }
            } catch (logErr) {
              console.error(`[ROUTER-MONITOR] Gagal membaca log ${router.name}:`, logErr)
              
              let fallbackCause = "🌐 Koneksi Internet/VPN Sempat Terputus";
              if ((router as any).offlineCause) {
                const dbCause = (router as any).offlineCause;
                fallbackCause = dbCause === "VPN_DOWN" ? "🔌 Koneksi VPN Server Terputus" : "📡 Akses Internet (Starlink) Terputus";
              }

              logAnalysisStr = "\n\n🔍 *Analisa Penyebab:*\n" + (isRestarted 
                ? "⚡ Mati Lampu / Router di-Restart" 
                : fallbackCause)
            }
            
            // Update database reset notif
            await prisma.router.update({
              where: { id: router.id },
              data: {
                lastOfflineAt: null,
                offlineCause: null,
                isNotifiedOffline: false
              }
            })
            
            // Susun pesan lengkap
            let message = `✅ *[RESOLVED - ROUTER ONLINE]*\n\nRouter *${router.name}* kembali *ONLINE* ✅\n\n📍 Host: ${router.host}\n🕐 Waktu Pulih: ${waktu}\n⏱️ Durasi Offline: ${durasiStr}`
            
            if (uptimeAnalysis) {
              message += `\n🖥️ ${uptimeAnalysis}`
            }
            
            message += logAnalysisStr
            
            if (router.userId) {
              await sendWaMessage(router.userId, message)
            }
            
            logs.push({
              action: "notify_online",
              message
            })
          }
        }
      } catch (rErr) {
        console.error(`[ROUTER-MONITOR] Error cek router ${router.name}:`, rErr)
      }
    }
    
    console.log("[ROUTER-MONITOR] Selesai pengecekan.")
    isRunning = false
    
    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    isRunning = false
    console.error("[ROUTER-MONITOR] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
