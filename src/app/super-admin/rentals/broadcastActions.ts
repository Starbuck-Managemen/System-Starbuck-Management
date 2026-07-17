'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function broadcastToRentals(message: string, targetHouseId?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }
    if (session.user.role !== 'SUPERADMIN') return { success: false, error: 'Hanya Super Admin yang bisa mengirim broadcast rumah sewa' }

    let houses = await prisma.rentalHouse.findMany()
    
    if (targetHouseId) {
      houses = houses.filter((h: any) => h.id === targetHouseId)
    }

    const validHouses = houses.filter((h: any) => h.tenantPhone && h.tenantPhone.trim() !== "")

    if (validHouses.length === 0) {
      return { success: false, error: 'Tidak ada data rumah sewa dengan nomor WA yang terdaftar.' }
    }

    let successCount = 0;
    let failCount = 0;
    let successDetails: string[] = [];
    let failDetails: string[] = [];

    for (const house of validHouses) {
      if (!house.tenantPhone) continue;

      const customizedMessage = `Halo ${house.tenantName || 'Bapak/Ibu'},\n\n${message}`;

      try {
        const waRes = await fetch('http://127.0.0.1:3001/send-wa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: session.user.id,
            number: house.tenantPhone,
            message: customizedMessage
          })
        });

        if (waRes.ok) {
          successCount++;
          successDetails.push(`${house.name} (${house.tenantPhone})`);
        } else {
          failCount++;
          const errorData = await waRes.json().catch(() => ({}));
          failDetails.push(`${house.name}: ${errorData.error || 'Gagal'}`);
        }
      } catch (err: any) {
        failCount++;
        failDetails.push(`${house.name}: ${err.message}`);
      }

      // Delay 3 detik antar pesan agar tidak diblokir WA
      await delay(3000);
    }

    let finalMessage = `Berhasil: ${successCount} kamar.\nGagal: ${failCount} kamar.`;
    if (successDetails.length > 0) finalMessage += `\n\nSukses terkirim ke:\n- ${successDetails.join('\n- ')}`;
    if (failDetails.length > 0) finalMessage += `\n\nGagal terkirim ke:\n- ${failDetails.join('\n- ')}`;

    return { success: true, message: finalMessage }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
