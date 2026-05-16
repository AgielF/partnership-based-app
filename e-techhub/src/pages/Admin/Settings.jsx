import React, { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSetting } from '../../services/api';

export default function AdminSettings() {
  const [fee, setFee] = useState('');
  const [escrowDays, setEscrowDays] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        if (data.PLATFORM_FEE) setFee(data.PLATFORM_FEE);
        if (data.MAX_ESCROW_DAYS) setEscrowDays(data.MAX_ESCROW_DAYS);
      } catch (e) { console.error(e); }
    };
    fetchSettings();
  }, []);

  const handleSave = async (key, value) => {
    try {
      await updateSystemSetting(key, value);
      alert(`Berhasil memperbarui parameter: ${key}`);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">PENGATURAN SISTEM</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">KONFIGURASI VARIABEL GLOBAL E-TECHHUB</p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Potongan Komisi Platform */}
        <div className="border-4 border-black p-6 bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-2">POTONGAN KOMISI (FEE)</h2>
          <p className="text-xs font-bold uppercase mb-6">Persentase yang dipotong ke dompet Admin saat BAST</p>
          
          <div className="flex gap-4">
            <input 
              type="number" step="0.01" 
              value={fee} onChange={(e) => setFee(e.target.value)}
              className="w-full border-4 border-black p-3 font-black bg-white focus:outline-none" 
            />
            <button 
              onClick={() => handleSave('PLATFORM_FEE', fee)}
              className="bg-black text-white border-4 border-black px-6 font-black uppercase hover:bg-gray-800 transition"
            >
              SIMPAN
            </button>
          </div>
          <p className="text-xs font-bold mt-2">*Gunakan format desimal (0.05 = 5%)</p>
        </div>

        {/* Batas Maksimal Escrow */}
        <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-2">BATAS AUTO-REFUND ESCROW</h2>
          <p className="text-xs font-bold uppercase mb-6">Jumlah hari maksimal proyek mengendap tanpa progres</p>
          
          <div className="flex gap-4">
            <input 
              type="number" 
              value={escrowDays} onChange={(e) => setEscrowDays(e.target.value)}
              className="w-full border-4 border-black p-3 font-black bg-white focus:outline-none" 
            />
            <button 
              onClick={() => handleSave('MAX_ESCROW_DAYS', escrowDays)}
              className="bg-black text-white border-4 border-black px-6 font-black uppercase hover:bg-gray-800 transition"
            >
              SIMPAN
            </button>
          </div>
          <p className="text-xs font-bold mt-2">*Dalam hitungan hari (contoh: 14)</p>
        </div>

      </div>
    </div>
  );
}