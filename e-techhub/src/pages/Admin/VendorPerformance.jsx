import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'; // Tambahan ZAxis
import { getVendorPerformanceData } from '../../services/api'; 

// Tooltip Brutalist (TIDAK DIUBAH)
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-yellow-300 p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 relative">
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
  const [vendorData, setVendorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // STATE LOADING BARU
  const [selectedMitra, setSelectedMitra] = useState(null); // STATE DRILL-DOWN BARU

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getVendorPerformanceData();
        setVendorData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // FUNGSI DRILL-DOWN (KLIK PADA TITIK)
  const handleNodeClick = (data) => {
    setSelectedMitra(data);
  };

  return (
    <div className="font-mono bg-white text-black min-h-full relative">
      
      {/* MODAL DRILL-DOWN BRUTALIST */}
      {selectedMitra && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h3 className="text-3xl font-black uppercase mb-4 border-b-8 border-black pb-2">TINDAKAN ADMIN</h3>
            <p className="text-xl font-bold uppercase mb-2">TARGET: <span className="bg-yellow-300 px-2">{selectedMitra.nama}</span></p>
            <p className="font-bold mb-6 text-gray-600 uppercase">Performa saat ini: {selectedMitra.proyekSelesai} Proyek | Rating {selectedMitra.rating}</p>
            
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white font-black uppercase py-4 border-4 border-black hover:bg-blue-700 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
                🔍 LIHAT PROFIL LENGKAP
              </button>
              {selectedMitra.rating < 3.0 ? (
                <button className="w-full bg-red-600 text-white font-black uppercase py-4 border-4 border-black hover:bg-red-700 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
                  ⚠️ KIRIM SURAT PERINGATAN
                </button>
              ) : (
                <button className="w-full bg-green-500 text-black font-black uppercase py-4 border-4 border-black hover:bg-green-600 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
                  🎁 BERIKAN REWARD/BONUS
                </button>
              )}
              <button 
                onClick={() => setSelectedMitra(null)}
                className="w-full bg-white text-black font-black uppercase py-4 border-4 border-black hover:bg-gray-200"
              >
                TUTUP PANEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Brutalist (TIDAK DIUBAH) */}
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">KINERJA MITRA</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">ANALISIS BUBBLE PLOT & VOLUME PROYEK</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase flex items-center gap-2">
          <span>DATA REALTIME</span>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* Area Grafik */}
      <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-8">
        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
          <h2 className="text-2xl font-black uppercase">DISTRIBUSI KECEPATAN VS. VOLUME VS. RATING</h2>
          <div className="flex gap-4 text-xs font-bold uppercase">
             <span className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-600 border-2 border-black block rounded-full"></span> MITRA BIASA</span>
             <span className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 border-2 border-black block rounded-full"></span> TOP PERFORMER (&gt;20 PROYEK)</span>
             <span className="flex items-center gap-2"><span className="text-xl">⚪</span> UKURAN BUBBLE = RATING</span>
          </div>
        </div>

        <div className="h-[450px] w-full font-bold relative">
          
          {/* STATE LOADING BRUTALIST */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
              <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                ⏳ MEMUAT MATRIKS KINERJA...
              </div>
            </div>
          )}

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

              {/* Z-AXIS BARU: Mengatur ukuran titik berdasarkan Rating */}
              <ZAxis 
                type="number" 
                dataKey="rating" 
                range={[100, 800]} // Min and max pixel area for bubbles
                name="Rating" 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#000', strokeWidth: 2, strokeDasharray: '5 5' }} />
              
              <Scatter 
                name="Mitra" 
                data={vendorData} 
                onClick={handleNodeClick} // EVENT KLIK BARU
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
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