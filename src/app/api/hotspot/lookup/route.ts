import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
  }

  try {
    // Cari pesanan terakhir dengan nomor WA tersebut
    const lastOrder = await prisma.hotspotOrder.findFirst({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      select: { customerName: true }
    });

    if (lastOrder && lastOrder.customerName) {
      return NextResponse.json({ found: true, name: lastOrder.customerName });
    } else {
      return NextResponse.json({ found: false });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
