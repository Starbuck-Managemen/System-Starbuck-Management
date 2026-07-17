'use server'

import prisma from '@/lib/prisma'

export async function updatePasswordWithToken(token: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { resetToken: token }
    })

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { error: 'Token kadaluarsa atau tidak valid. Silakan ulangi.' }
    }

    // Update password, clear token, and sign out from other devices
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
        currentSessionToken: null, // logout other sessions
        lastActive: new Date(0)
      }
    })

    return { message: 'Password berhasil diubah!' }
  } catch (error) {
    console.error('Error updating password:', error)
    return { error: 'Terjadi kesalahan internal. Gagal menyimpan password.' }
  }
}
