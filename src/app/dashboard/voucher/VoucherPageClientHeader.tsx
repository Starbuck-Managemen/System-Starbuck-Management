"use client"

import { useState } from "react"
import { RouterSelector } from "./RouterSelector"
import { Router as RouterIcon, Plus } from "lucide-react"
import { GenerateVoucherModal } from "../orders/GenerateVoucherModal"

export function VoucherPageClientHeader({ 
  routers, 
  selectedRouterId 
}: { 
  routers: any[], 
  selectedRouterId: string 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3">
        <RouterIcon className="w-5 h-5 text-slate-400 hidden md:block" />
        <RouterSelector routers={routers} selectedRouterId={selectedRouterId} />
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
        >
          <Plus className="w-4 h-4" />
          Generate Voucher
        </button>
      </div>

      <GenerateVoucherModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        routers={routers}
      />
    </>
  )
}
