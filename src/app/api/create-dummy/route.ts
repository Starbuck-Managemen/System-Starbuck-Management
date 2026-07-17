import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) {
      return NextResponse.json({ error: 'Tidak ada data profile/paket di database' });
    }

    const order = await prisma.hotspotOrder.create({
      data: {
        routerId: profile.routerId,
        profileId: profile.id,
        customerName: 'Testing Pembeli',
        customerPhone: '081234567890',
        amount: 15000,
        status: 'SUCCESS',
        voucherCode: 'TEST-123'
      }
    });

    const invoiceUrl = `https://starbuck.web.id/invoice/hotspot/${order.id}`;

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2>Data Transaksi Palsu Berhasil Dibuat!</h2>
          <p>Silakan klik link di bawah ini untuk melihat faktur:</p>
          <a href="${invoiceUrl}" style="padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Lihat Struk Pembayaran
          </a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
