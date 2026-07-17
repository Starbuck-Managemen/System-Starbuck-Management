'use client'

import { MessageCircle } from "lucide-react"

export function ContactAdminButton({ phone }: { phone: string | null }) {
  if (!phone) return null;

  const normalizedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
  const cleanPhone = normalizedPhone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanPhone}?text=Halo%20Admin,%20saya%20butuh%20bantuan%20mengenai%20sistem%20STARBUCK%20MANAGER.`;

  return (
    <a 
      href={waLink} 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-1 transition-all duration-300 group print:hidden"
      title="Hubungi Admin"
    >
      <MessageCircle className="w-7 h-7" />
      
      {/* Tooltip on hover */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap shadow-lg border border-slate-700">
        Hubungi Admin
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-t border-slate-700"></div>
      </div>
    </a>
  )
}
