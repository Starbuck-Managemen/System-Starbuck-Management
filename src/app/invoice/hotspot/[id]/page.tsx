import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import InvoiceLayout from "@/components/InvoiceLayout"

export default async function HotspotInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const order = await prisma.hotspotOrder.findUnique({
    where: { id: resolvedParams.id },
    include: { profile: true }
  })

  if (!order) {
    notFound()
  }

  const items = [
    {
      name: `Voucher WiFi - ${order.profile.name}`,
      qty: 1,
      price: order.amount,
      total: order.amount
    }
  ]

  const formattedDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // Format Status to match UI expectations
  let statusText = 'PENDING'
  if (order.status === 'SUCCESS') statusText = 'Lunas'
  else if (order.status === 'FAILED') statusText = 'Gagal'

  return (
    <InvoiceLayout
      invoiceNumber={order.id.split('-')[0].toUpperCase()}
      date={formattedDate}
      status={statusText}
      paymentMethod="Online Payment (Midtrans)"
      customerName={order.customerName || 'Pelanggan'}
      customerPhone={order.customerPhone || ''}
      items={items}
      subtotal={order.amount}
      discount={0}
      total={order.amount}
      backUrl={`/buy/status/${order.id}`}
    />
  )
}
