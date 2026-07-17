import { NextResponse } from 'next/server';
import { snap } from '@/lib/midtrans';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { generateVouchers, renewVoucher } from '@/lib/mikrotik';

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // Verifikasi Signature Key dari Midtrans
    const orderId = notificationJson.order_id;
    const statusCode = notificationJson.status_code;
    const grossAmount = notificationJson.gross_amount;
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    const signatureKey = crypto.createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    if (signatureKey !== notificationJson.signature_key) {
      return NextResponse.json({ error: 'Invalid Signature Key' }, { status: 403 });
    }

    // Ambil status transaksi dari Midtrans SDK (opsional tapi disarankan)
    const transactionStatusResp = await snap.transaction.notification(notificationJson);
    const transactionStatus = transactionStatusResp.transaction_status;
    const fraudStatus = transactionStatusResp.fraud_status;

    let paymentStatus = 'PENDING';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'accept') {
        paymentStatus = 'SUCCESS';
      }
    } else if (transactionStatus == 'settlement') {
      paymentStatus = 'SUCCESS';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      paymentStatus = 'FAILED';
    } else if (transactionStatus == 'pending') {
      paymentStatus = 'PENDING';
    }

    // Karena kita tidak menyimpan Payment sementara (untuk menghindari error schema), 
    // kita cek jenis transaksinya dari awalan orderId
    
    // --- JIKA TRANSAKSI SAAS (DARI ADMIN) ---
    if (orderId.startsWith('SaaS-')) {
      const parts = orderId.split('-');
      if (parts.length < 3) return NextResponse.json({ status: 'Ignored, bad SaaS order' });
      const userId = parts.slice(1, -1).join('-');

    // Jika sukses, perpanjang masa aktif klien!
    if (paymentStatus === 'SUCCESS') {
      // Cek agar tidak memproses webhook Midtrans dua kali (duplicate request)
      const existingTx = await prisma.transaction.findFirst({ where: { username: orderId } });
      if (existingTx) {
        return NextResponse.json({ status: 'Already processed' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        let newEndDate = new Date();
        // Jika masih aktif, tambah dari tanggal expired. Jika expired, hitung dari hari ini.
        if (user.subscriptionEndsAt && user.subscriptionEndsAt > new Date()) {
          newEndDate = new Date(user.subscriptionEndsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          newEndDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'Active',
            subscriptionEndsAt: newEndDate
          }
        });

        // Simpan sebagai riwayat transaksi (username kita pinjam untuk orderId)
        await prisma.transaction.create({
          data: {
            userId: user.id,
            amount: 25000,
            type: 'Income',
            username: orderId,
            voucherType: 'SaaS Pro (1 Bulan)'
          }
        });
      }
    }
    
    // --- JIKA TRANSAKSI VOUCHER HOTSPOT (DARI END-USER) ---
    } else if (orderId.startsWith('HOTSPOT-')) {
      const hotspotOrderId = orderId.replace('HOTSPOT-', '');
      
      if (paymentStatus === 'SUCCESS') {
        const order = await prisma.hotspotOrder.findUnique({
          where: { id: hotspotOrderId },
          include: { profile: true, router: true }
        });

        if (order && order.status === 'PENDING') {
          let isRenewal = false;
          let oldVoucherCode = "";
          let cleanCustomerName = order.customerName || "";

          // Cek apakah ini perpanjangan (RENEW)
          if (cleanCustomerName.includes(" | RENEW:")) {
            const parts = cleanCustomerName.split(" | RENEW:");
            cleanCustomerName = parts[0];
            oldVoucherCode = parts[1].trim();
            isRenewal = true;
          }

          let success = false;
          let generatedCode = oldVoucherCode;
          let waMessage = "";

          if (isRenewal) {
            // Perpanjang voucher lama
            const result = await renewVoucher(order.routerId, oldVoucherCode);
            if (result.success) {
              success = true;
              waMessage = `Halo ${cleanCustomerName}! Pembayaran berhasil.\n\nVoucher WiFi Anda dengan kode *${oldVoucherCode}* (Paket: ${order.profile.name}) telah berhasil *DIPERPANJANG* dan aktif kembali.\n\nTerima kasih!`;
            } else {
              console.error("Gagal perpanjang voucher:", result.error);
              // Fallback to generate new if renewal failed? For now just fail.
            }
          } else {
            // Generate 1 voucher via Mikrotik
            const result = await generateVouchers(order.routerId, "all", order.profile.name, 1, 8);
            if (result.success && result.vouchers && result.vouchers.length > 0) {
              success = true;
              generatedCode = result.vouchers[0].name;
              waMessage = `Halo ${cleanCustomerName}! Terima kasih telah melakukan pembelian voucher WiFi.\n\nDetail Voucher:\n- Paket: ${order.profile.name}\n- Kode Voucher: *${generatedCode}*\n- Password: (Kosongkan atau sama dengan kode)\n\nSilakan masukkan kode tersebut di halaman login hotspot.`;
            }
          }

          if (success) {
            // Update order status
            await prisma.hotspotOrder.update({
              where: { id: order.id },
              data: { 
                status: 'SUCCESS', 
                voucherCode: generatedCode,
                customerName: cleanCustomerName // Bersihkan nama dari tag RENEW
              }
            });

            // Catat Income ke router admin
            await prisma.transaction.create({
              data: {
                userId: order.router.userId,
                amount: order.amount,
                type: 'Income',
                username: generatedCode,
                voucherType: order.profile.name
              }
            });

            // Kirim WA jika ada nomor HP
            if (order.customerPhone) {
              try {
                await fetch('http://127.0.0.1:3001/send-wa', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clientId: order.router.userId,
                    number: order.customerPhone,
                    message: waMessage
                  })
                });
              } catch (waError) {
                console.error("Gagal mengirim WA dari webhook", waError);
              }
            }
          }
        }
      } else if (paymentStatus === 'FAILED') {
        await prisma.hotspotOrder.update({
          where: { id: hotspotOrderId },
          data: { status: 'FAILED' }
        });
      }
      
    // --- JIKA TRANSAKSI SEWA RUMAH (DARI END-USER) ---
    } else if (orderId.startsWith('RENTAL-')) {
      const parts = orderId.split('-');
      if (parts.length < 3) return NextResponse.json({ status: 'Ignored, bad Rental order' });
      const houseId = parts[1];
      const timestamp = parts[2];

      if (paymentStatus === 'SUCCESS') {
        // Cek agar tidak memproses webhook Midtrans dua kali
        const existingPayment = await prisma.rentalPayment.findFirst({ where: { paymentToken: orderId } });
        if (existingPayment) {
          return NextResponse.json({ status: 'Already processed' });
        }

        const house = await prisma.rentalHouse.findUnique({ where: { id: houseId } });
        if (!house) return NextResponse.json({ status: 'House not found' });

        // 1. Buat record RentalPayment
        const payment = await prisma.rentalPayment.create({
          data: {
            houseId,
            amount: parseFloat(grossAmount),
            paymentMethod: 'MIDTRANS',
            status: 'SUCCESS',
            paymentToken: orderId // we use paymentToken to store the orderId to prevent duplicates
          }
        });

        // 2. FIFO Ledger System
        // Ambil semua invoice yang belum lunas, urutkan dari yang paling lama
        const unpaidInvoices = await prisma.rentalInvoice.findMany({
          where: {
            houseId,
            status: { not: 'PAID' }
          },
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        });

        let remainingMoney = payment.amount;

        for (const invoice of unpaidInvoices) {
          if (remainingMoney <= 0) break;

          const sisaTagihan = invoice.amountDue - invoice.amountPaid;
          
          if (remainingMoney >= sisaTagihan) {
            // Lunas
            await prisma.rentalInvoice.update({
              where: { id: invoice.id },
              data: {
                amountPaid: invoice.amountDue,
                status: 'PAID'
              }
            });
            remainingMoney -= sisaTagihan;
          } else {
            // Bayar sebagian
            await prisma.rentalInvoice.update({
              where: { id: invoice.id },
              data: {
                amountPaid: invoice.amountPaid + remainingMoney,
                status: 'PARTIAL'
              }
            });
            remainingMoney = 0; // Uang habis
          }
        }
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
