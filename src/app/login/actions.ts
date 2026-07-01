'use server'

import { signIn, signOut, auth } from "@/auth"
import { AuthError } from "next-auth"
import prisma from "@/lib/prisma"

export async function logOut() {
  const session = await auth()
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastActive: new Date(0), // Set to past to make them offline immediately
        currentSessionToken: null
      }
    })
  }
  await signOut({ redirectTo: '/login' })
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    formData.append('redirectTo', '/dashboard')
    await signIn('credentials', formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Username atau kata sandi salah.'
        default:
          console.error("Auth Error:", error)
          return 'Terjadi kesalahan: ' + error.message
      }
    }
    console.error("Unknown Error:", error)
    throw error
  }
}
