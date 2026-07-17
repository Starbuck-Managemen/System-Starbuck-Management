import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    const expectedToken = process.env.CRON_SECRET || '';

    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cari Super Admin atau Admin pertama untuk mendapatkan clientId WhatsApp
    let adminUser = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
    }

    if (!adminUser) {
      adminUser = await prisma.user.findFirst(); // Fallback ke user pertama jika tidak ada admin
    }

    const clientId = adminUser?.id;

    if (!clientId) {
      return NextResponse.json({ error: 'System Admin not found' }, { status: 500 });
    }

    // Gunakan zona waktu Indonesia (WIB) agar sesuai dengan waktu lokal pengguna
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = nowWIB.getMonth() + 1;
    const currentYear = nowWIB.getFullYear();
    const todayDateOnly = new Date(currentYear, currentMonth - 1, nowWIB.getDate());

    const houses = await prisma.rentalHouse.findMany({
      where: { status: 'OCCUPIED' }
    });

    for (const house of houses) {
      if (!house.tenantPhone) continue; // Skip jika tidak ada nomor HP

      // 1. Pastikan tagihan bulan ini sudah ter-generate (Auto-Invoicing)
      let currentInvoice = await prisma.rentalInvoice.findFirst({
        where: { houseId: house.id, month: currentMonth, year: currentYear }
      });

      if (!currentInvoice) {
        // Buat tagihan baru jika belum ada
        const dueDate = new Date(currentYear, currentMonth - 1, house.dueDate);
        currentInvoice = await prisma.rentalInvoice.create({
          data: {
            houseId: house.id,
            month: currentMonth,
            year: currentYear,
            amountDue: house.price,
            amountPaid: 0,
            status: "UNPAID",
            dueDate: dueDate
          }
        });
      }

      // Jika sudah lunas, tidak perlu diingatkan
      if (currentInvoice.status === 'PAID') {
        continue;
      }

      // Hitung selisih hari
      const targetDueDate = new Date(currentInvoice.dueDate.getFullYear(), currentInvoice.dueDate.getMonth(), currentInvoice.dueDate.getDate());
      const timeDiff = targetDueDate.getTime() - todayDateOnly.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24)); // Positif jika belum jatuh tempo, Negatif jika lewat

      // Tentukan ucapan berdasarkan waktu (WIB)
      const currentHour = nowWIB.getHours();
      let greeting = 'pagi';
      if (currentHour >= 11 && currentHour < 15) {
        greeting = 'siang';
      } else if (currentHour >= 15 && currentHour < 18) {
        greeting = 'sore';
      } else if (currentHour >= 18 || currentHour < 3) {
        greeting = 'malam';
      }

      const tenantName = house.tenantName || 'Bapak/Ibu';
      let message = '';
      const paymentLink = `https://starbuck.web.id/rentals/pay/${house.id}`;
      const sisaTagihan = (currentInvoice.amountDue - currentInvoice.amountPaid).toLocaleString('id-ID');

      if (daysDiff === 3) {
        message = `Halo selamat ${greeting} ${tenantName}.\n\nSekedar mengingatkan bahwa batas waktu jatuh tempo pembayaran sewa ${house.name} tinggal 3 hari lagi.\n\nMohon persiapkan pembayaran Anda. Terima kasih!`;
      } else if (daysDiff === 0) {
        message = `Halo selamat ${greeting} ${tenantName}.\n\nHari ini adalah batas akhir pembayaran sewa ${house.name} sejumlah Rp ${sisaTagihan}.\n\nSilakan lakukan pembayaran sekarang juga melalui link otomatis berikut:\n${paymentLink}\n\nTerima kasih atas kerjasamanya!`;
      } else if (daysDiff === -3 || daysDiff === -5) {
        message = `Halo selamat ${greeting} ${tenantName}.\n\nSekedar mengingatkan kembali bahwa tagihan pembayaran sewa ${house.name} sejumlah Rp ${sisaTagihan} sudah melewati batas waktu jatuh tempo.\n\nSilakan lakukan pembayaran melalui link otomatis berikut:\n${paymentLink}\n\nJika Anda sudah melakukan pembayaran, mohon abaikan pesan ini. Terima kasih atas kerjasamanya!`;
      }

      // Jika ada pesan yang harus dikirim, kirim ke wa-server
      if (message) {
        try {
          const waRes = await fetch('http://127.0.0.1:3001/send-wa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: clientId,
              number: house.tenantPhone,
              message: message
            })
          });
          
          let waData;
          try {
            waData = await waRes.json();
          } catch(err) {
            waData = { error: 'Gagal membaca respon dari wa-server' };
          }

          if (!waRes.ok) {
            throw new Error(waData.error || `HTTP ${waRes.status}`);
          }

          console.log(`[Rental Reminder] Sent to ${house.tenantPhone} (Days: ${daysDiff})`);
        } catch (e: any) {
          console.error(`[Rental Reminder] Error sending WA to ${house.tenantPhone}:`, e);
          return NextResponse.json({ error: `Gagal kirim WA ke ${house.tenantPhone}: ${e.message}` }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Rental reminders processed' });
  } catch (error: any) {
    console.error('[Rental Reminder] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
