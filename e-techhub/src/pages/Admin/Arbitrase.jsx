import React, { useState, useEffect } from 'react';
import { getDisputedProjects, resolveDisputeRefund, resolveDisputeForceRelease } from '../../services/api';

export default function AdminArbitrase() {
  const [disputes, setDisputes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchDisputes = async () => {
    try {
      const data = await getDisputedProjects();
      setDisputes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleRefund = async (projectId) => {
    if (window.confirm(`⚠️ PERINGATAN KEPUTUSAN MUTLAK\n\nAnda akan memenangkan KLIEN. Dana Escrow proyek ${projectId} akan dikembalikan (Refund). Lanjutkan?`)) {
      setIsProcessing(projectId);
      try {
        await resolveDisputeRefund(projectId);
        alert("KEPUTUSAN DIEKSEKUSI: Dana berhasil dikembalikan ke Klien.");
        fetchDisputes();
      } catch (err) {
        alert(err.message);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const handleForceRelease = async (projectId) => {
    if (window.confirm(`⚠️ PERINGATAN KEPUTUSAN MUTLAK\n\nAnda akan memenangkan MITRA. Dana Escrow proyek ${projectId} akan dipaksa cair ke Mitra. Lanjutkan?`)) {
      setIsProcessing(projectId);
      try {
        await resolveDisputeForceRelease(projectId);
        alert("KEPUTUSAN DIEKSEKUSI: Dana berhasil dipaksa cair ke Mitra.");
        fetchDisputes();
      } catch (err) {
        alert(err.message);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-red-600 p-6 md:p-10 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-10 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-red-600">MEJA HIJAU ADMIN</h1>
        <p className="text-sm font-bold text-black uppercase mt-2">PENGADILAN ARBITRASE & RESOLUSI SENGKETA ESCROW</p>
      </div>

      <div className="space-y-6">
        {disputes.length === 0 ? (
          <div className="bg-white border-4 border-black p-10 text-center font-black text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase">
            TIDAK ADA SENGKETA AKTIF SAAT INI.
          </div>
        ) : disputes.map((d) => (
          <div key={d.id} className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row">
            
            {/* INFORMASI KASUS */}
            <div className="md:w-1/2 p-6 border-b-8 md:border-b-0 md:border-r-8 border-black">
              <span className="bg-red-600 text-white px-3 py-1 font-black text-xs uppercase mb-4 inline-block">KASUS: {d.id}</span>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{d.title}</h2>
              <div className="space-y-2 font-bold text-sm bg-gray-100 p-4 border-4 border-black">
                <p>KLIEN (PENGGUGAT) : <span className="font-black text-red-600">{d.client_id}</span></p>
                <p>MITRA (TERGUGAT) : <span className="font-black text-blue-600">{d.mitra_id}</span></p>
                <p>NILAI ESCROW TERTAHAN: <span className="font-black text-xl text-green-600">Rp {d.budget.toLocaleString('id-ID')}</span></p>
              </div>
              <div className="mt-4 p-4 border-4 border-dashed border-black bg-yellow-100 text-sm font-bold">
                Jejak Audit Terakhir: <br/> {d.current_milestone}
              </div>
            </div>

            {/* PANEL EKSEKUSI (PALU HAKIM) */}
            <div className="md:w-1/2 p-6 bg-gray-800 flex flex-col justify-center gap-6">
              <h3 className="text-white text-xl font-black uppercase text-center border-b-4 border-white pb-2">VONIS MUTLAK ADMIN</h3>
              
              <button 
                onClick={() => handleRefund(d.id)}
                disabled={isProcessing === d.id}
                className="bg-red-500 text-white border-4 border-white p-4 font-black text-xl hover:bg-red-400 active:scale-95 transition-all uppercase"
              >
                {isProcessing === d.id ? "MEMPROSES..." : "🔨 MENANGKAN KLIEN (REFUND DANA)"}
              </button>
              
              <button 
                onClick={() => handleForceRelease(d.id)}
                disabled={isProcessing === d.id}
                className="bg-green-500 text-white border-4 border-white p-4 font-black text-xl hover:bg-green-400 active:scale-95 transition-all uppercase"
              >
                {isProcessing === d.id ? "MEMPROSES..." : "🔨 MENANGKAN MITRA (PAKSA CAIR)"}
              </button>
              
              <p className="text-gray-400 text-xs font-bold text-center mt-4">
                *Tombol di atas akan memindahkan dana dari Escrow secara otomatis. Tindakan ini memicu notifikasi real-time dan tidak dapat dibatalkan.
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}