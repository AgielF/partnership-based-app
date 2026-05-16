import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export default function MitraLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // State Dinamis
  const [userName, setUserName] = useState('MITRA');

  useEffect(() => {
    const name = localStorage.getItem('name');
    if (name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { name: 'HUB UTAMA', path: '/mitra/dashboard', icon: '⚡' },
    { name: 'PROYEK & KONTRAK', path: '/mitra/projects', icon: '📝' },
    { name: 'BURSA KERJA', path: '/mitra/jobs', icon: '🎯' },
    { name: 'SALDO ESCROW', path: '/mitra/wallet', icon: '💵' },
  ];

  return (
    <div className="flex h-screen bg-white font-mono text-black border-[16px] border-black overflow-hidden">
      <aside className="w-72 bg-white border-r-8 border-black flex flex-col z-10">
        <div className="p-6 border-b-8 border-black bg-yellow-300">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-black underline-offset-4 mb-2">
            MITRA HUB
          </h2>
          <span className="text-xs font-bold uppercase bg-black text-white px-2 py-1 tracking-widest block w-fit border-2 border-black">
            PORTAL VENDOR
          </span>
        </div>
        <nav className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-5 border-b-4 border-black font-black uppercase transition-colors ${
                location.pathname.includes(item.path) 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-yellow-300'
              }`}
            >
              <span className="text-2xl grayscale">{item.icon}</span>
              <span className="tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t-8 border-black">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 text-white font-black uppercase px-6 py-6 hover:bg-red-700 transition-colors"
          >
            KELUAR
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-white relative">
        <header className="bg-white h-20 border-b-8 border-black flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 border-4 border-black px-3 py-1 bg-green-400 font-black text-sm uppercase">
             <div className="w-3 h-3 bg-black rounded-full animate-ping"></div>
             TERSEDIA UNTUK KERJA
          </div>
          <div className="flex items-center gap-4 uppercase font-black">
             {/* Menampilkan sebagian nama mitra (nama depan) */}
             <span className="text-sm">{userName.split(' ')[0]} | VENDOR</span>
             <div className="w-12 h-12 border-4 border-black bg-yellow-300 text-black flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
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