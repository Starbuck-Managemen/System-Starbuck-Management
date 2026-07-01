'use server'

import prisma from "@/lib/prisma"
import { getHotspotProfiles, addHotspotProfile, updateHotspotProfile, deleteHotspotProfile } from "@/lib/mikrotik"
import { revalidatePath } from "next/cache"

export async function getProfilesWithPrice(routerId: string) {
  if (!routerId) return { success: false, data: [] }
  
  try {
    // 1. Ambil profile dari MikroTik
    const mikrotikProfiles = await getHotspotProfiles(routerId)
    
    // 2. Ambil profile dari Database
    const dbProfiles = await prisma.profile.findMany({
      where: { routerId }
    })
    
    // 3. Gabungkan data
    const mergedProfiles = mikrotikProfiles.map(mkProfile => {
      const dbProfile = dbProfiles.find(p => p.name === mkProfile.name)
      return {
        name: mkProfile.name,
        sharedUsers: mkProfile.sharedUsers,
        rateLimit: mkProfile.rateLimit,
        price: dbProfile ? dbProfile.price : 0,
      }
    })
    
    return { success: true, data: mergedProfiles }
  } catch (error: any) {
    console.error("Error getProfilesWithPrice:", error)
    return { success: false, error: error.message || "Gagal mengambil profil" }
  }
}

export async function saveProfilePrice(routerId: string, name: string, price: number) {
  if (!routerId || !name) {
    return { success: false, error: "Data tidak lengkap" }
  }
  
  try {
    await prisma.profile.upsert({
      where: {
        routerId_name: {
          routerId,
          name
        }
      },
      update: {
        price
      },
      create: {
        routerId,
        name,
        price
      }
    })
    
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Error saveProfilePrice:", error)
    return { success: false, error: "Gagal menyimpan harga profil" }
  }
}

export async function createProfileAction(
  routerId: string, 
  data: { name: string; price: number; sharedUsers: string; rateLimit: string }
) {
  if (!routerId || !data.name) return { success: false, error: "Data tidak lengkap" }
  
  // 1. Simpan ke MikroTik
  const mkResult = await addHotspotProfile(routerId, {
    name: data.name,
    sharedUsers: data.sharedUsers,
    rateLimit: data.rateLimit
  })
  
  if (!mkResult.success) return mkResult

  // 2. Simpan Harga ke Database
  await prisma.profile.upsert({
    where: { routerId_name: { routerId, name: data.name } },
    update: { price: data.price },
    create: { routerId, name: data.name, price: data.price }
  })
  
  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function editProfileAction(
  routerId: string, 
  oldName: string,
  data: { name: string; price: number; sharedUsers: string; rateLimit: string }
) {
  if (!routerId || !oldName || !data.name) return { success: false, error: "Data tidak lengkap" }
  
  // 1. Update ke MikroTik
  const mkResult = await updateHotspotProfile(routerId, oldName, {
    name: data.name,
    sharedUsers: data.sharedUsers,
    rateLimit: data.rateLimit
  })
  
  if (!mkResult.success) return mkResult

  // 2. Update Harga di Database
  // Pertama, update record lama jika namanya berubah
  if (oldName !== data.name) {
    const existingDb = await prisma.profile.findUnique({
      where: { routerId_name: { routerId, name: oldName } }
    })
    
    if (existingDb) {
      await prisma.profile.update({
        where: { id: existingDb.id },
        data: { name: data.name, price: data.price }
      })
    } else {
      await prisma.profile.create({
        data: { routerId, name: data.name, price: data.price }
      })
    }
  } else {
    // Jika namanya tidak berubah, upsert saja
    await prisma.profile.upsert({
      where: { routerId_name: { routerId, name: data.name } },
      update: { price: data.price },
      create: { routerId, name: data.name, price: data.price }
    })
  }
  
  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function deleteProfileAction(routerId: string, profileName: string) {
  if (!routerId || !profileName) return { success: false, error: "Data tidak lengkap" }
  
  // 1. Hapus dari MikroTik
  const mkResult = await deleteHotspotProfile(routerId, profileName)
  if (!mkResult.success) return mkResult

  // 2. Hapus dari Database jika ada
  try {
    await prisma.profile.delete({
      where: { routerId_name: { routerId, name: profileName } }
    })
  } catch (e) {
    // Jika tidak ada di DB abaikan saja
  }
  
  revalidatePath("/dashboard/profile")
  return { success: true }
}
