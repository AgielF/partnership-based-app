import React, { useState, useEffect } from 'react';
import { getActiveEscrows, refundEscrowToClient } from '../../services/api';

export default function AdminEscrow() {
  const [escrows, setEscrows] = useState([]);

  const fetchEscrows = async () => {
    try {
      const data = await getActiveEscrows();
      setEscrows(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  const handleRefund = async (projectId) => {
    if (window.confirm('PERINGATAN: Membatalkan proyek ini akan mengembalikan dana Escrow secara utuh ke Klien. Lanjutkan?')) {
      try {
        await refundEscrowToClient(projectId);
        alert('Dana Escrow berhasil dikembalikan ke dompet Klien.');
        fetchEscrows(); // Segarkan tabel
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleDispute = async (projectId) => {
  if (window.confirm('Tangguhkan proyek ini ke status SENGKETA untuk mediasi?')) {
    try {
      await markProjectDisputed(projectId);
      alert('Proyek ditangguhkan. Silakan jadwalkan mediasi dengan kedua pihak.');
      fetchEscrows();
    } catch (e) { alert(e.message); }
  }
};

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">MANAJEMEN ESCROW</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">OTORISASI PENGEMBALIAN DANA & SENGKETA</p>
        </div>
      </header>

      <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">DANA TERTENTU (LOCKED FUNDS)</h2>
        
        <div className="space-y-4">
          {escrows.length === 0 ? (
            <p className="font-bold border-4 border-black p-4 text-center bg-gray-50">TIDAK ADA DANA ESCROW AKTIF.</p>
          ) : escrows.map((escrow) => (
            <div key={escrow.id} className="border-4 border-black p-4 flex flex-col md:flex-row justify-between items-center bg-yellow-50 hover:bg-yellow-100 transition">
              <div className="w-full md:w-auto mb-4 md:mb-0">
                <p className="text-xs font-black text-gray-500 uppercase">ID Proyek: {escrow.id}</p>
                <h3 className="text-xl font-black uppercase">{escrow.title}</h3>
                <p className="text-sm font-bold mt-1 uppercase text-gray-700">KLIEN: {escrow.client_id}</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-auto">
                <div className="text-center md:text-right">
                  <p className="text-xs font-bold uppercase">Status Kontrak</p>
                  <p className="bg-black text-white px-2 py-1 text-xs font-black uppercase mt-1 inline-block">{escrow.status}</p>
                </div>
                <div className="text-center md:text-right border-x-4 border-black px-6">
                  <p className="text-xs font-black uppercase text-red-600">Ter-Escrow</p>
                  <p className="text-2xl font-black tracking-tighter">Rp {escrow.budget.toLocaleString('id-ID')}</p>
                </div>
                <button 
                  onClick={() => handleRefund(escrow.id)}
                  className="bg-red-600 text-white border-4 border-black px-6 py-3 font-black uppercase hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none whitespace-nowrap"
                >
                  REFUND KE KLIEN
                </button>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => handleRefund(escrow.id)}
                        className="bg-red-600 text-white border-4 border-black px-6 py-2 font-black uppercase hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none whitespace-nowrap"
                    >
                        FORCED REFUND
                    </button>
                    
                    {/* Tombol Arbitrase Baru */}
                    {escrow.status !== 'DISPUTED' && (
                        <button 
                        onClick={() => handleDispute(escrow.id)}
                        className="bg-yellow-300 text-black border-4 border-black px-6 py-2 font-black uppercase hover:bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none whitespace-nowrap"
                        >
                        MEDIASI (SENGKETA)
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}