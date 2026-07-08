"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { useNotificationStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = mounted ? notifications.filter((n) => !n.read).length : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-400 hover:text-slate-50 p-2 rounded-full hover:bg-slate-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border-2 border-[#1E293B]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#0f172a]">
            <h3 className="font-bold text-sm text-slate-100">Notifikasi</h3>
            <div className="flex gap-2">
              <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300" title="Tandai semua dibaca">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-400" title="Hapus semua">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada notifikasi.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`flex gap-3 p-4 border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800 ${!notif.read ? 'bg-[#0f172a]/50' : 'opacity-70'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-sm font-semibold ${!notif.read ? 'text-slate-100' : 'text-slate-300'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.time), { addSuffix: true, locale: localeId })}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 leading-relaxed">
                        {notif.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
