"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Terminal, Server, CheckCircle2, Router, Network, Shield, RefreshCw, Wifi, WifiOff, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Tunnel {
  publicPort: string
  vpnIp: string
  internalPort: string
  raw: string
}

function TunnelListSection() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([])
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [editingPort, setEditingPort] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingLabel, setSavingLabel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchTunnels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, labelsRes] = await Promise.all([
        fetch("/api/vps/tunnels"),
        fetch("/api/vps/tunnel-labels")
      ])
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil data dari VPS.")
      }

      let labelsMap: Record<string, string> = {}
      if (labelsRes.ok) {
        const labelsData = await labelsRes.json()
        labelsData.forEach((item: any) => {
          labelsMap[item.port] = item.label
        })
      }

      setTunnels(data.tunnels || [])
      setLabels(labelsMap)
      setLastFetched(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTunnels()
  }, [fetchTunnels])

  const saveLabel = async (port: string) => {
    if (!editValue.trim()) {
      setEditingPort(null)
      return
    }
    setSavingLabel(true)
    try {
      const res = await fetch("/api/vps/tunnel-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port, label: editValue.trim() })
      })
      if (!res.ok) throw new Error("Gagal menyimpan label")
      
      setLabels(prev => ({ ...prev, [port]: editValue.trim() }))
      setEditingPort(null)
      toast.success("Nama perangkat berhasil disimpan")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingLabel(false)
    }
  }

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-800/40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-sky-500/10 p-1.5 rounded-lg border border-sky-500/20">
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">Daftar Tunnel Aktif (Live VPS)</span>
            {lastFetched && !loading && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Diperbarui: {lastFetched.toLocaleTimeString("id-ID")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={fetchTunnels}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-sky-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-400">Menghubungkan ke VPS dan membaca data firewall...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="bg-red-500/10 p-3 rounded-full border border-red-500/20">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-red-400">Gagal Terhubung ke VPS</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">{error}</p>
            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 leading-relaxed max-w-sm text-center">
              <strong className="text-amber-400">Tips:</strong> Jalankan <code className="font-mono bg-black/30 px-1 py-0.5 rounded">setup-sudoers.ps1</code> terlebih dahulu untuk memberikan izin akses ke VPS.
            </div>
          </div>
        )}

        {!loading && !error && tunnels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="bg-slate-700/50 p-3 rounded-full border border-slate-700">
              <WifiOff className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">Tidak ada tunnel/port forwarding yang aktif di VPS.</p>
          </div>
        )}

        {!loading && !error && tunnels.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-4">
              Ditemukan <span className="text-emerald-400 font-bold">{tunnels.length} tunnel</span> yang sedang aktif di VPS <span className="font-mono text-sky-400">103.49.238.231</span>
            </p>
            {tunnels.map((tunnel, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 bg-slate-900/60 border border-slate-700/50 hover:border-sky-500/40 rounded-xl p-4 transition-all"
              >
                {/* Status Dot */}
                <div className="flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                </div>

                {/* Port Flow */}
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  {/* Label (Editable) */}
                  <div className="min-w-[140px]">
                    {editingPort === tunnel.publicPort ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveLabel(tunnel.publicPort)
                            if (e.key === 'Escape') setEditingPort(null)
                          }}
                          className="bg-[#1E293B] border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:border-sky-500 transition-colors"
                          placeholder="Nama perangkat..."
                          disabled={savingLabel}
                        />
                        <button
                          onClick={() => saveLabel(tunnel.publicPort)}
                          disabled={savingLabel}
                          className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20"
                        >
                          {savingLabel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="group/label flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setEditingPort(tunnel.publicPort)
                          setEditValue(labels[tunnel.publicPort] || "")
                        }}
                      >
                        <span className={`text-sm font-bold ${labels[tunnel.publicPort] ? 'text-slate-100' : 'text-slate-500'}`}>
                          {labels[tunnel.publicPort] || "Tanpa Nama"}
                        </span>
                        <div className="bg-slate-700/50 px-2 py-0.5 rounded-md opacity-0 group-hover/label:opacity-100 transition-opacity">
                          <span className="text-[10px] text-slate-300 font-medium">Edit</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block h-5 w-px bg-slate-700/50 mx-1" />

                  {/* Public Access */}
                  <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-sky-300 font-bold">
                      :&thinsp;{tunnel.publicPort}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />

                  {/* VPS Internal */}
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-emerald-300">
                      {tunnel.vpnIp}:{tunnel.internalPort}
                    </span>
                  </div>
                </div>

                {/* URL Copy Button */}
                <button
                  onClick={() => {
                    const url = `http://103.49.238.231:${tunnel.publicPort}`
                    navigator.clipboard.writeText(url)
                    toast.success(`URL disalin: ${url}`)
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 text-slate-400 group-hover:text-slate-200 text-xs rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-3 h-3" />
                  Copy URL
                </button>
              </div>
            ))}

            {/* VPS IP Info */}
            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
              <Server className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Semua tunnel diarahkan dari IP Publik VPS: <span className="font-mono text-white font-bold">103.49.238.231</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TunnelGeneratorPage() {
  const [formData, setFormData] = useState({
    deviceName: "EAP Baru",
    localIp: "11.11.11.5",
    publicPort: "8115",
    internalPort: "80",
    vpnIp: "192.168.42.10",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${title} disalin ke clipboard!`)
  }

  const vpsScript = `sudo iptables -t nat -A PREROUTING -p tcp --dport ${formData.publicPort} -j DNAT --to-destination ${formData.vpnIp}:${formData.publicPort}`

  const mikrotikScript = `/ip firewall nat
add chain=dstnat action=dst-nat to-addresses=${formData.localIp} to-ports=${formData.internalPort} protocol=tcp dst-port=${formData.publicPort} comment="Akses ${formData.deviceName} (VPS)"
add chain=srcnat action=masquerade dst-address=${formData.localIp} protocol=tcp dst-port=${formData.internalPort} comment="Topeng ${formData.deviceName}"

/ip hotspot ip-binding
add address=${formData.localIp} type=bypassed comment="Bypass ${formData.deviceName}"`

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <Network className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tunnel Generator</h1>
          <p className="text-slate-400 text-sm">Buat script otomatis untuk VPN Port Forwarding (Remote Perangkat)</p>
        </div>
      </div>

      {/* === Generator Section === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <Server className="w-5 h-5 text-emerald-400" />
              Parameter Perangkat
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">Nama Perangkat</label>
                <input 
                  type="text"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleInputChange}
                  className="w-full bg-[#1E293B] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="Misal: CCTV Gudang"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">IP Lokal Perangkat</label>
                  <input 
                    type="text"
                    name="localIp"
                    value={formData.localIp}
                    onChange={handleInputChange}
                    className="w-full bg-[#1E293B] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="11.11.11.x"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Port Publik (VPS)</label>
                  <input 
                    type="text"
                    name="publicPort"
                    value={formData.publicPort}
                    onChange={handleInputChange}
                    className="w-full bg-[#1E293B] border border-slate-700 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="8xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Port Internal (Asli)</label>
                  <input 
                    type="text"
                    name="internalPort"
                    value={formData.internalPort}
                    onChange={handleInputChange}
                    className="w-full bg-[#1E293B] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="80"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">IP VPN MikroTik</label>
                  <input 
                    type="text"
                    name="vpnIp"
                    value={formData.vpnIp}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                    placeholder="192.168.42.10"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Nantinya perangkat ini bisa diakses secara online dari manapun melalui URL: 
                <br/>
                <span className="font-mono text-emerald-400 font-bold mt-1 inline-block">
                  http://103.49.238.231:{formData.publicPort}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Output Scripts */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* VPS Script */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">1. Script VPS (Jalankan via SSH/PowerShell)</span>
              </div>
              <button 
                onClick={() => copyToClipboard(vpsScript, 'Script VPS')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="p-4 bg-black/40 overflow-x-auto">
              <pre className="text-emerald-400 font-mono text-[13px] whitespace-pre-wrap break-all">
                {vpsScript}
              </pre>
            </div>
          </div>

          {/* MikroTik Script */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">2. Script MikroTik (Paste di New Terminal Winbox)</span>
              </div>
              <button 
                onClick={() => copyToClipboard(mikrotikScript, 'Script MikroTik')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="p-4 bg-black/40 overflow-x-auto">
              <pre className="text-sky-400 font-mono text-[13px] whitespace-pre-wrap break-all leading-relaxed">
                {mikrotikScript}
              </pre>
            </div>
          </div>

        </div>
      </div>

      {/* === Live Tunnel List Section === */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs font-medium text-slate-500 px-3">MONITORING LIVE VPS</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <TunnelListSection />
      </div>
    </div>
  )
}
