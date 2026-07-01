"use client"

import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function UserSearchInput() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set('q', searchTerm)
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative w-full max-w-md flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari nama, username atau email..." 
          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl h-11 pl-11 pr-4 text-[13px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500 transition-shadow"
        />
      </div>
      <button 
        onClick={handleSearch}
        className="h-11 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[13px] text-white font-medium transition-colors"
      >
        Cari
      </button>
    </div>
  )
}
