'use server'

import { getVouchers } from '@/lib/mikrotik'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function broadcastToVouchers(message: string, routerId: string, targetVoucherId?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    const router = await prisma.router.findUnique({
      where: { id: routerId, userId: session.user.id }
    })

    if (!router) return { success: false, error: 'Router tidak ditemukan' }

    let vouchers = await getVouchers(router.id)
    if (!vouchers || vouchers.length === 0) {
      return { success: false, error: 'Tidak ada voucher ditemukan' }
    }

    if (targetVoucherId) {
      vouchers = vouchers.filter((v: any) => v.id === targetVoucherId);
    }

    let successCount = 0;
    let failCount = 0;
    let successDetails: string[] = [];
    let failDetails: string[] = [];

    for (const v of vouchers) {
      const comment = v.comment || "";
      let waNumber = "";
      if (comment.includes("WA:")) {
        const parts = comment.split("|");
        parts.forEach((p: string) => {
          if (p.startsWith("WA:")) waNumber = p.substring(3);
        });
      }

      if (!waNumber) continue;

      const customizedMessage = `Halo kak ${v.name},\n\n${message}`;

      try {
        const waRes = await fetch('http://127.0.0.1:3001/send-wa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: session.user.id,
            number: waNumber,
            message: customizedMessage
          })
        });

        if (waRes.ok) {
          successCount++;
          successDetails.push(`${v.name} (${waNumber})`);
        } else {
          failCount++;
          const errorData = await waRes.json().catch(() => ({}));
          failDetails.push(`${v.name}: ${errorData.error || 'Gagal'}`);
        }
      } catch (err: any) {
        failCount++;
        failDetails.push(`${v.name}: ${err.message}`);
      }

      // Delay 3 detik antar pesan agar tidak diblokir WA
      await delay(3000);
    }

    if (successCount === 0 && failCount === 0) {
      return { success: false, error: 'Tidak ada pengguna voucher dengan nomor WA yang terdaftar.' }
    }

    let finalMessage = `Berhasil: ${successCount} user.\nGagal: ${failCount} user.`;
    if (successDetails.length > 0) finalMessage += `\n\nSukses terkirim ke:\n- ${successDetails.join('\n- ')}`;
    if (failDetails.length > 0) finalMessage += `\n\nGagal terkirim ke:\n- ${failDetails.join('\n- ')}`;

    return { success: true, message: finalMessage }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
