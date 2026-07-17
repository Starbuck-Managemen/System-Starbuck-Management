'use server'

import prisma from '@/lib/prisma'
import crypto from 'crypto'

import { getSettings } from "@/app/dashboard/settings/actions"

/**
 * Reset password (Token-Based):
 * 1. Verifikasi username + nomor WA
 * 2. Generate secure token
 * 3. Simpan token ke database (berlaku 15 menit)
 * 4. Kirim link reset via WA
 * 5. Jika Bot WA mati, kembalikan error (menutup celah keamanan)
 */
export async function resetPasswordWithWA(
  prevState: { status: string; message?: string; newPassword?: string } | undefined,
  formData: FormData,
): Promise<{ status: string; message?: string; newPassword?: string }> {
  try {
    const username = formData.get('username') as string
    const phone = formData.get('phone') as string

    if (!username) {
      return { status: 'error', message: 'Username diperlukan.' }
    }
    if (!phone) {
      return { status: 'error', message: 'Nomor WhatsApp diperlukan.' }
    }

    // Normalisasi nomor: hapus semua karakter non-digit
    const normalizedPhone = phone.replace(/[^0-9]/g, '')
    
    if (normalizedPhone.length < 10) {
      return { status: 'error', message: 'Format nomor WhatsApp tidak valid. Gunakan format 62xxx.' }
    }

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return { status: 'error', message: 'Username tidak ditemukan.' }
    }

    // Jika user sudah punya nomor WA → verifikasi harus cocok
    if (user.phone) {
      const dbPhone = user.phone.replace(/[^0-9]/g, '')
      const phoneMatch = dbPhone === normalizedPhone || 
        dbPhone.endsWith(normalizedPhone.slice(-10)) || 
        normalizedPhone.endsWith(dbPhone.slice(-10))

      if (!phoneMatch) {
        return { status: 'error', message: 'Nomor WhatsApp tidak cocok dengan yang terdaftar di akun ini. Hubungi Admin jika lupa nomor yang terdaftar.' }
      }
    }

    // Generate secure token (32 bytes hex)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 menit dari sekarang

    // Simpan token ke DB + update nomor WA jika belum ada
    const updateData: any = { resetToken, resetTokenExpiry }
    const isNewPhone = !user.phone
    
    if (isNewPhone) {
      updateData.phone = normalizedPhone
    }

    await prisma.user.update({
      where: { username },
      data: updateData
    })

    // Kirim link reset ke WA user
    let waSent = false
    try {
      const settings = await getSettings()
      
      const resetLink = `https://starbuck.web.id/login/reset-password/${resetToken}`
      const message = `🔑 *Permintaan Reset Password*\n\nHalo *${user.name || username}*!\n\nKami menerima permintaan untuk mereset password akun ${settings.appName} Anda.\n\nKlik tautan aman di bawah ini untuk membuat password baru:\n${resetLink}\n\n⚠️ _Tautan ini hanya berlaku selama 15 menit dan hanya bisa digunakan satu kali. Jika Anda tidak merasa memintanya, abaikan pesan ini._`

      const response = await fetch('http://127.0.0.1:3001/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.id, number: normalizedPhone, message })
      })

      if (response.ok) {
        waSent = true
      }
    } catch (e) {
      console.log('[FORGOT-PASSWORD] Bot WA offline, link reset gagal dikirim. Error:', e)
    }

    // Jika WA gagal, tolak permintaan untuk mencegah celah keamanan layar
    if (!waSent) {
      return { 
        status: 'error', 
        message: 'Bot WhatsApp sedang offline sehingga tidak dapat mengirim Link Reset. Silakan pastikan Bot aktif atau hubungi Super Admin.'
      }
    }

    // Kirim notifikasi ke Admin (fire-and-forget)
    try {
      const adminPhone = process.env.ADMIN_PHONE
      if (adminPhone) {
        const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        const adminMessage = `🔐 *[RESET PASSWORD]*\n\nUser *${username}* (${user.name || '-'}) meminta link reset password.\n\n📅 Waktu: ${now}\n📱 Nomor WA: ${normalizedPhone}${isNewPhone ? ' _(baru disimpan)_' : ''}`
        
        await fetch('http://127.0.0.1:3001/send-wa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: user.id, number: adminPhone, message: adminMessage })
        })
      }
    } catch {
      // Abaikan jika Bot WA offline
    }

    return { 
      status: 'success_wa', 
      message: `Tautan rahasia untuk mengubah password telah dikirim ke WhatsApp (${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-3)}). Berlaku 15 menit.` 
    }

  } catch (error) {
    console.error('Error reset password:', error)
    return { status: 'error', message: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' }
  }
}
