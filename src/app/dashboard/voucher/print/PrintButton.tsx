"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
    >
      <Printer className="w-4 h-4" /> Cetak Sekarang (Ctrl+P)
    </button>
  )
}
