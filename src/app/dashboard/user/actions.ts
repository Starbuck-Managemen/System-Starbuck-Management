'use server'

import prisma from "@/lib/prisma"
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from "@/auth"

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  let dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!dbUser && session.user.email) {
    dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  }
  return dbUser;
}

export async function createUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const currentUser = await getCurrentUser()
  const role = formData.get('role') as string
  const adminId = currentUser?.id || null

  if (!name || !username || !email || !password || !role || !phone) {
    return { error: 'All fields are required' }
  }

  const cleanedPhone = phone.replace(/[^0-9]/g, '')

  try {
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        phone: cleanedPhone,
        password,
        role,
        status: 'Active',
        adminId
      }
    })
  } catch (error: any) {
    // Unique constraint failed
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target && target.includes('phone')) {
        return { error: 'No. WhatsApp sudah digunakan oleh akun lain' }
      }
      if (target && target.includes('email')) {
        return { error: 'Email sudah digunakan oleh akun lain' }
      }
      if (target && target.includes('username')) {
        return { error: 'Username sudah digunakan oleh akun lain' }
      }
      return { error: 'Username, Email, atau No. WhatsApp sudah digunakan' }
    }
    return { error: 'Failed to create user: ' + error.message }
  }

  revalidatePath('/dashboard/user')
  redirect('/dashboard/user')
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUser()
  
  try {
    if (currentUser?.role === 'ADMIN') {
      const userToDelete = await prisma.user.findUnique({ where: { id } })
      if (!userToDelete || userToDelete.adminId !== currentUser.id) {
        throw new Error("Unauthorized to delete this user")
      }
    }

    await prisma.user.delete({
      where: { id }
    })
    revalidatePath('/dashboard/user')
  } catch (error) {
    console.error("Failed to delete user:", error)
  }
}

export async function updateUser(id: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string

  if (!name || !username || !email || !role || !phone) {
    return { error: 'Semua field kecuali password wajib diisi' }
  }

  const cleanedPhone = phone.replace(/[^0-9]/g, '')

  try {
    const updateData: any = {
      name,
      username,
      email,
      phone: cleanedPhone,
      role
    }
    
    // Hanya perbarui password jika diisi
    if (password && password.trim() !== '') {
      updateData.password = password
    }

    // Check what was changed to return specific messages
    let successMessage = 'Edit data user berhasil'
    
    // If we can determine specific changes (for simplicity we just say edit data user berhasil if multiple, 
    // or we can just say 'Edit data user berhasil' as a catch all, but let's provide the specific ones if possible).
    // Actually, since we don't fetch the old user here, we just say 'Edit data user berhasil' generally, 
    // but if password was provided, we can say 'Edit password success'
    if (password && password.trim() !== '') {
      successMessage = 'Edit password success'
    } else {
      successMessage = 'Edit data user berhasil'
    }

    const currentUser = await getCurrentUser()
    if (currentUser?.role === 'ADMIN') {
      const userToUpdate = await prisma.user.findUnique({ where: { id } })
      if (!userToUpdate || (userToUpdate.adminId !== currentUser.id && userToUpdate.id !== currentUser.id)) {
        throw new Error("Unauthorized to edit this user")
      }
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    return { success: successMessage }
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target && target.includes('phone')) {
        return { error: 'No. WhatsApp sudah digunakan oleh akun lain' }
      }
      if (target && target.includes('email')) {
        return { error: 'Email sudah digunakan oleh akun lain' }
      }
      if (target && target.includes('username')) {
        return { error: 'Username sudah digunakan oleh akun lain' }
      }
      return { error: 'Username, Email, atau No. WhatsApp sudah digunakan' }
    }
    return { error: 'Gagal memperbarui user: ' + error.message }
  }
}
