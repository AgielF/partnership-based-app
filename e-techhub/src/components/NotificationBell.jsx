import React, { useState, useEffect } from 'react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Mengambil ID pengguna yang sedang login
  const userId = localStorage.getItem('user_id');
  const BASE_URL = 'http://127.0.0.1:8000/api';

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/notifications/${userId}`);
      const data = await res.json();
      
      // PENGAMANAN: Pastikan respons dari server benar-benar sebuah Array.
      // Jika server error (mengembalikan 404/objek JSON detail), kita cegah agar tidak masuk ke state.
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.warn("Data notifikasi bukan array atau server error:", data);
        setNotifications([]); // Kosongkan agar fungsi .filter() di bawah tidak crash
      }
    } catch (err) {
      console.error("Gagal menarik notifikasi dari server:", err);
      setNotifications([]); // Set ke array kosong jika terjadi masalah jaringan
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    // Koneksi WebSocket Real-Time Lonceng Notifikasi
    const wsUrl = `ws://127.0.0.1:8000/api/notifications/ws/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const newNotif = JSON.parse(event.data);
      // Masukkan notifikasi terbaru ke tumpukan paling atas list
      setNotifications(prev => [newNotif, ...prev]);
    };

    return () => ws.close(); // Tutup koneksi saat komponen tidak lagi dirender
  }, [userId]);

  const handleReadAll = async () => {
    try {
      await fetch(`${BASE_URL}/notifications/${userId}/read-all`, { method: 'PUT' });
      fetchNotifications(); // Refresh data notifikasi agar status "is_read" terupdate
    } catch (err) {
      console.error("Gagal menandai notifikasi terbaca:", err);
    }
  };

  // Menghitung jumlah notifikasi yang belum dibaca.
  // Karena kita sudah menjamin state `notifications` selalu berupa array, fungsi .filter() ini aman dari crash.
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <div className="relative font-mono z-40">
      {/* TOMBOL LONCENG BADGE NEO-BRUTALIST */}
      <button 
        onClick={() => {
            setIsOpen(!isOpen);
            // Otomatis tandai sudah dibaca jika membuka kotak notifikasi dan ada yang belum terbaca
            if(!isOpen && unreadCount > 0) handleReadAll();
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
                    <span className="text-[9px] font-bold text-gray-400">{n.created_at}</span>
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