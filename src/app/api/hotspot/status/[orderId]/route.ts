import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const resolvedParams = await params;
    const order = await prisma.hotspotOrder.findUnique({
      where: { id: resolvedParams.orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      status: order.status,
      voucherCode: order.voucherCode,
      amount: order.amount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
