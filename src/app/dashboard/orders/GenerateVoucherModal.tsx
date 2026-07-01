'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { GenerateForm } from "../voucher/generate/GenerateForm"
import { fetchRouterDetails } from "../voucher/generate/actions"
import { useSearchParams } from "next/navigation"

export function GenerateVoucherModal({ 
  isOpen, 
  onClose,
  routers,
  onVouchersGenerated
}: { 
  isOpen: boolean
  onClose: () => void
  routers: any[]
  onVouchersGenerated?: (vouchers: string) => void
}) {
  const searchParams = useSearchParams()
  const urlRouterId = searchParams.get('routerId')
  const initialRouterId = urlRouterId || (routers[0]?.id || "")
  
  const [selectedRouterId, setSelectedRouterId] = useState<string>(initialRouterId)
  const [servers, setServers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update selectedRouterId if URL changes (because GenerateForm currently pushes to URL)
  useEffect(() => {
    if (urlRouterId && urlRouterId !== selectedRouterId) {
      setSelectedRouterId(urlRouterId)
    }
  }, [urlRouterId])

  useEffect(() => {
    if (!isOpen || !selectedRouterId) return
    let mounted = true
    setLoading(true)
    fetchRouterDetails(selectedRouterId).then((data) => {
      if (mounted) {
        setServers(data.servers)
        setProfiles(data.profiles)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [isOpen, selectedRouterId])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        margin: 0,
        padding: '1rem'
      }}
    >
      <div className="bg-[#1e293b] border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] relative z-[100000]" style={{ margin: "auto" }}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Buat Voucher Cepat</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-slate-400 text-center py-10">Memuat data router...</div>
          ) : (
            <GenerateForm 
              routers={routers}
              servers={servers}
              profiles={profiles}
              selectedRouterId={selectedRouterId}
              onVouchersGenerated={onVouchersGenerated}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
