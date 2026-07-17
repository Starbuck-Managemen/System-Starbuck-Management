import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import InvoiceLayout from "@/components/InvoiceLayout"

export default async function RentalInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const payment = await prisma.rentalPayment.findFirst({
    where: { paymentToken: resolvedParams.token },
    include: { house: true }
  })

  if (!payment) {
    notFound()
  }

  const items = [
    {
      name: `Pembayaran Sewa - ${payment.house.name}`,
      qty: 1,
      price: payment.amount,
      total: payment.amount
    }
  ]

  const formattedDate = new Date(payment.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // Format Status to match UI expectations
  let statusText = 'PENDING'
  if (payment.status === 'SUCCESS') statusText = 'Lunas'
  else if (payment.status === 'FAILED') statusText = 'Gagal'

  return (
    <InvoiceLayout
      invoiceNumber={payment.id.split('-')[0].toUpperCase()}
      date={formattedDate}
      status={statusText}
      paymentMethod={payment.paymentMethod === 'MIDTRANS' ? 'Online Payment (Midtrans)' : payment.paymentMethod}
      customerName={payment.house.tenantName || 'Penyewa'}
      customerPhone={payment.house.tenantPhone || ''}
      items={items}
      subtotal={payment.amount}
      discount={0}
      total={payment.amount}
      backUrl={`/rentals/pay/${payment.house.id}`}
      companyTagline="Manajemen Sewa Kos & Rumah"
    />
  )
}
