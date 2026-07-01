'use client'

import { useState, useRef } from 'react'
import { User, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAvatar } from './actions'

export function AvatarUpload({ user }: { user: any }) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran (maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }

    setIsUploading(true)

    try {
      // Convert file to Base64 using FileReader
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        const base64String = reader.result as string
        
        // Memanggil server action
        const result = await updateAvatar(user.id, base64String)
        
        if (result.success) {
          toast.success(result.message)
        } else {
          toast.error(result.error)
        }
        setIsUploading(false)
      }
      
      reader.onerror = () => {
        toast.error('Gagal membaca file gambar')
        setIsUploading(false)
      }
      
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah gambar')
      setIsUploading(false)
    }
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <div className="h-24 w-24 rounded-full bg-[#0F172A] border-4 border-slate-700 flex items-center justify-center overflow-hidden shadow-inner relative transition-all group-hover:border-blue-500">
        {isUploading ? (
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        ) : user.image ? (
          <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover transition-opacity group-hover:opacity-50" />
        ) : (
          <User className="h-10 w-10 text-slate-500 transition-opacity group-hover:opacity-50" />
        )}
        
        {!isUploading && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white drop-shadow-md" />
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  )
}
