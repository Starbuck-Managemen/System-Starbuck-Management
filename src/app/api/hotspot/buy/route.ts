import { NextResponse } from 'next/server';
import { snap } from '@/lib/midtrans';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { routerId, profileId, phone, name, previousVoucher } = await req.json();

    if (!routerId || !profileId || !phone || !name) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Verify router and profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.routerId !== routerId) {
      return NextResponse.json({ error: 'Profil tidak valid' }, { status: 404 });
    }

    if (profile.price <= 0) {
      return NextResponse.json({ error: 'Harga paket tidak valid' }, { status: 400 });
    }

    // Embed previousVoucher into customerName if provided (Format: Name | RENEW:CODE)
    const finalCustomerName = previousVoucher && previousVoucher.trim() !== "" 
      ? `${name} | RENEW:${previousVoucher.trim()}`
      : name;

    // Create pending HotspotOrder
    const order = await prisma.hotspotOrder.create({
      data: {
        routerId,
        profileId,
        customerName: finalCustomerName,
        customerPhone: phone,
        amount: profile.price,
        status: 'PENDING'
      }
    });

    // Format Midtrans Order ID: HOTSPOT-{id}
    const midtransOrderId = `HOTSPOT-${order.id}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: profile.price
      },
      customer_details: {
        first_name: name,
        phone: phone
      },
      item_details: [
        {
          id: profile.id,
          price: profile.price,
          quantity: 1,
          name: `Voucher WiFi - ${profile.name}`
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Update order with token
    await prisma.hotspotOrder.update({
      where: { id: order.id },
      data: {
        paymentToken: transaction.token,
        paymentUrl: transaction.redirect_url
      }
    });

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: order.id
    });

  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
