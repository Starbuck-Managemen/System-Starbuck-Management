import { NextResponse } from 'next/server';
import { snap } from '@/lib/midtrans';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { houseId, amount } = await req.json();

    if (!houseId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const house = await prisma.rentalHouse.findUnique({
      where: { id: houseId }
    });

    if (!house) {
      return NextResponse.json({ error: 'Kamar tidak ditemukan' }, { status: 404 });
    }

    // Buat Order ID unik dengan prefix RENTAL-
    // Format: RENTAL-{houseId}-{timestamp}
    const orderId = `RENTAL-${house.id}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: house.tenantName || house.name,
        phone: house.tenantPhone || ''
      },
      item_details: [
        {
          id: `RENT-${house.id}`,
          price: amount,
          quantity: 1,
          name: `Pembayaran Sewa - ${house.name}`
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);
    
    // We don't save to database yet. The webhook will handle the success event 
    // and distribute the payment across invoices.

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId
    });

  } catch (error: any) {
    console.error('Midtrans Rental Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
