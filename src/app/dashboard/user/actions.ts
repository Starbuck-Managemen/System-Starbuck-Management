'use server'

import prisma from "@/lib/prisma"
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!name || !username || !email || !password || !role) {
    return { error: 'All fields are required' }
  }

  try {
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password,
        role,
        status: 'Active'
      }
    })
  } catch (error: any) {
    // Unique constraint failed on the fields: (`username`) or (`email`)
    if (error.code === 'P2002') {
      return { error: 'Username or Email already exists' }
    }
    return { error: 'Failed to create user: ' + error.message }
  }

  revalidatePath('/dashboard/user')
  redirect('/dashboard/user')
}

export async function deleteUser(id: string) {
  try {
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
  const role = formData.get('role') as string

  if (!name || !username || !email || !role) {
    return { error: 'Semua field kecuali password wajib diisi' }
  }

  try {
    const updateData: any = {
      name,
      username,
      email,
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

    await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    return { success: successMessage }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username atau Email sudah digunakan' }
    }
    return { error: 'Gagal memperbarui user: ' + error.message }
  }
}
