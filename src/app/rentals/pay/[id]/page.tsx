import prisma from "@/lib/prisma"
import { RentalPayClient } from "./RentalPayClient"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function RentalPayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const house = await prisma.rentalHouse.findUnique({
    where: { id: resolvedParams.id },
    include: {
      invoices: {
        orderBy: [{ year: 'asc' }, { month: 'asc' }]
      }
    }
  })

  if (!house) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-8 pt-12 md:pt-20">
      <RentalPayClient house={house} invoices={house.invoices} />
    </div>
  )
}
