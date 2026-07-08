"use client"

import { useState, useTransition } from "react"
import { Search, Trash2, Loader2, Printer, Filter, MessageCircle, Send, AlertTriangle, Phone, CalendarSync, Ban } from "lucide-react"
import { deleteVoucherAction, changeProfileAction, updateWAAction, renewVoucherAction, disableVoucherAction } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export function VoucherTable({ 
  vouchers, 
  routerId,
  errorMessage,
  role
}: { 
  vouchers: any[], 
  routerId: string | null,
  errorMessage: string,
  role?: string
}) {
  // Dapatkan daftar profil unik dari data voucher untuk tombol filter
  const uniqueProfiles = Array.from(new Set(vouchers.map(v => v.profile))).filter(Boolean) as string[]
  const defaultProfile = uniqueProfiles.find(p => p.toLowerCase().includes("bulan")) || "All"

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProfile, setSelectedProfile] = useState<string>(defaultProfile)
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [warningId, setWarningId] = useState<string | null>(null)
  const [updatingWaId, setUpdatingWaId] = useState<string | null>(null)
  const [sendingWaId, setSendingWaId] = useState<string | null>(null)
  const [renewingId, setRenewingId] = useState<string | null>(null)
  const [disablingId, setDisablingId] = useState<string | null>(null)

  // Fungsi pembantu untuk mengurai format waktu MikroTik (misal: 1d2h3m) menjadi detik
  const parseMikrotikTime = (timeStr: string) => {
    if (!timeStr) return 0
    let totalSeconds = 0
    const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/
    const matches = timeStr.match(regex)
    if (matches) {
      if (matches[1]) totalSeconds += parseInt(matches[1]) * 604800 // weeks
      if (matches[2]) totalSeconds += parseInt(matches[2]) * 86400  // days
      if (matches[3]) totalSeconds += parseInt(matches[3]) * 3600   // hours
      if (matches[4]) totalSeconds += parseInt(matches[4]) * 60     // minutes
      if (matches[5]) totalSeconds += parseInt(matches[5])          // seconds
    }
    return totalSeconds
  }

  const getVoucherStatus = (v: any) => {
    if (v.disabled) return "NONAKTIF"
    
    let isExpiringSoon = false
    const now = new Date().getTime()
    
    if (v.expiresAt) {
      const expiresTime = new Date(v.expiresAt).getTime()
      // Jika sisa waktu kurang dari 2 hari (48 jam)
      if (expiresTime > now && expiresTime - now <= 48 * 60 * 60 * 1000) {
        isExpiringSoon = true
      }
      if (expiresTime <= now) {
         return "KADALUARSA" // Status baru
      }
    } else if (v.limitUptime) {
      // Fallback fallback
      const limitSec = parseMikrotikTime(v.limitUptime)
      const upSec = parseMikrotikTime(v.uptime)
      if (limitSec > 0 && limitSec - upSec <= 3600) isExpiringSoon = true
    }

    if (isExpiringSoon) return "HAMPIR HABIS"
    if (v.isActive) return "ACTIVE"
    if (v.uptime === "0s") return "BELUM DIPAKAI"
    return "OFFLINE"
  }

  const formatIndoDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const d = new Date(dateString)
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
    return `${months[d.getMonth()]}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }

  const filteredVouchers = vouchers.filter(v => {
    // Filter berdasarkan kategori/profil
    if (selectedProfile !== "All" && v.profile !== selectedProfile) {
      return false
    }

    // Filter berdasarkan status
    if (selectedStatus !== "All" && getVoucherStatus(v) !== selectedStatus) {
      return false
    }

    // Filter berdasarkan teks pencarian
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (v.name && v.name.toLowerCase().includes(q)) || 
           (v.profile && v.profile.toLowerCase().includes(q))
  })

  const handleDelete = (voucherId: string, voucherName: string) => {
    if (!routerId) return
    if (!confirm(`Apakah Anda yakin ingin menghapus voucher '${voucherName}'?`)) return
    
    setDeletingId(voucherId)
    startTransition(async () => {
      try {
        const result = await deleteVoucherAction(routerId, voucherName)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Voucher '${voucherName}' berhasil dihapus.`)
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat menghapus voucher.")
      } finally {
        setDeletingId(null)
      }
    })
  }

  const handleSendWarning = (voucherId: string, voucherName: string) => {
    if (!routerId) return
    if (!confirm(`Apakah Anda yakin ingin mengirim Peringatan Layar ke voucher '${voucherName}'?\nIni akan mengubah profilnya menjadi 'Profile-Peringatan'.`)) return
    
    setWarningId(voucherId)
    startTransition(async () => {
      try {
        const result = await changeProfileAction(routerId, voucherName, "Profile-Peringatan")
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Peringatan layar berhasil dikirim ke '${voucherName}'.`)
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat mengubah profil.")
      } finally {
        setWarningId(null)
      }
    })
  }

  const handleUpdateWA = (voucherId: string, voucherName: string, currentWA: string, currentComment: string) => {
    if (!routerId) return
    const inputWA = window.prompt("Masukkan nomor WhatsApp pelanggan (contoh: 628123456789):", currentWA)
    
    if (inputWA === null) return // User cancelled
    
    const formattedWA = inputWA.replace(/\D/g, '') // Hanya ambil angka
    
    let remainingDays: number | undefined = undefined;
    if (formattedWA && (!currentComment || !currentComment.includes("Created:"))) {
      const daysInput = window.prompt(`[PELANGGAN LAMA] Berapa sisa hari masa aktif untuk ${voucherName}? (Maksimal 30)`, "30")
      if (daysInput !== null) {
        remainingDays = parseInt(daysInput);
        if (isNaN(remainingDays) || remainingDays < 0 || remainingDays > 30) {
          toast.error("Jumlah hari tidak valid. Menggunakan default 30 hari.");
          remainingDays = 30;
        }
      }
    }

    setUpdatingWaId(voucherId)
    startTransition(async () => {
      try {
        const result = await updateWAAction(routerId, voucherName, formattedWA, remainingDays)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`WhatsApp untuk '${voucherName}' berhasil diperbarui!`)
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat menyimpan nomor WhatsApp.")
      } finally {
        setUpdatingWaId(null)
      }
    })
  }

  const handleSendManualWA = (voucherId: string, voucherName: string, waNumber: string, comment: string) => {
    if (!routerId) return
    
    if (!confirm(`Kirim pesan WA Uji Coba ke ${voucherName} (${waNumber}) sekarang via Bot?`)) return
    
    let customerName = "";
    if (comment) {
      const parts = comment.split("|");
      parts.forEach((p: string) => {
        if (p.startsWith("Nama:")) customerName = p.substring(5);
      });
    }
    const displayName = customerName ? customerName : voucherName;

    setSendingWaId(voucherId)
    startTransition(async () => {
      try {
        const hour = new Date().getHours();
        const greeting = hour < 4 ? "Selamat Malam" : hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
        const message = `${greeting} kak *${displayName}*! 👋\n\nIni dari Admin WiFi STARBUCK. Kami ingin menginformasikan bahwa masa aktif internet bulanan untuk kode voucher *${voucherName}* akan segera berakhir.\n\nMohon dapat melakukan perpanjangan agar tetap bisa menikmati koneksi internet kami dengan lancar ya kak. Terima kasih! 🙏`
        const waResponse = await fetch('/api/wa/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: waNumber, message })
        });
        
        if (!waResponse.ok) {
          const errorData = await waResponse.json().catch(() => ({}));
          toast.error(errorData.error || "Gagal mengirim pesan dari Bot WA")
        } else {
          toast.success("Pesan WA berhasil dikirim via Bot!")
        }
      } catch (err) {
        toast.error("Gagal terhubung ke service Bot WA")
      } finally {
        setSendingWaId(null)
      }
    })
  }

  const handleSendVoucherWA = (voucherId: string, voucherName: string, waNumber: string, comment: string, profile: string) => {
    if (!routerId) return
    
    if (!confirm(`Kirim pesan WA berisi detail voucher ke ${voucherName} (${waNumber}) sekarang via Bot?`)) return
    
    let customerName = "";
    if (comment) {
      const parts = comment.split("|");
      parts.forEach((p: string) => {
        if (p.startsWith("Nama:")) customerName = p.substring(5);
      });
    }
    const displayName = customerName ? customerName : voucherName;

    setSendingWaId(voucherId)
    startTransition(async () => {
      try {
        const hour = new Date().getHours();
        const greeting = hour < 4 ? "Selamat Malam" : hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
        
        const profilePrices: Record<string, number> = {
          "1-JAM": 10000,
          "6-Jam": 30000,
          "1-hari": 45000,
          "3-Hari": 75000,
          "15-Hari": 100000,
          "1-BULAN": 150000,
        };
        const price = profile && profilePrices[profile] ? profilePrices[profile] : 0;
        const priceFormatted = price > 0 ? `Rp ${new Intl.NumberFormat("id-ID").format(price)}` : "-";

        const message = `${greeting} kak *${displayName}*! 👋\n\nIni pesan otomatis dari Admin WiFi STARBUCK. Pendaftaran langganan internet kakak sudah berhasil kami proses ya.\n\nBerikut adalah detail akses WiFi kakak:\n🎟️ Kode Voucher: *${voucherName}*\n📦 Paket: *${profile}*\n💵 Harga: *${priceFormatted}*\n\nSelamat menikmati koneksi internet kami! Jika ada kendala, jangan sungkan untuk menghubungi kami. Terima kasih! 🙏`;
        
        const waResponse = await fetch('/api/wa/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: waNumber, message })
        });
        
        if (!waResponse.ok) {
          const errorData = await waResponse.json().catch(() => ({}));
          toast.error(errorData.error || "Gagal mengirim pesan dari Bot WA")
        } else {
          toast.success("Voucher berhasil dikirim via WA Bot!")
        }
      } catch (err) {
        toast.error("Gagal terhubung ke service Bot WA")
      } finally {
        setSendingWaId(null)
      }
    })
  }

  const handleRenew = (voucherId: string, voucherName: string) => {
    if (!routerId) return
    if (!confirm(`Apakah Anda yakin ingin memperpanjang masa aktif ${voucherName} selama 30 hari lagi?`)) return
    
    setRenewingId(voucherId)
    startTransition(async () => {
      try {
        const result = await renewVoucherAction(routerId, voucherName)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Voucher '${voucherName}' berhasil diperpanjang!`)
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat memperpanjang voucher.")
      } finally {
        setRenewingId(null)
      }
    })
  }

  const handleDisable = (voucherId: string, voucherName: string) => {
    if (!routerId) return
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan voucher ${voucherName}?`)) return
    
    setDisablingId(voucherId)
    startTransition(async () => {
      try {
        const result = await disableVoucherAction(routerId, voucherName)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Voucher '${voucherName}' berhasil dinonaktifkan!`)
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat menonaktifkan voucher.")
      } finally {
        setDisablingId(null)
      }
    })
  }

  return (
    <>
      <div className="p-6 border-b border-slate-800 flex flex-col gap-4">
        {/* Top Controls: Search & Print */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari username atau profil..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          {routerId && vouchers.length > 0 && (
            <Link 
              href={`/dashboard/voucher/print?routerId=${routerId}`}
              target="_blank"
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap text-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Semua
            </Link>
          )}
        </div>

        {/* Filters (Profiles & Status) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {uniqueProfiles.length > 0 && (
            <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="bg-transparent text-sm text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="All" className="bg-[#0F172A]">Semua Profil</option>
                {uniqueProfiles.map((profile) => (
                  <option key={profile as string} value={profile as string} className="bg-[#0F172A]">
                    {profile as string}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="All" className="bg-[#0F172A]">Semua Status</option>
              <option value="ACTIVE" className="bg-[#0F172A]">Active</option>
              <option value="OFFLINE" className="bg-[#0F172A]">Offline</option>
              <option value="BELUM DIPAKAI" className="bg-[#0F172A]">Belum Dipakai</option>
              <option value="HAMPIR HABIS" className="bg-[#0F172A]">Hampir Habis</option>
              <option value="NONAKTIF" className="bg-[#0F172A]">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
          <thead className="bg-[#0F172A] text-xs uppercase text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-4 w-[60px] text-center">No.</th>
              <th scope="col" className="px-6 py-4">Kode/Username</th>
              <th scope="col" className="px-6 py-4">Profil</th>
              <th scope="col" className="px-6 py-4">Harga</th>
              <th scope="col" className="px-6 py-4">Tanggal Active</th>
              <th scope="col" className="px-6 py-4">Tanggal Selesai</th>
              <th scope="col" className="px-6 py-4 text-center">Status</th>
              {role === 'ADMIN' && (
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {vouchers.length === 0 && !errorMessage ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  Tidak ada voucher ditemukan di router ini.
                </td>
              </tr>
            ) : filteredVouchers.length === 0 && vouchers.length > 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  Pencarian "{searchQuery}" tidak ditemukan.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((v, index) => {
                // Kalkulasi Harga dari Profil berdasarkan daftar harga spesifik
                let price = 0;
                const profilePrices: Record<string, number> = {
                  "1-JAM": 10000,
                  "6-Jam": 30000,
                  "1-hari": 45000,
                  "3-Hari": 75000,
                  "15-Hari": 100000,
                  "1-BULAN": 150000,
                };
                
                if (v.profile && profilePrices[v.profile]) {
                  price = profilePrices[v.profile];
                }

                const priceFormatted = price > 0 ? `Rp ${new Intl.NumberFormat("id-ID").format(price)}` : "-"

                // Kalkulasi Status & Atribut Tombol
                const status = getVoucherStatus(v);
                let waNumber = null
                let isMonthly = false
                
                if (v.comment && v.comment.includes("WA:")) {
                  isMonthly = true
                  const parts = v.comment.split("|")
                  parts.forEach((p: string) => {
                    if (p.startsWith("WA:")) waNumber = p.substring(3)
                  })
                }

                return (
                  <tr 
                    key={v.id} 
                    className={`border-b border-slate-800 transition-colors ${
                      v.disabled ? "bg-slate-900/50 opacity-75" : 
                      status === "HAMPIR HABIS" ? "bg-orange-950/20 hover:bg-orange-950/30" : "hover:bg-slate-800/50"
                    }`}
                  >
                  <td className="px-6 py-4 text-slate-500 font-medium text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex flex-col">
                      <span>{v.name}</span>
                      {v.password && v.password !== v.name && <span className="text-xs text-slate-500 font-mono">Pwd: {v.password}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {v.actualProfile || v.profile}
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium text-xs">
                    {priceFormatted}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">
                    {v.uptime === "0s" ? "-" : formatIndoDate(v.createdAt)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{v.uptime === "0s" ? "-" : formatIndoDate(v.expiresAt)}</span>
                      {(() => {
                        if (v.uptime === "0s" || !v.expiresAt) return null;
                        const expiresTime = new Date(v.expiresAt).getTime()
                        const diffMs = expiresTime - new Date().getTime()
                        
                        if (diffMs <= 0) return <span className="text-red-500 text-[10px] mt-1 font-semibold">Kedaluwarsa</span>
                        
                        const d = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                        
                        let sisaText = ""
                        if (d > 0) sisaText += `${d}h `
                        if (h > 0 || d > 0) sisaText += `${h}j `
                        sisaText += `${m}m`
                        
                        return <span className={`${d < 2 ? 'text-orange-400' : 'text-emerald-500'} text-[10px] mt-1`}>Sisa: {sisaText}</span>
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      status === "NONAKTIF" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      status === "KADALUARSA" ? "bg-red-900/30 text-red-500 border border-red-900/50" :
                      status === "HAMPIR HABIS" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : 
                      status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]" :
                      status === "BELUM DIPAKAI" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}>
                      {status}
                    </span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Action: Kirim WA Voucher Detail */}
                      {isMonthly && waNumber && (
                        <button 
                          onClick={() => handleSendVoucherWA(v.id, v.name, waNumber, v.comment || "", v.profile || "")}
                          disabled={isPending && sendingWaId === v.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Kirim Detail Voucher"
                        >
                          {isPending && sendingWaId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Action: Kirim WA Peringatan */}
                      {isMonthly && waNumber && (
                        <button 
                          onClick={() => handleSendManualWA(v.id, v.name, waNumber, v.comment || "")}
                          disabled={isPending && sendingWaId === v.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Kirim Peringatan"
                        >
                          {isPending && sendingWaId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Action: Disable Voucher (hanya muncul jika active) */}
                      {isMonthly && !v.disabled && (
                        <button 
                          onClick={() => handleDisable(v.id, v.name)}
                          disabled={isPending && disablingId === v.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Nonaktifkan Voucher"
                        >
                          {isPending && disablingId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Action: Perpanjang Voucher (hanya muncul jika disable) */}
                      {isMonthly && v.disabled && (
                        <button 
                          onClick={() => handleRenew(v.id, v.name)}
                          disabled={isPending && renewingId === v.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Perpanjang Masa Aktif"
                        >
                          {isPending && renewingId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CalendarSync className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Action: Set Nomor WA */}
                      <button 
                        onClick={() => handleUpdateWA(v.id, v.name, waNumber || "", v.comment || "")}
                        disabled={isPending && updatingWaId === v.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50"
                        title={waNumber ? "Ubah Nomor WA" : "Set Nomor WA"}
                      >
                        {isPending && updatingWaId === v.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* Action: Interupsi Layar untuk Pelanggan Harian/Perjam */}
                      {!isMonthly && (
                        <button 
                          onClick={() => handleSendWarning(v.id, v.name)}
                          disabled={isPending && warningId === v.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Tampilkan Peringatan di Layar Browser"
                        >
                          {isPending && warningId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Action: Hapus */}
                      <button 
                        onClick={() => handleDelete(v.id, v.name)}
                        disabled={isPending && deletingId === v.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                        title="Hapus Voucher"
                      >
                        {isPending && deletingId === v.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
