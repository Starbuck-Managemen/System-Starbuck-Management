import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getVouchers, deleteVoucher, disableVoucher } from "@/lib/mikrotik";
import { enrichVoucher } from "@/lib/mikrotikUtils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Verifikasi token untuk keamanan cron
    if (token !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routers = await prisma.router.findMany({
      where: { status: { not: "Offline" } }
    });
    
    let totalChecked = 0;
    let totalDeleted = 0;
    const logs: string[] = [];

    for (const router of routers) {
      try {
        const vouchers = await getVouchers(router.id);
        
        // Ambil referensi Harga Profil dari Database
        const dbProfiles = await prisma.profile.findMany({
          where: { routerId: router.id }
        });
        const priceMap = new Map<string, number>();
        dbProfiles.forEach(p => priceMap.set(p.name, p.price));

        const now = Date.now();

        for (const v of vouchers) {
          totalChecked++;
          
          const enriched = enrichVoucher(v, priceMap);
          
          // Skip if no expiration or not used
          if (!enriched.expiresAt || !v.uptime || v.uptime === "0s") continue;

          const expiresAtMs = enriched.expiresAt.getTime();
          const currentNow = Date.now(); // Capture exact time for this iteration
          
          // Jika sudah melewati batas kadaluarsa (tambahkan buffer 5 detik untuk amannya)
          if (currentNow >= expiresAtMs - 5000) {
            // 1. Simpan ke database Transaction (Remove & Record)
            const userIdToSave = router.userId;
            
            // Cek apakah sudah pernah direcord sebelumnya agar tidak duplikat (opsional, tapi pakai ID voucher)
            const existingTx = await prisma.transaction.findFirst({
              where: { 
                username: v.name,
                createdAt: enriched.createdAt
              }
            });

            if (!existingTx) {
              await prisma.transaction.create({
                data: {
                  userId: userIdToSave,
                  amount: enriched.price,
                  type: "Income",
                  username: v.name,
                  voucherType: enriched.actualProfile,
                  activeAt: enriched.createdAt,
                  expiresAt: enriched.expiresAt,
                  createdAt: enriched.createdAt, // Simpan waktu aktif pertama kali sebagai createdAt agar grafik akurat
                }
              });
            }

            // 2. Hapus atau Disable dari MikroTik
            const isMonthly = enriched.actualProfile.toLowerCase().includes("bulan");
            
            if (isMonthly) {
              // Jika langganan bulanan, cukup di-disable agar bisa di-renew nanti
              const disableRes = await disableVoucher(router.id, v.name);
              if (disableRes.success) {
                totalDeleted++; // We reuse the counter
                logs.push(`Record & Disable Sukses (Bulanan): ${v.name}`);
              } else {
                logs.push(`Gagal mendisable: ${v.name}`);
              }
            } else {
              // Jika bukan bulanan, hapus permanen
              const delRes = await deleteVoucher(router.id, v.id || v.name);
              if (delRes.success) {
                totalDeleted++;
                logs.push(`Record & Remove Sukses: ${v.name}`);
              } else {
                logs.push(`Gagal menghapus: ${v.name} - ${delRes.error}`);
              }
            }
          }
        }
      } catch (e: any) {
        logs.push(`Gagal memproses router ${router.name}: ${e.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      summary: { totalChecked, totalDeleted },
      logs 
    });
  } catch (error: any) {
    console.error("[AUTO-DELETE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
