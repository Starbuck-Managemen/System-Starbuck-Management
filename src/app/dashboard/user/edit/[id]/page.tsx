import { notFound } from 'next/navigation'
import prisma from "@/lib/prisma"
import { EditUserForm } from './EditForm'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id }
  })

  if (!user) {
    notFound()
  }

  return <EditUserForm user={user} />
}
