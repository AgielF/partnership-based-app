import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  // Fungsi Pelindung: Cek apakah user sudah login
  const handleProtectedAction = (destination) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Akses Ditolak: Anda harus masuk (login) terlebih dahulu untuk mulai mencari jasa atau mengambil proyek.');
      navigate('/login');
    } else {
      navigate(destination);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono border-[16px] border-black">
      {/* Header Brutalist Minimalist */}
      <header className="flex justify-between items-center p-6 border-b-4 border-black">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">E-TECHHUB</h1>
        <nav className="flex gap-4 items-center">
          
          {/* Akses Terbuka: Siapapun bisa melihat daftar Marketplace */}
          <button 
            onClick={() => navigate('/public/marketplace')} 
            className="text-sm font-bold uppercase hover:underline"
          >
            Marketplace
          </button>
          
          <button 
              onClick={() => navigate('/about')} 
              className="text-sm font-bold uppercase hover:underline"
            >
              Tentang
            </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-black text-white px-5 py-2 text-sm font-bold uppercase hover:bg-neutral-800 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ml-2"
          >
            LOGIN
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="p-10 md:p-16 border-b-4 border-black">
        <div className="grid md:grid-cols-3 gap-10 items-center">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter">
              IT ON-DEMAND. <br /> 
            </h2>
            <p className="text-xl max-w-2xl font-medium">
              Platform O2O Terpercaya untuk menghubungkan Klien dengan Mitra Profesional. Tanpa kompromi, tanpa ribet.
            </p>
            <div className="flex gap-4">
              
              {/* Akses Terproteksi: Harus login untuk benar-benar "Cari Jasa" (Posting SPK) */}
              <button 
                onClick={() => handleProtectedAction('/client/marketplace')}
                className="bg-white text-black border-4 border-black px-8 py-3 font-extrabold uppercase hover:bg-black hover:text-white transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
              >
                CARI JASA
              </button>
              
              {/* Akses Terproteksi: Harus login/daftar untuk menjadi mitra */}
              <button 
                onClick={() => handleProtectedAction('/mitra/dashboard')}
                className="bg-blue-600 text-white border-4 border-black px-8 py-3 font-extrabold uppercase hover:bg-blue-700 transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
              >
                GABUNG MITRA
              </button>
            </div>
          </div>
          {/* Visual Element Asimetris */}
          <div className="border-4 border-black p-4 flex items-center justify-center h-full aspect-square bg-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <div className="w-2/3 h-2/3 border-4 border-black border-dashed animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Fitur Utama - Grid Kaku */}
      <section className="p-10 md:p-16 border-b-4 border-black">
        <h3 className="text-3xl font-black uppercase mb-10 tracking-tight">FITUR UTAMA</h3>
        <div className="grid md:grid-cols-3 border-4 border-black">
          {[
            { title: 'GENERASI KONTRAK OTOMATIS', icon: '⚖️' },
            { title: 'ESCROW AMAN (REKBER)', icon: '💰' },
            { title: 'PERFORMA MITRA TERUKUR', icon: '📊' },
          ].map((fitur) => (
            <div key={fitur.title} className="p-10 border-r-4 border-black last:border-r-0 hover:bg-gray-50 transition">
              <span className="text-5xl mb-6 block">{fitur.icon}</span>
              <p className="text-2xl font-extrabold uppercase tracking-tight">{fitur.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Minimalis */}
      <footer className="p-6 text-center text-sm font-medium">
        <p className="uppercase tracking-wide">Copyright 2026 E-TechHub - Jalan PKH. Mustofa No. 23, Bandung</p>
      </footer>
    </div>
  );
}