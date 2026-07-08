"use client";

import { useState, useEffect } from "react";
import { MessageSquare, RefreshCcw, LogOut, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function WABotPage() {
  const [status, setStatus] = useState<string>("LOADING");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pushname, setPushname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/wa/bot/status");
      const data = await res.json();
      
      if (res.ok) {
        setStatus(data.status);
        if (data.status === "QR_READY") setQrCode(data.qr);
        else setQrCode(null);

        if (data.status === "READY") setPushname(data.pushname);
      } else {
        setError(data.error);
        setStatus("ERROR");
      }
    } catch (e) {
      setError("Gagal terhubung ke service Bot WA");
      setStatus("ERROR");
    }
  };

  const startBot = async () => {
    setStatus("STARTING");
    try {
      await fetch("/api/wa/bot/start", { method: "POST" });
      setTimeout(fetchStatus, 3000);
    } catch (e) {
      setError("Gagal memulai service Bot WA");
      setStatus("ERROR");
    }
  };

  const logoutBot = async () => {
    setStatus("LOADING");
    try {
      await fetch("/api/wa/bot/logout", { method: "POST" });
      setTimeout(fetchStatus, 2000);
    } catch (e) {
      setError("Gagal logout Bot WA");
      setStatus("ERROR");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (status !== "READY") fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
      <div className="flex items-center gap-4 bg-[#1E293B] p-6 rounded-xl border border-slate-800 shadow-sm">
        <div className="p-3 bg-green-500/20 text-green-500 rounded-xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Bot</h1>
          <p className="text-slate-400">Hubungkan nomor WhatsApp Anda untuk mengirim notifikasi otomatis ke pelanggan.</p>
        </div>
      </div>

      <div className="bg-[#1E293B] p-8 rounded-xl border border-slate-800 shadow-sm flex flex-col items-center text-center">
        {status === "LOADING" || status === "STARTING" ? (
          <div className="flex flex-col items-center gap-4">
            <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-300">Memeriksa status bot...</p>
          </div>
        ) : status === "NOT_STARTED" ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-300">Bot WhatsApp Anda belum berjalan.</p>
            <button onClick={startBot} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Mulai Bot WA
            </button>
          </div>
        ) : status === "QR_READY" && qrCode ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-slate-300">Scan QR Code di bawah ini dengan aplikasi WhatsApp Anda:</p>
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
            <p className="text-sm text-slate-400">QR Code akan diperbarui otomatis.</p>
          </div>
        ) : status === "READY" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Bot Terhubung!</h2>
            <p className="text-slate-400 mb-4">Terhubung sebagai: <span className="text-white font-medium">{pushname || "Nomor Anda"}</span></p>
            <button onClick={logoutBot} className="flex items-center gap-2 px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg font-medium transition-colors">
              <LogOut className="w-4 h-4" /> Logout Perangkat
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-400">Terjadi kesalahan: {error}</p>
            <button onClick={fetchStatus} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
