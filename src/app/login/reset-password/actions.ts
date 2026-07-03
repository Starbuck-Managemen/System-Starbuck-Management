'use server'

import prisma from '@/lib/prisma'

export async function resetPassword(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    const token = formData.get('token') as string
    const newPassword = formData.get('password') as string
    
    if (!token) {
      return 'Token tidak valid.'
    }
    if (!newPassword || newPassword.length < 6) {
      return 'Password baru minimal 6 karakter.'
    }

    // Cari token di database
    const verification = await prisma.verificationToken.findFirst({
      where: { token }
    })

    if (!verification) {
      return 'Token reset password tidak ditemukan atau tidak valid.'
    }

    // Cek expire
    if (verification.expires < new Date()) {
      return 'Token reset password sudah kedaluwarsa. Silakan minta link baru.'
    }

    // Update password
    await prisma.user.update({
      where: { username: verification.identifier },
      data: { password: newPassword }
    })

    // Hapus token agar tidak bisa digunakan lagi
    await prisma.verificationToken.delete({
      where: { 
        identifier_token: {
          identifier: verification.identifier,
          token: verification.token
        }
      }
    })

    return 'success'
  } catch (error) {
    console.error('Error reset password:', error)
    return 'Terjadi kesalahan internal saat mereset password.'
  }
}
