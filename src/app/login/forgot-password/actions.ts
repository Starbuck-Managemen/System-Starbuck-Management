'use server'

import prisma from '@/lib/prisma'

/**
 * Generate random password yang mudah dibaca
 * Menghasilkan 8 karakter kombinasi huruf + angka
 */
function generatePassword(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Reset password:
 * 1. Verifikasi username + nomor WA
 * 2. Jika user belum punya nomor WA → simpan otomatis
 * 3. Generate password baru
 * 4. Update password di database
 * 5. Kirim password baru via WA ke user
 * 6. Kirim notifikasi ke admin via WA
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

    // Generate password baru
    const newPassword = generatePassword(8)

    // Update password + simpan nomor WA jika belum ada
    const updateData: any = { password: newPassword }
    const isNewPhone = !user.phone
    
    if (isNewPhone) {
      updateData.phone = normalizedPhone
    }

    await prisma.user.update({
      where: { username },
      data: updateData
    })

    // Kirim password baru ke WA user
    let waSent = false
    try {
      const { getSettings } = require("@/app/dashboard/settings/actions")
      const settings = await getSettings()
      const message = `🔑 *Reset Password Berhasil*\n\nHalo *${user.name || username}*!\n\nPassword akun ${settings.appName} Anda telah di-reset.\n\n👤 Username: *${username}*\n🔐 Password Baru: *${newPassword}*\n\n⚠️ _Segera ganti password ini setelah login untuk keamanan akun Anda._`

      const response = await fetch('http://127.0.0.1:3001/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: normalizedPhone, message })
      })

      if (response.ok) {
        waSent = true
      }
    } catch {
      console.log('[FORGOT-PASSWORD] Bot WA offline, password baru tidak dikirim via WA.')
    }

    // Kirim notifikasi ke Admin (fire-and-forget)
    try {
      const adminPhone = process.env.ADMIN_PHONE
      if (adminPhone) {
        const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        const adminMessage = `🔐 *[RESET PASSWORD]*\n\nUser *${username}* (${user.name || '-'}) melakukan reset password.\n\n📅 Waktu: ${now}\n📱 Nomor WA: ${normalizedPhone}${isNewPhone ? ' _(baru disimpan)_' : ''}\n📨 WA Terkirim: ${waSent ? 'Ya ✅' : 'Tidak ❌ (Bot offline)'}`
        
        await fetch('http://127.0.0.1:3001/send-wa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: adminPhone, message: adminMessage })
        })
      }
    } catch {
      // Abaikan jika Bot WA offline
    }

    // Jika WA terkirim, tampilkan pesan sukses tanpa tunjukkan password
    // Jika WA gagal, tunjukkan password di layar sebagai fallback
    if (waSent) {
      return { 
        status: 'success_wa', 
        message: `Password baru telah dikirim ke WhatsApp (${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-3)}).` 
      }
    } else {
      return { 
        status: 'success_no_wa', 
        message: 'Bot WhatsApp sedang tidak aktif. Catat password baru Anda di bawah ini.',
        newPassword 
      }
    }

  } catch (error) {
    console.error('Error reset password:', error)
    return { status: 'error', message: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' }
  }
}
