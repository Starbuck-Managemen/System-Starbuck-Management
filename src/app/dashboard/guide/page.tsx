"use client";

import { BookOpen, Info, Wifi, Ticket, Tag, Activity, Settings, HelpCircle, FileText, Users, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { getSettings } from "@/app/dashboard/settings/actions";

export default function GuidePage() {
  const [settings, setSettings] = useState({ appName: "STARBUCK MANAGER", appLogo: "/logo.jpg" })
  useEffect(() => { getSettings().then(setSettings) }, [])
  const [activeTab, setActiveTab] = useState('pengantar');

  const tabs = [
    { id: 'pengantar', label: 'Pengantar', icon: <Info className="w-5 h-5" /> },
    { id: 'router', label: 'Menghubungkan Router MikroTik', icon: <Wifi className="w-5 h-5" /> },
    { id: 'profil', label: 'Manajemen Profil & Harga', icon: <Tag className="w-5 h-5" /> },
    { id: 'voucher', label: 'Cara Generate & Print Voucher', icon: <Ticket className="w-5 h-5" /> },
    { id: 'laporan', label: 'Trafik Jaringan & Laporan', icon: <Activity className="w-5 h-5" /> },
  ];

  const renderContent = (id: string) => {
    switch (id) {
      case 'pengantar':
        return (
          <div className="prose prose-invert max-w-none prose-slate">
            <div className="bg-blue-900/10 border-l-4 border-blue-500 p-5 rounded-r-xl mb-4">
              <p className="text-blue-100 text-lg leading-relaxed m-0">
                <strong>{settings.appName}</strong> dirancang untuk menggantikan rutinitas rumit di Winbox. Dengan sistem ini, Anda bisa membuat voucher, mengatur harga, dan memantau pendapatan dari mana saja hanya melalui web browser.
              </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl mt-6">
              <h4 className="text-white font-bold flex items-center gap-2 mb-3 text-base">
                <Settings className="w-5 h-5 text-slate-400" /> Persyaratan Sistem Minimum
              </h4>
              <div className="space-y-3 mb-0 mt-4" style={{ marginLeft: '28px' }}>
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                  <div className="text-base text-slate-300">Router MikroTik dengan RouterOS versi 6.x atau 7.x.</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                  <div className="text-base text-slate-300">Layanan API MikroTik (Port 8728) dalam keadaan Aktif (Enabled).</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                  <div className="text-base text-slate-300">Koneksi internet yang stabil antara Server aplikasi dan Router.</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'router':
        return (
          <div className="prose prose-invert max-w-none prose-slate">
            <p className="text-slate-300 text-base">
              Untuk mengelola jaringan, Anda wajib mendaftarkan data *router* MikroTik Anda. Data ini akan disimpan dengan aman di *database* dan digunakan oleh sistem untuk berkomunikasi dengan *router* melalui protokol API.
            </p>

            <div className="bg-amber-900/10 border-l-4 border-amber-500 p-5 my-5">
              <h4 className="text-amber-400 font-bold m-0 flex items-center gap-2 text-base"><Info className="w-5 h-5" /> Persiapan di MikroTik (Winbox)</h4>
              <p className="text-amber-200/80 text-sm mt-2 mb-0" style={{ marginLeft: '28px' }}>
                Buka Winbox, menu <strong>IP &gt; Services</strong>, cari <code>api</code>, dan pastikan tidak disilang (centang/enable). Port default adalah 8728.
              </p>
            </div>
            
            <div className="space-y-4 mt-5">
              <div className="bg-slate-900/50 border border-slate-700/50 p-5 rounded-xl">
                <div className="flex items-start gap-3" style={{ marginLeft: '31px' }}>
                  <div className="font-bold text-blue-400 text-base shrink-0">1.</div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-2 text-base">IP Address / Host</h4>
                    <p className="text-sm text-slate-300 mb-0">
                      Masukkan alamat IP publik atau IP VPN (*Tunnel*). Jika server berjalan lokal, masukkan IP Gateway (contoh: <code>192.168.1.1</code>). Jika port API diubah, tuliskan <code>192.168.1.1:8729</code>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 p-5 rounded-xl">
                <div className="flex items-start gap-3" style={{ marginLeft: '31px' }}>
                  <div className="font-bold text-blue-400 text-base shrink-0">2.</div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-2 text-base">Username & Password</h4>
                    <p className="text-sm text-slate-300 mb-0">
                      Gunakan akun MikroTik yang memiliki grup <strong>full</strong> atau <strong>write + api</strong>. Disarankan membuat *User* baru di MikroTik yang dikhususkan hanya untuk aplikasi ini demi keamanan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profil':
        return (
          <div className="prose prose-invert max-w-none prose-slate">
            <div className="grid grid-cols-1 gap-5 my-5">
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-base"><Wifi className="w-5 h-5 text-emerald-400" /> Aturan Rate Limit</h4>
                <p className="text-sm text-slate-400 mb-4" style={{ marginLeft: '28px' }}>
                  Rate Limit menentukan batas Upload (Tx) dan Download (Rx).
                </p>
                <div style={{ marginLeft: '28px' }}>
                  <ul className="text-sm text-slate-300 space-y-3 mb-0">
                    <li className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                      <span>1 Mbps</span>
                      <code className="bg-[#0F172A] text-emerald-400 px-3 py-1.5 rounded text-sm">1M/1M</code>
                    </li>
                    <li className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                      <span>512 Kbps</span>
                      <code className="bg-[#0F172A] text-emerald-400 px-3 py-1.5 rounded text-sm">512k/512k</code>
                    </li>
                    <li className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                      <span>Up 1Mb / Down 2Mb</span>
                      <code className="bg-[#0F172A] text-emerald-400 px-3 py-1.5 rounded text-sm">1M/2M</code>
                    </li>
                    <li className="flex justify-between items-center pt-2">
                      <span className="text-blue-400">Tanpa Batas (Unlimited)</span>
                      <span className="italic bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded border border-blue-800 text-sm">Kosongkan Kolom</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-base"><Users className="w-5 h-5 text-purple-400" /> Shared Users &amp; Harga Jual</h4>
                <div className="space-y-4" style={{ marginLeft: '28px' }}>
                  <div className="flex items-start gap-3">
                    <div className="text-purple-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                    <div className="text-sm text-slate-400">
                      <strong className="text-white">Shared Users:</strong> Angka ini menentukan berapa banyak perangkat (HP/Laptop) yang bisa login menggunakan satu kode voucher yang sama secara bersamaan (Isi 1 untuk satu perangkat).
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-purple-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                    <div className="text-sm text-slate-400">
                      <strong className="text-white">Harga Jual:</strong> Wajib diisi angka bulat (Misal: <code>5000</code>). Digunakan untuk menghitung laporan pendapatan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'voucher':
        return (
          <div className="prose prose-invert max-w-none prose-slate">
            <div className="mt-5 space-y-8 pb-2">
              
              <div className="flex items-start gap-3">
                <div className="font-bold text-white text-base shrink-0 mt-0.5">1.</div>
                <div>
                  <h3 className="text-white text-base font-bold m-0 mb-2">Pilih Router Tujuan</h3>
                  <p className="text-slate-400 text-sm mb-0">Di halaman Voucher, perhatikan kotak abu-abu di bagian atas. Pastikan nama *Router* yang aktif sudah sesuai.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="font-bold text-white text-base shrink-0 mt-0.5">2.</div>
                <div>
                  <h3 className="text-white text-base font-bold m-0 mb-2">Atur Spesifikasi Voucher</h3>
                  <p className="text-slate-400 text-sm mb-0">Tentukan jumlah voucher (misal: 100), panjang kode (misal: 6), format kode (acak/angka), serta pilih Profil yang akan digunakan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="font-bold text-white text-base shrink-0 mt-0.5">3.</div>
                <div>
                  <h3 className="text-white text-base font-bold m-0 mb-2">Mode "Username = Password"</h3>
                  <p className="text-slate-400 text-sm mb-0">
                    Aktifkan fitur ini jika Anda ingin pelanggan hanya perlu memasukkan 1 kode untuk masuk. 
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="font-bold text-white text-base shrink-0 mt-0.5">4.</div>
                <div>
                  <h3 className="text-white text-base font-bold m-0 mb-2">Proses & Cetak (Print)</h3>
                  <p className="text-slate-400 text-sm mb-0">
                    Setelah ditekan "Generate", tekan tombol <strong className="text-white bg-slate-800 px-3 py-1.5 rounded">Cetak (Print) Terbaru</strong>. Layar pencetakan akan terbuka.
                  </p>
                </div>
              </div>

            </div>
          </div>
        );
      case 'laporan':
        return (
          <div className="prose prose-invert max-w-none prose-slate">
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 mb-5 mt-3">
              <h3 className="text-white font-bold flex items-center gap-3 mb-3 text-base">
                <FileText className="w-5 h-5 text-emerald-400" /> Analisis Laporan Keuangan
              </h3>
              <div className="space-y-3 mb-0 mt-4" style={{ marginLeft: '32px' }}>
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                  <div className="text-sm text-slate-300"><strong>Total Pendapatan:</strong> Merupakan akumulasi seluruh voucher aktif yang pernah di-generate dikalikan harganya.</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 font-bold shrink-0 mt-0.5 text-lg leading-none">•</div>
                  <div className="text-sm text-slate-300"><strong>Filter Dinamis:</strong> Anda bisa memfilter grafik dan tabel berdasarkan <em>Rentang Tanggal</em> maupun <em>Nama Profil</em>.</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-white font-bold flex items-center gap-3 mb-3 text-base">
                <Activity className="w-5 h-5 text-blue-400" /> Live Traffic Monitor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-[#0F172A] border border-slate-700/50 p-4 rounded-xl">
                  <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Rx (Download)
                  </h4>
                  <p className="text-xs text-slate-400 mb-0 leading-relaxed" style={{ marginLeft: '16px' }}>Menunjukkan beban koneksi yang digunakan pelanggan Anda untuk mengunduh data.</p>
                </div>
                <div className="bg-[#0F172A] border border-slate-700/50 p-4 rounded-xl">
                  <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Tx (Upload)
                  </h4>
                  <p className="text-xs text-slate-400 mb-0 leading-relaxed" style={{ marginLeft: '16px' }}>Menunjukkan beban unggah jaringan Anda.</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 italic mb-0" style={{ marginLeft: '32px' }}>
                Catatan: Monitor akan terus mengulang pengecekan setiap 2 detik. Jika koneksi putus, grafik otomatis mendeteksi error.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8 bg-[#1E293B] p-5 rounded-2xl border border-slate-700/50 shadow-lg">
        <div className="bg-blue-600/20 p-3.5 rounded-xl border border-blue-500/30">
          <BookOpen className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Panduan Penggunaan</h1>
          <p className="text-[13px] text-slate-400 mt-2 font-medium">
            Dokumentasi resmi dan cara pakai sistem {settings.appName}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} className="bg-[#1E293B] border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
              <button
                type="button"
                onClick={() => setActiveTab(isActive ? '' : tab.id)}
                className={`w-full flex items-center justify-between px-5 py-4 transition-all focus:outline-none ${
                  isActive ? 'bg-blue-900/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' : 'bg-[#0F172A] border border-slate-700 text-slate-400'}`}>
                    {tab.icon}
                  </div>
                  <span className="font-bold text-base">{tab.label}</span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} />
              </button>
              
              {isActive && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-300">
                  {renderContent(tab.id)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 flex items-start gap-3 bg-blue-900/10 p-4 rounded-xl border border-blue-800/20">
        <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/70 leading-relaxed">
          Jika Anda mengalami kendala yang tidak ada di panduan ini, silakan hubungi tim teknis atau administrator sistem utama.
        </p>
      </div>
    </div>
  );
}
