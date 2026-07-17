import { getHouses, getRentalPayments } from "./actions"
import { RentalsClient } from "./RentalsClient"

export const dynamic = 'force-dynamic'

export default async function RentalsPage() {
  const houses = await getHouses()
  const payments = await getRentalPayments()

  return (
    <div className="w-full max-w-6xl mx-auto">
      <RentalsClient houses={houses} payments={payments} />
    </div>
  )
}
