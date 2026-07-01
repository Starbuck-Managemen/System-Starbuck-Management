"use client";

import { useEffect, useState, useRef } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { useNotificationStore } from "@/lib/store";

interface TrafficData {
  time: string;
  tx: number; // in Mbps
  rx: number; // in Mbps
}

export function TrafficMonitor({ routerId }: { routerId: string }) {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [data, setData] = useState<TrafficData[]>([]);
  const [currentTx, setCurrentTx] = useState<number>(0);
  const [currentRx, setCurrentRx] = useState<number>(0);
  const [maxTx, setMaxTx] = useState<number>(0);
  const [maxRx, setMaxRx] = useState<number>(0);
  const [minTx, setMinTx] = useState<number>(Infinity);
  const [minRx, setMinRx] = useState<number>(Infinity);
  
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const isConnectedRef = useRef(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch interface list once
  useEffect(() => {
    async function fetchInterfaces() {
      try {
        const res = await fetch(`/api/router/${routerId}/traffic`);
        const json = await res.json();
        if (json.interfaces && json.interfaces.length > 0) {
          setInterfaces(json.interfaces);
          // Try to select hotspot/bridge by default, else first interface
          const defaultIntf = json.interfaces.find((i: string) => i.toLowerCase().includes("hotspot") || i.toLowerCase().includes("bridge")) || json.interfaces[0];
          setSelectedInterface(defaultIntf);
        }
      } catch (err) {
        console.error("Error fetching interfaces", err);
      }
    }
    fetchInterfaces();
  }, [routerId]);

  // Poll traffic data
  useEffect(() => {
    if (!selectedInterface) return;

    const fetchTraffic = async () => {
      try {
        const res = await fetch(`/api/router/${routerId}/traffic?interface=${encodeURIComponent(selectedInterface)}`);
        if (!res.ok) throw new Error("API Error");

        if (!isConnectedRef.current) {
          isConnectedRef.current = true;
          toast.success("Koneksi Router kembali normal.");
          addNotification({
            type: 'success',
            title: 'Koneksi Router Pulih',
            message: `Koneksi ke router kembali normal.`,
          });
        }

        const json = await res.json();
        
        // Convert bps to Mbps
        const txMbps = (json.tx / 1000000);
        const rxMbps = (json.rx / 1000000);
        
        setCurrentTx(txMbps);
        setCurrentRx(rxMbps);
        setMaxTx(prev => Math.max(prev, txMbps));
        setMaxRx(prev => Math.max(prev, rxMbps));
        setMinTx(prev => prev === Infinity ? txMbps : Math.min(prev, txMbps));
        setMinRx(prev => prev === Infinity ? rxMbps : Math.min(prev, rxMbps));

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        setData(prev => {
          const newData = [...prev, { time: timeStr, tx: txMbps, rx: rxMbps }];
          // Keep last 60 points so bars are packed tightly
          if (newData.length > 60) return newData.slice(newData.length - 60);
          return newData;
        });

      } catch (err) {
        if (isConnectedRef.current) {
          isConnectedRef.current = false;
          toast.error("Koneksi Terputus! Gagal menghubungi router MikroTik.");
          addNotification({
            type: 'error',
            title: 'Koneksi Router Terputus',
            message: `Gagal menghubungi router MikroTik. Laporan otomatis terkirim.`,
          });
        }
        console.error("Error fetching traffic", err);
      }
    };

    // Fetch immediately then every 2 seconds
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 2000);

    return () => {
      clearInterval(interval);
      setData([]); // Reset data on interface change
    };
  }, [routerId, selectedInterface]);

  if (interfaces.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Memuat data interface MikroTik...</div>;
  }

  const formatMbps = (val: number) => val < 1 ? (val * 1000).toFixed(1) + " Kbps" : val.toFixed(2) + " Mbps";

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-lg p-6 mt-6">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          Live Traffic Monitor
        </h2>
        
        <div className="flex flex-wrap items-center justify-center gap-6 bg-[#0f172a] p-4 rounded-xl border border-slate-700 shadow-inner">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-red-500 text-lg font-bold px-2">
              <span className="w-3.5 h-3.5 bg-red-500 border border-red-700 shadow-[0_0_8px_#ef4444]" />
              Rx (Download): {formatMbps(currentRx)}
            </div>
            <div className="text-sm text-slate-400 mt-1 font-medium">
              Max: {formatMbps(maxRx)} | Min: {minRx === Infinity ? "0 Kbps" : formatMbps(minRx)}
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-slate-700" />
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-blue-500 text-lg font-bold px-2">
              <span className="w-3.5 h-3.5 bg-blue-600 border border-blue-800 shadow-[0_0_8px_#3b82f6]" />
              Tx (Upload): {formatMbps(currentTx)}
            </div>
            <div className="text-sm text-slate-400 mt-1 font-medium">
              Max: {formatMbps(maxTx)} | Min: {minTx === Infinity ? "0 Kbps" : formatMbps(minTx)}
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-12 bg-slate-700" />
          <select 
            value={selectedInterface}
            onChange={(e) => setSelectedInterface(e.target.value)}
            className="bg-slate-800 text-sm font-medium text-white border border-slate-600 rounded p-2 focus:outline-none"
          >
            {interfaces.map(intf => (
              <option key={intf} value={intf}>{intf}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ height: '300px', width: '100%' }} className="mt-4 bg-[#0f172a] border border-slate-800 rounded p-2 overflow-hidden">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data.length < 60 ? [...data, ...Array(60 - data.length).fill({ time: "", tx: null, rx: null })] : data} 
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }} 
              barGap={0} 
              barCategoryGap={1}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} minTickGap={30} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => val.toFixed(1) + " M"} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: any, name: any) => {
                  if (value === null) return [];
                  return [
                    `${Number(value).toFixed(2)} Mbps`,
                    name === 'rx' ? 'Download (Rx)' : 'Upload (Tx)'
                  ]
                }}
              />
              <Bar dataKey="tx" fill="#3b82f6" name="Tx (Upload)" isAnimationActive={false} barSize={10} />
              <Bar dataKey="rx" fill="#ef4444" name="Rx (Download)" isAnimationActive={false} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
