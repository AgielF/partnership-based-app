import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell'; // <--- 1. IMPORT NOTIFICATION BELL

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State Dinamis
  const [userId, setUserId] = useState('USER-XXX');
  const [userName, setUserName] = useState('KLIEN');

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    const name = localStorage.getItem('name');
    if (id) setUserId(id);
    if (name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { name: 'KLIEN HUB', path: '/client/dashboard', icon: '🏠' },
    { name: 'CARI JASA (O2O)', path: '/client/marketplace', icon: '🔍' },
    { name: 'E-CONTRACT (SPK)', path: '/client/contracts', icon: '📄' },
    { name: 'RIWAYAT POS', path: '/client/history', icon: '🧾' },
  ];

  return (
    <div className="flex h-screen bg-white font-mono text-black border-[16px] border-black overflow-hidden">
      
      <aside className="w-72 bg-white border-r-8 border-black flex flex-col z-10">
        <div className="p-6 border-b-8 border-black bg-blue-600">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white underline decoration-black underline-offset-4 mb-2">
            CLIENT HUB
          </h2>
          <span className="text-xs font-bold uppercase bg-white text-black px-2 py-1 tracking-widest block w-fit border-2 border-black">
            CUSTOMER PANEL
          </span>
        </div>
        
        <nav className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-5 border-b-4 border-black font-black uppercase transition-colors ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black hover:bg-blue-600 hover:text-white'
                }`}
              >
                <span className="text-2xl grayscale">{item.icon}</span>
                <span className="tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t-8 border-black">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-black uppercase px-6 py-6 hover:bg-red-700 active:bg-black transition-colors"
          >
            <span className="text-xl">🚪</span> KELUAR SISTEM
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-white relative">
        <header className="bg-white h-20 border-b-8 border-black flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 border-4 border-black px-3 py-1 bg-green-400 font-black text-sm uppercase">
             <div className="w-3 h-3 bg-black rounded-full animate-ping"></div>
             ONLINE
          </div>

          {/* 2. HEADER KANAN (LONCENG NOTIFIKASI + PROFIL) */}
          <div className="flex items-center gap-6 uppercase font-black">
             
             {/* TEMPATKAN KOMPONEN LONCENG DI SINI */}
             <NotificationBell />

             <div className="text-right flex flex-col justify-center">
                <span className="text-sm font-black leading-tight">{userId}</span>
                <span className="text-xs font-bold text-blue-600 leading-tight">AKUN TERVERIFIKASI</span>
             </div>
             <div className="w-12 h-12 border-4 border-black bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                {userName.charAt(0)}
             </div>
          </div>
        </header>
        
        <div className="p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}