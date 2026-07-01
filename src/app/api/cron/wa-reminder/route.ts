import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getVouchers, appendVoucherComment } from "@/lib/mikrotik";
import { enrichVoucher } from "@/lib/mikrotikUtils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const routers = await prisma.router.findMany();
    
    let totalChecked = 0;
    let totalSent = 0;
    let totalFailed = 0;
    const logs: string[] = [];

    // Mengambil parameter API (misal untuk testing manual dari dashboard)
    const url = new URL(request.url);
    const isTest = url.searchParams.get("test") === "true";

    for (const router of routers) {
      if (router.status === "Offline") continue;
      
      try {
        const vouchers = await getVouchers(router.id);
        
        // Harga tidak terlalu penting untuk logika notif, mock saja
        const mockPriceMap = new Map<string, number>();

        for (const v of vouchers) {
          totalChecked++;
          
          const enriched = enrichVoucher(v, mockPriceMap);
          if (!enriched.expiresAt) continue;

          // Kita hanya memproses voucher dengan validitas yang panjang (Bulanan)
          // Asumsi bulanan = 30 hari. Cek jika sisa waktu < 48 Jam
          const now = Date.now();
          const expiresAtMs = enriched.expiresAt.getTime();
          const msRemaining = expiresAtMs - now;
          
          // Kurang dari 48 jam dan masih positif (belum expired total lebih dari 24 jam)
          // Atau jika ini adalah tombol Test, kita bypass syarat 48 jam tapi pakai voucher test
          const isExpiringSoon = msRemaining > -86400000 && msRemaining <= (48 * 60 * 60 * 1000);
          
          if (isExpiringSoon || isTest) {
            const comment = v.comment || "";
            
            // Cek apakah ada nomor WA
            let waNumber = "";
            if (comment.includes("WA:")) {
              const parts = comment.split("|");
              parts.forEach((p: string) => {
                if (p.startsWith("WA:")) waNumber = p.substring(3);
              });
            }

            if (!waNumber) continue;

            // Cek apakah hari ini sudah dikirim (Anti-Spam)
            // Format: REMINDED:1690000000000
            let lastRemindedMs = 0;
            if (comment.includes("REMINDED:")) {
              const parts = comment.split("|");
              parts.forEach((p: string) => {
                if (p.startsWith("REMINDED:")) {
                  lastRemindedMs = parseInt(p.substring(9));
                }
              });
            }

            // Jangan kirim ulang jika baru dikirim dalam 24 jam terakhir (86400000 ms)
            if (now - lastRemindedMs < 86400000 && !isTest) {
               continue; // Sudah diingatkan hari ini
            }

            // Hitung sisa waktu agar bisa diinfokan ke user
            const daysLeft = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
            const hoursLeft = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1000)));

            const timeStr = daysLeft > 1 ? `${daysLeft} Hari` : `${hoursLeft} Jam`;

            // Kirim pesan!
            const message = `Halo Kak!\n\nIni adalah pesan otomatis dari *buckNet*.\nMasa aktif langganan internet untuk akun *${v.name}* Anda akan habis dalam waktu *${timeStr}*.\n\nMohon untuk segera melakukan perpanjangan agar koneksi internet Anda tidak terputus.\n\nTerima kasih! 🚀`;

            try {
              const waResponse = await fetch('http://127.0.0.1:3001/send-wa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: waNumber, message })
              });

              if (waResponse.ok) {
                 totalSent++;
                 logs.push(`Sukses mengirim WA ke ${waNumber} (User: ${v.name})`);
                 
                 // Update tag REMINDED di mikrotik
                 if (!isTest) {
                    await appendVoucherComment(router.id, v.name, `REMINDED:${now}`);
                 }
              } else {
                 totalFailed++;
                 logs.push(`Gagal dari API WA untuk ${waNumber} (User: ${v.name})`);
              }
            } catch (err) {
              totalFailed++;
              logs.push(`Bot WA Offline saat kirim ke ${waNumber} (User: ${v.name})`);
            }
          }
        }
      } catch (e: any) {
        logs.push(`Gagal memproses router ${router.name}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Patroli WA Selesai!",
      stats: { totalChecked, totalSent, totalFailed },
      logs
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
