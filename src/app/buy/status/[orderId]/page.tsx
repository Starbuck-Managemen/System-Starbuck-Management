import StatusClient from "./StatusClient"

export default async function StatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  return <StatusClient orderId={resolvedParams.orderId} />
}
