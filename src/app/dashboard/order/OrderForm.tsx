'use client'

import { useState } from 'react'
import { createOrder } from './actions'
import { Save, Loader2, Send, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CartItem {
  profileId: string;
  name: string;
  price: number;
  quantity: number;
  customerName?: string;
}

export function OrderForm({ user, profiles, routerId }: { user: any, profiles: any[], routerId: string | undefined }) {
  const [isPending, setIsPending] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [customerName, setCustomerName] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  
  const selectedProfile = profiles.find(p => p.id === selectedProfileId)
  const isMonthly = selectedProfile?.name.toLowerCase().includes("bulan")
  
  const router = useRouter()

  const handleAddToCart = () => {
    if (!selectedProfileId) return
    const profile = profiles.find(p => p.id === selectedProfileId)
    if (!profile) return
    if (quantity < 1) return
    
    if (isMonthly && !customerName.trim()) {
      toast.error("Nama pelanggan wajib diisi untuk pesanan bulanan!")
      return
    }

    const trimmedName = customerName.trim()

    // Check if already in cart
    const existingIndex = cart.findIndex(item => item.profileId === selectedProfileId && item.customerName === trimmedName)
    if (existingIndex !== -1) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += quantity
      setCart(newCart)
    } else {
      setCart([...cart, { profileId: profile.id, name: profile.name, price: profile.price, quantity, customerName: trimmedName }])
    }
    
    // Reset inputs
    setSelectedProfileId("")
    setQuantity(1)
    setCustomerName("")
  }

  const handleRemoveFromCart = (indexToRemove: number) => {
    setCart(cart.filter((_, index) => index !== indexToRemove))
  }

  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!routerId) {
      toast.error("Router belum dikonfigurasi oleh Admin.")
      return
    }
    if (cart.length === 0) {
      toast.error("Keranjang pesanan masih kosong.")
      return
    }

    setIsPending(true)
    
    // Format package names: "1-JAM (x10), 1-BULAN [Nama: Budi] (x2)"
    const packageString = cart.map(item => `${item.name}${item.customerName ? ` [Nama: ${item.customerName}]` : ''} (x${item.quantity})`).join(', ')

    const formData = new FormData()
    formData.append('userId', user.id)
    formData.append('routerId', routerId)
    formData.append('packageName', packageString)
    formData.append('price', totalPrice.toString())
    
    try {
      const result = await createOrder(formData)
      if (result.success) {
        toast.success(result.message)
        
        // Format Pesan WA
        let itemsText = cart.map(item => `- ${item.name}${item.customerName ? ` (Nama: ${item.customerName})` : ''}: ${item.quantity} Voucher`).join('\n')
        const text = `Halo Admin, saya *${user.name}* (@${user.username}) ingin memesan voucher berikut:\n\n${itemsText}\n\n*Total Tagihan: Rp ${totalPrice}*\nMohon segera diproses!`
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(waUrl, '_blank')

        setCart([]) // Kosongkan keranjang
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error("Gagal membuat pesanan.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-800 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-bold text-slate-100 mb-6">Pilih Paket</h2>
      
      <div className="flex flex-col gap-4 mb-6 p-5 rounded-xl border border-slate-700/50 bg-[#0b1220]/50">
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 ml-1 block">Pilih Profil Voucher</label>
            <select 
              className="w-full bg-[#1E293B] border border-slate-700 h-11 px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-sm text-slate-200"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
            >
              <option value="" disabled>-- Pilih Profil Voucher --</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name} (Rp {profile.price})</option>
              ))}
            </select>
          </div>
          
          {isMonthly && (
            <div className="w-full">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 ml-1 block">Nama Pemilik Voucher <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-700 h-11 px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-sm text-slate-200 placeholder-slate-500"
                placeholder="Contoh: Budi, Kamar 01, dll"
              />
            </div>
          )}

          <div className="w-full">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 ml-1 block">Jumlah Voucher</label>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-[#1E293B] border border-slate-700 h-11 px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-sm text-slate-200"
              placeholder="Masukkan jumlah pesanan"
            />
          </div>
          <button 
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedProfileId}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-1"
          >
            <Plus className="w-4 h-4" /> Tambah ke Keranjang
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        
        <div className="flex-1 border border-slate-700 rounded-xl overflow-hidden mb-6 flex flex-col">
          <div className="bg-[#0b1220] px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Daftar Pesanan</span>
            <span>Subtotal</span>
          </div>
          <div className="p-2 flex flex-col gap-2 overflow-y-auto min-h-[100px] max-h-[200px]">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">
                Keranjang masih kosong
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-[#0b1220]/50 group transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-sm">
                      {item.name}
                      {item.customerName && <span className="text-blue-400 font-medium ml-1">[{item.customerName}]</span>}
                    </span>
                    <span className="text-xs text-slate-500">{item.quantity}x @ Rp {item.price}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 text-sm">Rp {item.price * item.quantity}</span>
                    <button type="button" onClick={() => handleRemoveFromCart(index)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-[#0b1220] p-4 border-t border-slate-700 flex justify-between items-center">
            <span className="text-sm text-slate-400 font-semibold">Total Pembayaran</span>
            <span className="text-xl font-black text-blue-400">Rp {totalPrice}</span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            type="submit"
            disabled={isPending || cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl text-base font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
          >
            {isPending ? (
              <Loader2 className="h-[20px] w-[20px] animate-spin" />
            ) : (
              <Send className="h-[20px] w-[20px]" />
            )}
            {isPending ? "Memproses..." : "Buat Pesanan Sekarang"}
          </button>
          <p className="text-center text-xs text-slate-500 mt-3">
            *Pesanan akan diteruskan otomatis ke WhatsApp Admin.
          </p>
        </div>
      </form>
    </div>
  )
}
