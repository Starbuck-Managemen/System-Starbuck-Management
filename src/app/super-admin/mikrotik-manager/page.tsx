"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Router, Plus, Trash2, Copy, Check, RefreshCw, Wifi, WifiOff,
  ChevronDown, ChevronUp, Eye, EyeOff, Shuffle, AlertCircle,
  Info, Network, X, Loader2
} from "lucide-react"
import { toast } from "sonner"
interface ExtraPort {
  public: number
  internal: number
  label: string
  isOnline?: boolean
}
interface MikrotikVPNRecord {
  id: string
  name: string
  vpnUser: string
  vpnPassword: string
  vpnIp: string
  winboxPort: number
  extraPorts: string | null
  ipsecPsk: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

function generatePassword(length = 14) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label ?? (copied ? "Tersalin!" : "Salin")}
    </button>
  )
}
function RouterCard({ router, onDelete }: { router: MikrotikVPNRecord; onDelete: () => void }) {
  const [showPass, setShowPass] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  // State untuk tambah port EAP inline
  const [addingPort, setAddingPort] = useState(false)
  const [newPortLabel, setNewPortLabel] = useState("")
  const [newPortPublic, setNewPortPublic] = useState("")
  const [newPortInternal, setNewPortInternal] = useState("")
  const [updatingPorts, setUpdatingPorts] = useState(false)

  const extraPorts: ExtraPort[] = router.extraPorts ? JSON.parse(router.extraPorts) : []

  const handleDeletePort = async (publicPortToDelete: number) => {
    if (!confirm("Hapus port tambahan ini?")) return
    setUpdatingPorts(true)
    try {
      const updatedExtraPorts = extraPorts.filter((ep) => ep.public !== publicPortToDelete)
      const res = await fetch(`/api/vps/mikrotik-vpn/${router.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraPorts: updatedExtraPorts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus port tambahan")
      toast.success("Port tambahan berhasil dihapus!")
      onDelete() // Refresh list
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdatingPorts(false)
    }
  }

  const handleAddPort = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPortPublic || !newPortInternal) {
      toast.error("Port Publik dan Port Internal wajib diisi")
      return
    }
    setUpdatingPorts(true)
    try {
      const newEp: ExtraPort = {
        public: Number(newPortPublic),
        internal: Number(newPortInternal),
        label: newPortLabel.trim() || `Port ${newPortPublic}`,
      }
      // Validasi port publik duplikat
      if (extraPorts.some((ep) => ep.public === newEp.public)) {
        throw new Error(`Port publik ${newEp.public} sudah digunakan di router ini.`)
      }
      const updatedExtraPorts = [...extraPorts, newEp]
      const res = await fetch(`/api/vps/mikrotik-vpn/${router.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraPorts: updatedExtraPorts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menambah port tambahan")
      toast.success("Port tambahan berhasil ditambahkan!")
      setNewPortLabel("")
      setNewPortPublic("")
      setNewPortInternal("")
      setAddingPort(false)
      onDelete() // Refresh list
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdatingPorts(false)
    }
  }

  const mikrotikScript = `/interface l2tp-client
add connect-to=103.49.238.231 \\
    name=vpn-ke-vps \\
    user=${router.vpnUser} \\
    password=${router.vpnPassword} \\
    use-ipsec=yes \\
    ipsec-secret=${router.ipsecPsk} \\
    disabled=no \\
    comment="${router.name} VPN ke VPS"`

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/vps/mikrotik-vpn/${router.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus")
      if (data.warnings?.length) toast.warning("Dihapus dengan peringatan: " + data.warnings.join(", "))
      else toast.success(`Router "${router.name}" berhasil dihapus!`)
      onDelete()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  return (
    <div className={`rounded-2xl border transition-all ${router.isActive
      ? "border-emerald-500/30 bg-gradient-to-br from-slate-800 to-slate-800/50"
      : "border-slate-700/50 bg-slate-800/50"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${router.isActive ? "bg-emerald-500/20" : "bg-slate-700"}`}>
            <Router className={`w-5 h-5 ${router.isActive ? "text-emerald-400" : "text-slate-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-lg">{router.name}</h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                router.isActive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700 text-slate-500"
              }`}>
                {router.isActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {router.isActive ? "Aktif" : "Offline"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {router.vpnUser} · {router.vpnIp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete Button */}
          {confirmDel ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-400">Yakin?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ya, Hapus"}
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="text-xs px-2 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Hapus Router"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-5 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">Winbox Port</p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-bold text-emerald-400">:{router.winboxPort}</p>
            <CopyButton text={`103.49.238.231:${router.winboxPort}`} />
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">VPN IP</p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-bold text-blue-400">{router.vpnIp}</p>
            <CopyButton text={router.vpnIp} />
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">VPN User</p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-bold text-slate-200">{router.vpnUser}</p>
            <CopyButton text={router.vpnUser} />
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">Password</p>
          <div className="flex items-center gap-2">
            <p className="font-mono font-bold text-slate-200 flex-1 truncate">
              {showPass ? router.vpnPassword : "••••••••"}
            </p>
            <button onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <CopyButton text={router.vpnPassword} />
          </div>
        </div>
      </div>

      {/* Port Tambahan Section */}
      <div className="px-5 pb-3 border-t border-slate-700/20 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Port Tambahan / EAP</p>
          <button
            type="button"
            onClick={() => setAddingPort(!addingPort)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all"
          >
            {addingPort ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {addingPort ? "Batal" : "Tambah Port"}
          </button>
        </div>

        {extraPorts.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {extraPorts.map((ep, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-1.5 border border-slate-800">
                <div 
                  className={`w-1.5 h-1.5 rounded-full ${
                    ep.isOnline 
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" 
                      : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                  }`} 
                  title={ep.isOnline ? "Online" : "Offline"}
                />
                <span className="text-xs text-slate-400">{ep.label || `Port ${ep.public}`}</span>
                <span className="font-mono text-xs text-yellow-400">:{ep.public}</span>
                <CopyButton text={`103.49.238.231:${ep.public}`} />
                <button
                  type="button"
                  onClick={() => handleDeletePort(ep.public)}
                  disabled={updatingPorts}
                  className="ml-1 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Hapus Port"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic mb-2">Tidak ada port tambahan</p>
        )}

        {addingPort && (
          <form onSubmit={handleAddPort} className="mt-3 bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 space-y-2">
            <p className="text-[11px] font-bold text-slate-300">Tambah Port/EAP Baru</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nama (e.g. EAP 1)"
                value={newPortLabel}
                onChange={(e) => setNewPortLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Port Publik"
                value={newPortPublic}
                onChange={(e) => setNewPortPublic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <input
                type="number"
                placeholder="Port Internal"
                value={newPortInternal}
                onChange={(e) => setNewPortInternal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddingPort(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[11px] font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updatingPorts}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold disabled:opacity-50"
              >
                {updatingPorts ? "Menyimpan..." : "Simpan Port"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Instruksi MikroTik */}
      <div className="px-5 pb-5">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-all font-medium"
        >
          {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showConfig ? "Sembunyikan" : "Lihat"} Konfigurasi MikroTik L2TP Client
        </button>
        {showConfig && (
          <div className="mt-3 bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/50">
              <span className="text-xs text-slate-400 font-medium">Terminal MikroTik — Copy & Paste</span>
              <CopyButton text={mikrotikScript} label="Salin Script" />
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
              {mikrotikScript}
            </pre>
          </div>
        )}
      </div>

      {router.notes && (
        <div className="mx-5 mb-5 flex items-start gap-2 text-xs text-slate-400 bg-slate-900/40 rounded-xl p-3">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          {router.notes}
        </div>
      )}
    </div>
  )
}

export default function MikrotikManagerPage() {
  const [routers, setRouters] = useState<MikrotikVPNRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)

  const handleSeedDefaultRouters = async () => {
    setSeeding(true)
    try {
      const res = await fetch("/api/vps/mikrotik-vpn/seed", {
        method: "POST"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal melakukan seeding")
      toast.success("Router bawaan berhasil didaftarkan!")
      fetchRouters()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSeeding(false)
    }
  }
  // Form state
  const [form, setForm] = useState({
    name: "",
    vpnUser: "",
    vpnPassword: generatePassword(),
    vpnIp: "",
    winboxPort: "",
    ipsecPsk: "MelvianoPSK2026",
    notes: "",
  })
  const [extraPorts, setExtraPorts] = useState<ExtraPort[]>([])

  const fetchRouters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vps/mikrotik-vpn")
      const data = await res.json()
      setRouters(data.routers || [])

      // Auto-suggest IP dan Port berikutnya
      if (data.routers?.length > 0) {
        const usedIps = data.routers.map((r: MikrotikVPNRecord) => r.vpnIp)
        const usedPorts = data.routers.map((r: MikrotikVPNRecord) => r.winboxPort)

        // Suggest next IP in 192.168.42.x range
        let nextIpNum = 11
        while (usedIps.includes(`192.168.42.${nextIpNum}`)) nextIpNum++
        
        // Suggest next port from 8292
        let nextPort = 8292
        while (usedPorts.includes(nextPort)) nextPort++

        setForm(f => ({
          ...f,
          vpnIp: f.vpnIp || `192.168.42.${nextIpNum}`,
          winboxPort: f.winboxPort || String(nextPort),
        }))
      } else {
        setForm(f => ({
          ...f,
          vpnIp: f.vpnIp || "192.168.42.11",
          winboxPort: f.winboxPort || "8292",
        }))
      }
    } catch (e) {
      toast.error("Gagal memuat data router")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRouters() }, [fetchRouters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/vps/mikrotik-vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, winboxPort: Number(form.winboxPort), extraPorts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan router")
      if (data.warnings?.length) {
        toast.warning("Ditambahkan dengan peringatan: " + data.warnings.join(", "))
      } else {
        toast.success(data.message)
      }
      // Reset form
      setForm({
        name: "", vpnUser: "", vpnPassword: generatePassword(),
        vpnIp: "", winboxPort: "", ipsecPsk: "MelvianoPSK2026", notes: "",
      })
      setExtraPorts([])
      setShowForm(false)
      fetchRouters()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const activeCount = routers.filter(r => r.isActive).length

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">MikroTik VPN Manager</h1>
            <p className="text-slate-400 text-sm">Kelola koneksi VPN L2TP untuk remote MikroTik dari mana saja</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Router", value: routers.length, color: "text-slate-100" },
          { label: "VPN Aktif", value: activeCount, color: "text-emerald-400" },
          { label: "VPN Offline", value: routers.length - activeCount, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-200">Router Terdaftar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRouters}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Tutup Form" : "Tambah Router Baru"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-6 bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-emerald-400 mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah MikroTik VPN Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Router */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Nama Router *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Starbuck, Rumah, Kantor"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* VPN Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  VPN Username *
                </label>
                <input
                  required
                  value={form.vpnUser}
                  onChange={e => setForm(f => ({ ...f, vpnUser: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                  placeholder="e.g. starbuck (huruf kecil, tanpa spasi)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              {/* VPN Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  VPN Password *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      required
                      type={showPassForm ? "text" : "password"}
                      value={form.vpnPassword}
                      onChange={e => setForm(f => ({ ...f, vpnPassword: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono pr-10"
                    />
                    <button type="button" onClick={() => setShowPassForm(!showPassForm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, vpnPassword: generatePassword() }))}
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
                    title="Generate Password"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VPN IP */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  IP VPN Statis *
                </label>
                <input
                  required
                  value={form.vpnIp}
                  onChange={e => setForm(f => ({ ...f, vpnIp: e.target.value }))}
                  placeholder="192.168.42.11"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
                <p className="text-[11px] text-slate-600 mt-1">Gunakan range 192.168.42.x (auto-suggest)</p>
              </div>

              {/* Winbox Port */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Port Winbox Publik *
                </label>
                <input
                  required
                  type="number"
                  value={form.winboxPort}
                  onChange={e => setForm(f => ({ ...f, winboxPort: e.target.value }))}
                  placeholder="8292"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
                <p className="text-[11px] text-slate-600 mt-1">Port publik VPS → Winbox :8291 MikroTik</p>
              </div>

              {/* IPSec PSK */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  IPSec PSK
                </label>
                <input
                  value={form.ipsecPsk}
                  onChange={e => setForm(f => ({ ...f, ipsecPsk: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Extra Ports */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Port Tambahan (Opsional)
                </label>
                <button
                  type="button"
                  onClick={() => setExtraPorts(p => [...p, { public: 8300 + p.length, internal: 8300 + p.length, label: "" }])}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Port
                </button>
              </div>
              {extraPorts.length > 0 && (
                <div className="space-y-2">
                  {extraPorts.map((ep, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        placeholder="Label (e.g. EAP 220)"
                        value={ep.label}
                        onChange={e => setExtraPorts(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number" placeholder="Port Publik"
                        value={ep.public}
                        onChange={e => setExtraPorts(p => p.map((x, j) => j === i ? { ...x, public: Number(e.target.value) } : x))}
                        className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-slate-600">→</span>
                      <input
                        type="number" placeholder="Port Internal"
                        value={ep.internal}
                        onChange={e => setExtraPorts(p => p.map((x, j) => j === i ? { ...x, internal: Number(e.target.value) } : x))}
                        className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraPorts(p => p.filter((_, j) => j !== i))}
                        className="text-slate-600 hover:text-red-400 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Catatan (Opsional)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Lokasi router, catatan penting, dll..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                Setelah router ditambahkan, Bapak perlu mengkonfigurasikan <strong>L2TP Client</strong> di
                MikroTik target menggunakan script yang akan ditampilkan. VPN harus terhubung sebelum bisa
                remote Winbox dari luar jaringan.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Tambah & Konfig VPS</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Router List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Memuat data router...</p>
          </div>
        </div>
      ) : routers.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl">
          <Router className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 font-semibold mb-2">Belum ada router terdaftar</h3>
          <p className="text-slate-600 text-sm mb-4">Klik "Tambah Router Baru" untuk mendaftarkan MikroTik pertama, atau gunakan router bawaan</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Sekarang
            </button>
            <button
              onClick={handleSeedDefaultRouters}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} /> Seeding Router Bawaan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {routers.map(router => (
            <RouterCard
              key={router.id}
              router={router}
              onDelete={fetchRouters}
            />
          ))}
        </div>
      )}
    </div>
  )
}
