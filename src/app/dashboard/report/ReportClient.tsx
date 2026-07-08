'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, Wallet, Calendar, Ticket, Search, ChevronDown, Download, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { getSettings } from "@/app/dashboard/settings/actions"

// Custom Transparent Select Component
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  className = "" 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: {value: string, label: string}[],
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-700 text-base font-semibold text-white px-4 py-2.5 rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-400'}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-slate-700/50">
            {options.map(opt => (
              <li 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`px-4 py-3 text-base cursor-pointer transition-all ${
                  value === opt.value 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:pl-5'
                }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface TransactionType {
  id: string
  amount: number
  type: string
  username?: string | null
  voucherType?: string | null
  activeAt?: Date | null
  expiresAt?: Date | null
  createdAt: Date
  comment?: string | null
}

interface ReportClientProps {
  summary: {
    todayIncome: number
    monthIncome: number
    vouchersCreatedThisMonth: number
  }
  chartData: { date: string, amount: number }[]
  transactions: TransactionType[]
  registeredProfiles: string[]
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function ReportClient({ summary, chartData, transactions, registeredProfiles }: ReportClientProps) {
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })
  const currentYearStr = new Date().getFullYear().toString()
  const currentDayStr = String(new Date().getDate()).padStart(2, '0')

  const router = useRouter()
  const [settings, setSettings] = useState({ appName: "BuckNet" })

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  // Date Range Filters State
  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const firstDayStr = getLocalYYYYMMDD(firstDay);
  const lastDayStr = getLocalYYYYMMDD(lastDay);
  
  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(lastDayStr)
  
  // Cari profil bulanan sebagai default
  const defaultProfile = registeredProfiles.find(p => p.toLowerCase().includes("bulan")) || 'All'
  const [filterProfile, setFilterProfile] = useState(defaultProfile)
  const [searchMonth, setSearchMonth] = useState('')

  // Auto-update date range when searching for a month
  useEffect(() => {
    if (!searchMonth || searchMonth.length < 3) return;
    
    const monthNames = [
      ["jan", "januari"],
      ["feb", "februari"],
      ["mar", "maret"],
      ["apr", "april"],
      ["mei", "mei"],
      ["jun", "juni"],
      ["jul", "juli"],
      ["agu", "agustus"],
      ["sep", "september"],
      ["okt", "oktober"],
      ["nov", "november"],
      ["des", "desember"]
    ];
    
    const term = searchMonth.toLowerCase();
    const matchedMonthIndex = monthNames.findIndex(names => 
      names.some(n => n === term || n.startsWith(term))
    );
    
    if (matchedMonthIndex !== -1) {
      const year = new Date().getFullYear();
      const first = new Date(year, matchedMonthIndex, 1);
      const last = new Date(year, matchedMonthIndex + 1, 0);
      setStartDate(getLocalYYYYMMDD(first));
      setEndDate(getLocalYYYYMMDD(last));
    }
  }, [searchMonth]);

  // Export State
  const [mounted, setMounted] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentMonthStr = `${currentYearStr}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [exportStartMonth, setExportStartMonth] = useState(currentMonthStr)
  const [exportEndMonth, setExportEndMonth] = useState(currentMonthStr)

  // Generate month options for the dropdown (Jan-Dec of current year)
  const monthOptions = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ].map((m, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0')
    return {
      value: `${currentYearStr}-${monthNum}`,
      label: `${m} ${currentYearStr}`
    }
  })

  const handleExportExcel = () => {
    if (!exportStartMonth || !exportEndMonth) return;

    // Convert YYYY-MM to Date objects for filtering
    const [startYear, startMonth] = exportStartMonth.split('-');
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    
    const [endYear, endMonth] = exportEndMonth.split('-');
    const end = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59, 999); // last day of month

    const filteredForExport = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt).getTime();
      return txDate >= start.getTime() && txDate <= end.getTime();
    });

    if (filteredForExport.length === 0) {
      alert("Tidak ada data pada rentang bulan tersebut.");
      return;
    }

    const exportData = filteredForExport.map((tx, idx) => {
      const activeDate = tx.activeAt ? new Date(tx.activeAt) : new Date(tx.createdAt);
      const expiresDate = tx.expiresAt ? new Date(tx.expiresAt) : null;
      
      const formatDateTime = (d: Date | null) => {
        if (!d) return '-';
        return d.toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      };

      return {
        "No": idx + 1,
        "Username": tx.username || '-',
        "Tanggal Aktif": formatDateTime(activeDate),
        "Tanggal Kedaluwarsa": formatDateTime(expiresDate),
        "Profil": tx.voucherType || '-',
        "Pendapatan Kotor (Rp)": tx.amount,
        "Komisi Reseller (15%)": tx.amount * 0.15,
        "Bersih Admin (85%)": tx.amount * 0.85
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    
    // Calculate totals
    const totalGross = filteredForExport.reduce((sum, tx) => sum + tx.amount, 0);
    const totalRow = {
      "No": "",
      "Username": "",
      "Tanggal Aktif": "",
      "Tanggal Kedaluwarsa": "",
      "Profil": "TOTAL",
      "Pendapatan Kotor (Rp)": totalGross,
      "Komisi Reseller (15%)": totalGross * 0.15,
      "Bersih Admin (85%)": totalGross * 0.85
    };
    XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

    XLSX.writeFile(workbook, `Laporan_Keuangan_${settings.appName.replace(/\s+/g, '_')}_${exportStartMonth}_sampai_${exportEndMonth}.xlsx`);
    setIsExportModalOpen(false);
  }

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: firstDayStr,
    endDate: lastDayStr,
    profile: defaultProfile,
    searchMonth: ''
  })

  // Get unique profiles for the dropdown
  const activeProfiles = new Set(transactions.map(t => t.voucherType).filter(Boolean) as string[])
  registeredProfiles.forEach(p => activeProfiles.add(p))
  const availableProfiles = Array.from(activeProfiles)
  
  const profileOptions = [
    { value: 'All', label: 'Semua Profil' },
    ...availableProfiles.map(p => ({ value: p, label: p }))
  ]

  const handleFilter = () => {
    setAppliedFilters({
      startDate,
      endDate,
      profile: filterProfile,
      searchMonth
    })
  }

  // Apply filters
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt)
    const txDateStr = txDate.toISOString().split('T')[0]

    // Filter Month (jika ada text search)
    if (appliedFilters.searchMonth) {
      const txMonthName = txDate.toLocaleDateString('id-ID', { month: 'long' }).toLowerCase()
      if (!txMonthName.includes(appliedFilters.searchMonth.toLowerCase())) return false
    }

    // Filter Range
    // Hanya apply filter range jika tidak mencari nama bulan secara spesifik, 
    // agar pencarian bulan tidak terblokir oleh range tanggal saat ini
    if (!appliedFilters.searchMonth) {
      if (txDateStr < appliedFilters.startDate || txDateStr > appliedFilters.endDate) return false
    }

    // Filter Profile
    if (appliedFilters.profile !== 'All') {
      if (tx.voucherType !== appliedFilters.profile) return false
    }

    return true
  })
  
  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalVouchers = filteredTransactions.length

  const profileCounts = filteredTransactions.reduce((acc, t) => {
    acc[t.voucherType] = (acc[t.voucherType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  let topProfile = "-"
  let topCount = 0
  for (const [prof, count] of Object.entries(profileCounts)) {
    if (count > topCount) {
      topProfile = prof
      topCount = count
    }
  }

  // Buat label judul laporan
  const formatIndoDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  let reportTitle = `Periode: ${formatIndoDate(appliedFilters.startDate)} - ${formatIndoDate(appliedFilters.endDate)}`
  if (appliedFilters.profile !== 'All') reportTitle += ` (${appliedFilters.profile})`

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#1E293B] border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Pendapatan</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatIDR(totalIncome)}</div>
            
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Komisi Reseller (15%)</span>
                <span className="text-amber-400 font-medium">{formatIDR(totalIncome * 0.15)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Bersih Admin (85%)</span>
                <span className="text-emerald-500 font-bold">{formatIDR(totalIncome * 0.85)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Voucher</CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{totalVouchers}</div>
            <p className="text-xs text-slate-500 mt-1">
              Voucher terjual pada periode ini
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Profil Terlaris</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{topProfile}</div>
            <p className="text-xs text-slate-500 mt-1">
              {topCount > 0 ? `Terjual ${topCount} kali` : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Chart */}
      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Grafik Perbandingan Pendapatan Bulanan</CardTitle>
          <CardDescription className="text-slate-400">Total pendapatan pada setiap bulan di tahun {currentYearStr}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelFormatter={(label) => label as string}
                    formatter={(value: number) => [formatIDR(value), 'Pendapatan']}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                Belum ada data pendapatan tahun ini.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table (Mikhmon Style) */}
      <div className="bg-[#343A40] rounded-xl border border-[#454D55] overflow-hidden mt-8 shadow-xl">
        {/* Top Filter Bar */}
        <div className="flex flex-col xl:flex-row flex-wrap items-stretch xl:items-center gap-4 bg-[#343A40] p-4 border-b border-[#454D55]">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="text-slate-300 text-sm font-medium w-16 sm:w-auto">Dari:</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto bg-slate-900/60 border border-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>
  
            <div className="flex items-center gap-2">
              <label className="text-slate-300 text-sm font-medium w-16 sm:w-auto">Sampai:</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto bg-slate-900/60 border border-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <CustomSelect 
            className="w-full sm:w-48"
            value={filterProfile}
            onChange={setFilterProfile}
            options={profileOptions}
          />
          
          <div className="flex-1 w-full lg:w-auto flex justify-end">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari bulan (Cth: Juni)..."
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                className="bg-slate-900/60 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <button onClick={handleFilter} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#343A40] hover:bg-[#454D55] border border-[#454D55] text-base px-6 py-2.5 rounded-lg transition-colors text-white shadow">
              Terapkan
            </button>
            
            <button onClick={() => setIsExportModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-base px-5 py-2.5 rounded-lg transition-colors text-white shadow font-semibold">
              <Download className="w-4 h-4" /> Unduh Excel
            </button>
          </div>
        </div>

        {/* Table Header / Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-5 py-4 border-b border-[#454D55] bg-[#3A4047]">
          <h2 className="font-bold text-base text-white">{reportTitle}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 font-bold text-base text-white">
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-xs font-medium">Pendapatan Kotor</span>
              <span className="text-lg text-white">Rp {totalIncome.toLocaleString('id-ID')}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-600"></div>
            <div className="flex flex-col items-end">
              <span className="text-orange-400 text-xs font-medium">Potongan Reseller (15%)</span>
              <span className="text-lg text-orange-400">Rp {(totalIncome * 0.15).toLocaleString('id-ID')}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-600"></div>
            <div className="flex flex-col items-end">
              <span className="text-emerald-400 text-xs font-medium">Bersih Admin (85%)</span>
              <span className="text-xl text-emerald-400">Rp {(totalIncome * 0.85).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-base text-left whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <thead className="text-[#E9ECEF] font-semibold border-b border-[#454D55]">
              <tr>
                <th className="px-5 py-3 w-12">№</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Tanggal Active</th>
                <th className="px-5 py-3">Tanggal Selesai</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => {
                  const activeDate = tx.activeAt ? new Date(tx.activeAt) : new Date(tx.createdAt)
                  const expiresDate = tx.expiresAt ? new Date(tx.expiresAt) : null

                  const formatDateTime = (d: Date | null) => {
                    if (!d) return '-'
                    const monthStr = d.toLocaleString('en-US', { month: 'short' }).toLowerCase()
                    const dayStr = String(d.getDate()).padStart(2, '0')
                    const yearStr = d.getFullYear()
                    const timeStr = d.toLocaleTimeString('id-ID', { hour12: false })
                    return `${monthStr}/${dayStr}/${yearStr} ${timeStr}`
                  }
                  
                  const getRemainingTime = (expires: Date | null) => {
                    if (!expires) return null
                    const diffMs = expires.getTime() - new Date().getTime()
                    if (diffMs <= 0) return <span className="text-red-500 text-xs mt-1 block">Kadaluarsa</span>
                    
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                    
                    let str = ""
                    if (days > 0) str += `${days}h `
                    if (hours > 0) str += `${hours}j `
                    str += `${mins}m`
                    
                    return <span className="text-emerald-500 text-xs mt-1 block font-semibold">Sisa: {str}</span>
                  }
                  
                  return (
                    <tr key={tx.id} className="border-b border-[#454D55]/50 hover:bg-[#3A4047] transition-colors text-[#CED4DA]">
                      <td className="px-5 py-3 font-mono text-sm align-top">{index + 1}</td>
                      <td className="px-5 py-3 text-white font-medium text-base align-top">{tx.username || '-'}</td>
                      <td className="px-5 py-3 font-mono text-sm text-white align-top">{formatDateTime(activeDate)}</td>
                      <td className="px-5 py-3 font-mono text-sm text-white align-top">
                        {formatDateTime(expiresDate)}
                        {getRemainingTime(expiresDate)}
                      </td>
                      <td className="px-5 py-3 text-white text-base align-top">{tx.voucherType || '-'}</td>
                      <td className="px-5 py-3 text-right text-white font-medium text-base align-top">{tx.amount}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-base">
                    Tidak ada data transaksi yang cocok dengan filter tersebut.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Export Laporan ke Excel
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mulai Bulan</label>
                <CustomSelect 
                  value={exportStartMonth}
                  onChange={setExportStartMonth}
                  options={monthOptions}
                />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Sampai Bulan</label>
                <CustomSelect 
                  value={exportEndMonth}
                  onChange={setExportEndMonth}
                  options={monthOptions}
                />
              </div>
              <p className="text-xs text-slate-400 mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                Laporan akan merangkum seluruh transaksi (pendapatan voucher) dalam rentang bulan yang Anda pilih di atas.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700/50 bg-slate-800/30">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow"
              >
                <Download className="w-4 h-4" /> Download .xlsx
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
