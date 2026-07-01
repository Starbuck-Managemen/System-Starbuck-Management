'use server'

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function logOut() {
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
          return 'Terjadi kesalahan.'
      }
    }
    throw error
  }
}
