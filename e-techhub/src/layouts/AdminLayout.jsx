import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State Dinamis
  const [userName, setUserName] = useState('ADMINISTRATOR');

  useEffect(() => {
    // Menarik nama asli dari penyimpanan lokal saat login
    const storedName = localStorage.getItem('name');
    if (storedName) setUserName(storedName);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Hapus semua sesi
    navigate('/login'); // Lempar kembali ke halaman login
  };

  // Di dalam komponen AdminLayout.jsx
const menuItems = [
  { name: 'KINERJA MITRA', path: '/admin/performance', icon: '📊' },
  { name: 'MODUL POS', path: '/admin/pos', icon: '🛒' },
  { name: 'DROP-OFF CENTER', path: '/admin/dropoff', icon: '📦' },
  { name: 'MANAJEMEN ESCROW', path: '/admin/escrow', icon: '💰' },
  { name: 'KEPATUHAN (KYC)', path: '/admin/mitra', icon: '🛂' }, // <--- MENU BARU
  { name: 'SISTEM MAKRO', path: '/admin/settings', icon: '⚙️' }, // <--- MENU BARU
];
  return (
    <div className="flex h-screen bg-white font-mono text-black border-[16px] border-black overflow-hidden">
      
      {/* Sidebar Brutalist */}
      <aside className="w-72 bg-white border-r-8 border-black flex flex-col z-10">
        <div className="p-6 border-b-8 border-black">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-blue-600 underline-offset-4 mb-2">
            E-TECHHUB
          </h2>
        </div>
        
        <nav className="flex-1 flex flex-col overflow-y-auto">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 relative">
        
        {/* Header Minimalis Kaku */}
        <header className="bg-white h-20 border-b-8 border-black flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 bg-green-500 border-2 border-black animate-pulse"></div>
             <span className="font-black uppercase tracking-widest text-sm">SYSTEM ONLINE</span>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right flex flex-col justify-center">
                <span className="text-sm font-black uppercase leading-tight">{userName}</span>
                <span className="text-xs font-bold text-gray-500 uppercase leading-tight">SUPER ADMIN</span>
             </div>
             <div className="w-12 h-12 border-4 border-black bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                {userName.charAt(0)}
             </div>
          </div>
        </header>
        
        {/* Area dinamis tempat halaman akan di-render */}
        <div className="p-8 pb-20">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}