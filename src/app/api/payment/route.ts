import { NextResponse } from 'next/server';
import { snap } from '@/lib/midtrans';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buat Order ID unik
    const orderId = `SaaS-${userId}-${Date.now()}`;
    const amount = 25000; // Harga Paket Pro

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: user.name || user.username,
        email: user.email,
        phone: user.phone || ''
      },
      item_details: [
        {
          id: 'PRO-1M',
          price: amount,
          quantity: 1,
          name: 'Paket Pro (1 Bulan)'
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Simpan data order ini ke database jika perlu (opsional)
    // Dihapus sementara untuk menghindari error Prisma Schema. Webhook akan menggunakan Order ID.

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
