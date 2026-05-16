import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMitraProjects, getMitraWallet } from '../../services/api';

export default function MitraDashboard() {
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Mengambil ID sesi saat ini
  const mitraId = localStorage.getItem('user_id') || 'VND-UNKNOWN';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!mitraId || mitraId === 'VND-UNKNOWN') return;
      
      try {
        // 1. Tarik proyek & hitung yang masih aktif (belum COMPLETED/CANCELLED)
        const projects = await getMitraProjects(mitraId);
        const activeCount = projects.filter(
          (p) => p.status === 'SEDANG DIKERJAKAN' || p.status === 'MENUNGGU UAT'
        ).length;
        setActiveProjectsCount(activeCount);

        // 2. Tarik saldo dompet (Available Balance)
        const walletData = await getMitraWallet(mitraId);
        setWalletBalance(walletData.balance || 0);
      } catch (error) {
        console.error("Gagal menarik data dashboard mitra:", error);
      }
    };

    fetchDashboardData();
  }, [mitraId]);

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter">HUB UTAMA</h1>
        <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">
          RINGKASAN AKTIVITAS & IDENTITAS VENDOR
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: QR Code Anti-Fraud (Validasi Fisik) */}
        <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center">
          <h2 className="text-xl font-black uppercase mb-2 border-b-4 border-black pb-2 w-full">KARTU IDENTITAS MITRA</h2>
          <p className="text-xs font-bold uppercase mb-6">TUNJUKKAN QR INI KE KASIR DROP-OFF CENTER UNTUK VALIDASI</p>
          
          <div className="w-48 h-48 bg-white border-8 border-black flex items-center justify-center p-2 mb-6">
            {/* Gambar QR Code Dirender Dinamis Sesuai ID Sesi */}
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mitraId}')` }}
            ></div>
          </div>
          
          <div className="bg-black text-white w-full p-3 font-black uppercase text-xl">
            ID: {mitraId}
          </div>
          <p className="text-xs font-bold text-red-700 uppercase mt-4">
            *Lolos Verifikasi KYC & Geolocation GPS
          </p>
        </div>

        {/* Kolom Kanan: Statistik & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-black uppercase text-gray-500 mb-2">PROYEK AKTIF (SPK)</p>
              {/* Jumlah Proyek Aktif Dinamis */}
              <p className="text-6xl font-black tracking-tighter">{activeProjectsCount}</p>
              <Link to="/mitra/projects" className="block mt-4 text-xs font-bold uppercase underline hover:bg-black hover:text-white w-fit px-2 transition-colors">
                LIHAT PROYEK &rarr;
              </Link>
            </div>
            <div className="border-4 border-black p-6 bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-black uppercase text-black mb-2">SALDO CAIR</p>
              {/* Saldo Dinamis Di-format ke Rupiah */}
              <p className="text-4xl font-black tracking-tighter mt-4">
                Rp {walletBalance.toLocaleString('id-ID')}
              </p>
              <Link to="/mitra/wallet" className="block mt-4 text-xs font-bold uppercase underline hover:bg-black hover:text-white w-fit px-2 transition-colors">
                TARIK DANA &rarr;
              </Link>
            </div>
          </div>

          <div className="border-4 border-black p-6 bg-gray-50">
            <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 mb-4">PENGUMUMAN SISTEM</h3>
            <div className="border-l-8 border-black pl-4">
              <p className="font-bold text-sm uppercase">Pembaruan Modul E-Contract</p>
              <p className="text-xs mt-1">Pastikan Anda selalu menekan tombol "Ajukan UAT" setelah milestone selesai agar BAST dapat diterbitkan secara otomatis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}