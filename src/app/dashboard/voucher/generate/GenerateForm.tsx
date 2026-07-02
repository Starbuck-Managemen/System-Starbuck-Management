"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { processGenerateVoucher, processManualVoucher } from "./actions"
import { sendManualWAAction } from "../actions"
import { PlusCircle, Loader2, Settings2, Printer, Copy, Check, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export function GenerateForm({ 
  routers, 
  servers, 
  profiles, 
  selectedRouterId,
  onVouchersGenerated 
}: { 
  routers: any[], 
  servers: any[], 
  profiles: any[], 
  selectedRouterId: string,
  onVouchersGenerated?: (vouchers: string) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [isPending, startTransition] = useTransition()
  const [generatedVouchers, setGeneratedVouchers] = useState<{vouchers: string[], batchId: string} | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleRouterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`${pathname}?routerId=${e.target.value}`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    formData.append("routerId", selectedRouterId)
    const formElement = e.currentTarget

    startTransition(async () => {
      try {
        const result = mode === "auto" 
          ? await processGenerateVoucher(formData)
          : await processManualVoucher(formData)

        if (result.error) {
          toast.error(result.error)
        } else if (result.success) {
          if (mode === "auto") {
            toast.success("Berhasil mengenerate voucher massal!")
            setGeneratedVouchers({ vouchers: result.vouchers || [], batchId: result.batchId || '' })
            formElement.reset()
          } else {
            toast.success("Berhasil menambah voucher manual!")
            
            // Cek apakah ada nomor WA
            const waNumber = formData.get("waNumber") as string;
            const name = formData.get("name") as string;
            const password = formData.get("password") as string || name;
            const profile = formData.get("profile") as string;
            const customerName = formData.get("customerName") as string;
            const displayName = customerName && customerName.trim() !== "" ? customerName : name;
            
            if (waNumber && waNumber.trim() !== "") {
              const hour = new Date().getHours();
              const greeting = hour < 4 ? "Selamat Malam" : hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
              
              const message = `${greeting} kak *${displayName}*! 👋\n\nIni pesan otomatis dari Admin WiFi STARBUCK. Pendaftaran langganan internet kakak sudah berhasil kami proses ya.\n\nBerikut adalah detail akses WiFi kakak:\n🎟️ Kode Voucher: *${name}*\n📦 Paket: *${profile}*\n\nSelamat menikmati koneksi internet kami! Jika ada kendala, jangan sungkan untuk menghubungi kami. Terima kasih! 🙏`;
              
              try {
                const waResult = await sendManualWAAction(waNumber, message);
                if (waResult.error) {
                  toast.warning("Voucher berhasil dibuat, tapi gagal mengirim WA: " + waResult.error);
                } else {
                  toast.success("Notifikasi WA terkirim ke pelanggan!");
                }
              } catch (e) {
                toast.warning("Voucher berhasil dibuat, tapi gagal mengirim notifikasi WA.");
              }
            }

            // Tampilkan layar sukses
            setGeneratedVouchers({ vouchers: [name], batchId: '' })
            formElement.reset() // Kosongkan form untuk generate berikutnya
          }
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat memproses data.")
      }
    })
  }

  if (generatedVouchers) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Sukses Generate Voucher!</h3>
          <p className="text-slate-400 mb-6">Total {generatedVouchers.vouchers.length} voucher telah berhasil ditambahkan ke MikroTik.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2">
            {generatedVouchers.vouchers.map((v, i) => (
              <div key={i} className="bg-[#0f172a] border border-slate-700 rounded-lg p-3 flex justify-between items-center gap-2">
                <span className="font-mono font-bold text-slate-200">{v}</span>
                <button 
                  onClick={() => handleCopy(v)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {copiedCode === v ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button 
            onClick={() => setGeneratedVouchers(null)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-slate-700"
          >
            Generate Lagi
          </button>
          
          <a 
            href={`/dashboard/voucher/print?routerId=${selectedRouterId}&batchId=${generatedVouchers.batchId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" /> Cetak Voucher
          </a>
        </div>
        
        {onVouchersGenerated && (
          <button 
            onClick={() => onVouchersGenerated(generatedVouchers.vouchers.join('\n'))}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg mt-4"
          >
            <ClipboardList className="w-5 h-5" /> Gunakan untuk Orderan Saat Ini
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Pilih Router</label>
          <select 
            value={selectedRouterId}
            onChange={handleRouterChange}
            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
          >
            {routers.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.host})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-orange-500" /> Mode Pembuatan
          </label>
          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value as "auto" | "manual")}
            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
          >
            <option value="auto">Acak Otomatis (Generate Massal)</option>
            <option value="manual">Input Manual (Spesifik)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Server Hotspot</label>
          <select 
            name="server"
            required
            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
          >
            {servers.length === 0 && <option value="">Tidak ada server</option>}
            {servers.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Profil (Harga/Batas)</label>
          <select 
            name="profile"
            required
            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
          >
            {profiles.length === 0 && <option value="">Tidak ada profil</option>}
            {profiles.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {mode === "auto" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Jumlah Voucher</label>
              <input 
                type="number" 
                name="amount"
                min="1"
                max="100"
                defaultValue="10"
                required={mode === "auto"}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Contoh: 10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Panjang Karakter</label>
              <select 
                name="length"
                required={mode === "auto"}
                defaultValue="5"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
              >
                <option value="4">4 Karakter</option>
                <option value="5">5 Karakter</option>
                <option value="6">6 Karakter</option>
                <option value="7">7 Karakter</option>
                <option value="8">8 Karakter</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nama Pelanggan Asli (Opsional)</label>
              <input 
                type="text" 
                name="customerName"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Contoh: Victor (Untuk sapaan di WhatsApp)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Kode Voucher / Username MikroTik</label>
              <input 
                type="text" 
                name="name"
                required={mode === "manual"}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Contoh: cantik221"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password (Opsional)</label>
              <input 
                type="text" 
                name="password"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Kosongkan jika sama dengan username"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300">Nomor WhatsApp Pelanggan (Untuk Pengingat Bulanan)</label>
              <input 
                type="text" 
                name="waNumber"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Contoh: 6281234567890 (Gunakan kode negara tanpa +)"
              />
              <p className="text-xs text-slate-500">Isi nomor ini khusus untuk pelanggan langganan (Misal: Bulanan). Sistem akan menyiapkan template WA otomatis 2 hari sebelum masa aktif berakhir (30 Hari).</p>
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isPending || servers.length === 0 || profiles.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <PlusCircle className="w-5 h-5" />
          )}
          {isPending 
            ? "Memproses..." 
            : mode === "auto" ? "Buat Voucher Massal" : "Buat Voucher Manual"
          }
        </button>
      </div>
    </form>
  )
}
