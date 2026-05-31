import React, { useState, useEffect, useRef } from 'react';
import { WS_BASE_URL } from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref untuk mendeteksi klik di luar
  
  const userId = localStorage.getItem('user_id');
  const BASE_URL = 'http://127.0.0.1:8000/api';

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/notifications/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Gagal menarik notifikasi dari server:", err);
      setNotifications([]); 
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const wsUrl = `${WS_BASE_URL}/notifications/ws/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const newNotif = JSON.parse(event.data);
      setNotifications(prev => [newNotif, ...prev]);
    };

    return () => ws.close(); 
  }, [userId]);

  // LOGIKA INDUSTRI: Tutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleReadAll = async () => {
    try {
      await fetch(`${BASE_URL}/notifications/${userId}/read-all`, { method: 'PUT' });
      fetchNotifications(); 
    } catch (err) {
      console.error("Gagal menandai notifikasi terbaca:", err);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <div className="relative font-mono z-40" ref={dropdownRef}>
      {/* TOMBOL LONCENG */}
      <button 
        onClick={() => {
            const nextState = !isOpen;
            setIsOpen(nextState);
            if(nextState && unreadCount > 0) handleReadAll();
        }}
        className="bg-yellow-300 text-black border-4 border-black p-2 font-black uppercase text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 active:translate-y-0.5 active:shadow-none"
      >
        🔔 {unreadCount > 0 ? `(${unreadCount}) PEMBERITAHUAN` : 'NOTIFIKASI'}
      </button>

      {/* DROPDOWN KOTAK NOTIFIKASI */}
      {isOpen && (
        <div className="absolute right-0 mt-3 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-80 max-h-96 overflow-y-auto flex flex-col">
          <div className="bg-black text-white p-2 font-black uppercase text-xs flex justify-between">
            <span>KOTAK PEMBERITAHUAN</span>
            <button onClick={() => setIsOpen(false)} className="text-red-400 font-bold hover:text-red-500">TUTUP</button>
          </div>
          
          <div className="flex-1 divide-y-2 divide-black">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-gray-500 uppercase italic">
                Tidak ada pemberitahuan baru.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 text-left flex flex-col gap-1 ${n.is_read === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-black text-xs uppercase text-blue-700 leading-none">{n.title}</span>
                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap ml-2">{n.created_at}</span>
                  </div>
                  <p className="text-xs font-bold text-black leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}