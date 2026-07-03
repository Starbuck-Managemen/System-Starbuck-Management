'use server'

import prisma from "@/lib/prisma"
import { auth, signOut } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateAccount(prevState: any, formData: FormData) {
  const session = await auth()
  
  // Security check: Ensure the user is updating their own account
  if (!session?.user) {
    return { success: false, error: "Tidak diizinkan. Silakan login kembali.", message: "" }
  }

  const userId = formData.get('userId') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string

  // Simple validation
  if (password && password.trim().length > 0 && password.trim().length < 6) {
    return { success: false, error: "Password wajib diisi minimal 6 karakter.", message: "" }
  }

  // Double-check auth
  const dbUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!dbUser || (dbUser.email !== session.user.email && dbUser.username !== session.user.name)) {
    return { success: false, error: "Anda hanya dapat mengubah akun Anda sendiri.", message: "" }
  }

  try {
    const dataToUpdate: any = {}
    if (password && password.trim().length >= 6) {
      dataToUpdate.password = password
    }
    if (phone !== null) {
      // Hanya biarkan angka
      const cleanedPhone = phone.replace(/[^0-9]/g, '')
      if (cleanedPhone !== dbUser.phone) {
         dataToUpdate.phone = cleanedPhone || null
      }
    }

    // Hanya update jika ada data yang ingin diubah
    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
      })
    }
    
    // revalidatePath only if we are not redirecting immediately
    if (!password || password.trim().length < 6) {
      revalidatePath('/dashboard/account')
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Email sudah digunakan oleh akun lain.", message: "" }
    }
    return { success: false, error: "Gagal menyimpan perubahan: " + error.message, message: "" }
  }

  // If password was changed, we log them out. MUST be outside try/catch!
  if (password && password.trim().length >= 6) {
    // Clear session in DB before signing out
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActive: new Date(0),
        currentSessionToken: null
      }
    })

    // signOut throws a NEXT_REDIRECT error which is handled by Next.js
    await signOut({ redirectTo: '/login' })
  }
  
  return { success: true, error: "", message: "Perubahan berhasil disimpan!" }
}

export async function updateAvatar(userId: string, base64Image: string) {
  const session = await auth()
  
  if (!session?.user) {
    return { success: false, error: "Tidak diizinkan." }
  }

  // Verify ownership
  const dbUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!dbUser || (dbUser.email !== session.user.email && dbUser.username !== session.user.name)) {
    return { success: false, error: "Anda hanya dapat mengubah akun Anda sendiri." }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { image: base64Image }
    })
    
    revalidatePath('/dashboard/account')
    return { success: true, message: "Foto profil berhasil diperbarui!" }
  } catch (error: any) {
    return { success: false, error: "Gagal mengunggah foto: " + error.message }
  }
}
