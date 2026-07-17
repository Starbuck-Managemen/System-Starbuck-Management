'use client'

import React from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface InvoiceProps {
  invoiceNumber: string;
  date: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  backUrl: string;
  companyTagline?: string;
}

export default function InvoiceLayout({
  invoiceNumber,
  date,
  status,
  paymentMethod,
  customerName,
  customerPhone,
  items,
  subtotal,
  discount,
  total,
  backUrl,
  companyTagline = "Layanan WiFi & Hotspot Terpercaya"
}: InvoiceProps) {
  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 font-sans text-slate-300 print:bg-white print:p-0">
      
      {/* Container utama (Dark mode di layar, tapi kita styling print juga) */}
      <div className="max-w-3xl mx-auto my-8 bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-800 p-8 print:my-0 print:border-none print:shadow-none print:rounded-none print:bg-white print:text-black">
        
        {/* Header (Logo & Info Perusahaan) */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-700 pb-8 print:border-slate-300">
          <div className="flex flex-col gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-black text-cyan-400 tracking-tighter print:text-cyan-600">
                STARBUCK<span className="text-white print:text-black">.</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 print:text-slate-600 max-w-[250px]">
              {companyTagline}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 text-sm">
            <h2 className="text-xl font-bold text-white print:text-black mb-1">Faktur {invoiceNumber}</h2>
            <p className="text-slate-400 print:text-slate-600">Tanggal Faktur : <span className="text-slate-200 print:text-black font-medium">{date}</span></p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-400 print:text-slate-600">Status :</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${status.toLowerCase() === 'lunas' ? 'bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-700' : 'bg-orange-500/20 text-orange-400 print:bg-orange-100 print:text-orange-700'}`}>
                {status}
              </span>
            </div>
            <p className="text-slate-400 print:text-slate-600 mt-1">Metode Pembayaran : <span className="text-slate-200 print:text-black font-medium">{paymentMethod}</span></p>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="py-8 border-b border-slate-700 print:border-slate-300">
          <h3 className="text-sm font-bold text-slate-100 print:text-black mb-2 uppercase tracking-wider">Untuk :</h3>
          <p className="text-lg font-semibold text-white print:text-black">{customerName || 'Pelanggan'}</p>
          {customerPhone && <p className="text-slate-400 print:text-slate-600 mt-1">{customerPhone}</p>}
        </div>

        {/* Tabel Rincian */}
        <div className="py-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-700 print:border-slate-300">
                  <th className="py-3 text-sm font-bold text-slate-100 print:text-black uppercase tracking-wider">Item</th>
                  <th className="py-3 text-sm font-bold text-slate-100 print:text-black uppercase tracking-wider text-center">Qty</th>
                  <th className="py-3 text-sm font-bold text-slate-100 print:text-black uppercase tracking-wider text-right">Harga</th>
                  <th className="py-3 text-sm font-bold text-slate-100 print:text-black uppercase tracking-wider text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 print:border-slate-200">
                    <td className="py-4 text-slate-300 print:text-black font-medium">{item.name}</td>
                    <td className="py-4 text-slate-400 print:text-slate-600 text-center">{item.qty}</td>
                    <td className="py-4 text-slate-400 print:text-slate-600 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="py-4 text-slate-200 print:text-black font-bold text-right">Rp {item.total.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="flex justify-end mt-8">
            <div className="w-full max-w-[300px] flex flex-col gap-3">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-200 print:text-black">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
                <span>Diskon</span>
                <span className="text-slate-200 print:text-black">{discount}%</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-700 print:border-slate-300">
                <span className="text-lg font-bold text-white print:text-black">Total</span>
                <span className="text-xl font-black text-emerald-400 print:text-black">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons (Sembunyikan saat di print) */}
      <div className="max-w-3xl mx-auto mt-6 flex items-center justify-center gap-6 print:hidden">
        <button 
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="text-slate-700">|</span>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
        >
          <Download className="w-4 h-4" /> Unduh Faktur
        </button>
      </div>

      {/* Global Print CSS to optimize printed PDF output */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          @page {
            margin: 0.5cm;
            size: auto;
          }
        }
      `}} />
    </div>
  )
}
