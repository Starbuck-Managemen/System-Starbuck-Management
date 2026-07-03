'use server'

import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { headers } from 'next/headers'

export async function requestPasswordReset(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    const username = formData.get('username') as string
    
    if (!username) {
      return 'Username diperlukan.'
    }

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return 'Username tidak ditemukan.'
    }

    if (!user.phone) {
      return 'Akun ini tidak memiliki nomor WhatsApp yang terdaftar. Silakan hubungi Admin.'
    }

    // Buat token unik
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // Expire 1 jam

    // Hapus token lama untuk user ini jika ada
    await prisma.verificationToken.deleteMany({
      where: { identifier: username }
    })

    // Simpan token baru
    await prisma.verificationToken.create({
      data: {
        identifier: username,
        token,
        expires
      }
    })

    // Kirim pesan WA
    const headersList = await headers()
    const host = headersList.get('host') || '127.0.0.1:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http' // For now, assume HTTP unless they have HTTPS
    
    const resetUrl = `${protocol}://${host}/login/reset-password?token=${token}`
    const message = `Halo ${user.name || user.username}!\n\nKami menerima permintaan untuk mereset password akun buckNet Manager Anda.\n\nKlik link di bawah ini untuk membuat password baru:\n${resetUrl}\n\n_Link ini hanya berlaku selama 1 jam._`

    const response = await fetch('http://127.0.0.1:3001/send-wa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: user.phone,
        message: message
      })
    })

    if (!response.ok) {
      console.error('Gagal mengirim WA:', await response.text())
      return 'Gagal mengirim pesan WhatsApp. Pastikan Bot WA menyala.'
    }

    return 'success'
  } catch (error) {
    console.error('Error request reset password:', error)
    return 'Terjadi kesalahan internal. Silakan coba lagi nanti.'
  }
}
