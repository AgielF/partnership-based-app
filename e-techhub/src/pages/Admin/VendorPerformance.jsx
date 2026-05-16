import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getVendorPerformanceData } from '../../services/api'; // Pastikan import ini benar

// Tooltip Brutalist (TIDAK DIUBAH)
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-yellow-300 p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-black uppercase text-lg border-b-4 border-black pb-1 mb-2">{data.nama}</p>
        <div className="font-bold text-sm uppercase space-y-1">
          <p>Waktu Rata-rata: <span className="font-black bg-white px-1 border-2 border-black">{data.kecepatanHari} HARI</span></p>
          <p>Volume Proyek: <span className="font-black bg-white px-1 border-2 border-black">{data.proyekSelesai} SELESAI</span></p>
          <p>Rating Kinerja: <span className="font-black">⭐ {data.rating}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export default function VendorPerformance() {
  // STATE BARU UNTUK DATA DINAMIS DARI MYSQL
  const [vendorData, setVendorData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVendorPerformanceData();
        setVendorData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="font-mono bg-white text-black min-h-full">
      {/* Header Brutalist (TIDAK DIUBAH) */}
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">KINERJA MITRA</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">ANALISIS SCATTER PLOT & VOLUME PROYEK</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase flex items-center gap-2">
          <span>DATA REALTIME</span>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* Area Grafik (TIDAK DIUBAH) */}
      <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-8">
        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
          <h2 className="text-2xl font-black uppercase">DISTRIBUSI KECEPATAN VS. VOLUME</h2>
          <div className="flex gap-4 text-xs font-bold uppercase">
             <span className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-600 border-2 border-black block"></span> MITRA BIASA</span>
             <span className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 border-2 border-black block"></span> TOP PERFORMER (&gt;20 PROYEK)</span>
          </div>
        </div>

        <div className="h-[450px] w-full font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#000" strokeWidth={2} />
              
              <XAxis 
                type="number" 
                dataKey="kecepatanHari" 
                name="Kecepatan" 
                reversed={true} 
                stroke="#000"
                strokeWidth={3}
                tick={{ fill: '#000', fontWeight: 'bold' }}
                label={{ value: '← LEBIH CEPAT | RATA-RATA HARI PENGERJAAN | LEBIH LAMA →', position: 'insideBottom', offset: -10, fill: '#000', fontWeight: 900 }} 
              />
              
              <YAxis 
                type="number" 
                dataKey="proyekSelesai" 
                name="Proyek" 
                stroke="#000"
                strokeWidth={3}
                tick={{ fill: '#000', fontWeight: 'bold' }}
                label={{ value: 'JUMLAH PROYEK', angle: -90, position: 'insideLeft', fill: '#000', fontWeight: 900 }} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#000', strokeWidth: 2, strokeDasharray: '5 5' }} />
              
              <Scatter name="Mitra" data={vendorData}>
                {vendorData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.proyekSelesai > 20 ? '#22c55e' : '#2563eb'} 
                    stroke="#000" 
                    strokeWidth={3} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}