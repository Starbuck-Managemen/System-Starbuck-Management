'use server'

import prisma from "@/lib/prisma"
import { redirect } from 'next/navigation'

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string || 'USER'

  if (!name || !username || !email || !password) {
    return { error: 'Semua field wajib diisi' }
  }

  try {
    // Cek apakah nama sudah digunakan
    const existingName = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    
    if (existingName) {
      return { error: 'Nama sudah digunakan, silakan pilih yang lain' }
    }

    // Prisma's @unique constraints will catch username and email, but we can check them explicitly 
    // or rely on the P2002 error code. We will rely on P2002 for exact username/email matches 
    // but we can also check explicitly to give better messages.
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })
    if (existingUsername) {
      return { error: 'Username sudah digunakan, silakan pilih yang lain' }
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })
    if (existingEmail) {
      return { error: 'Email sudah digunakan, silakan pilih yang lain' }
    }

    // Buat user baru dengan default role User dan status Active
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
    if (error.code === 'P2002') {
      return { error: 'Username atau Email sudah digunakan' }
    }
    return { error: 'Gagal mendaftar: ' + error.message }
  }

  // Jika berhasil, redirect ke halaman login dengan query params sukses
  redirect('/login?registered=true')
}
