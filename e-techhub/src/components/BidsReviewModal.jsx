import React, { useState, useEffect } from 'react';
import { getProjectBids, acceptProjectBid } from '../services/api';

export default function BidsReviewModal({ projectId, clientId, onClose, onSuccess }) {
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    fetchBids();
  }, [projectId]);

  const fetchBids = async () => {
    setIsLoading(true);
    try {
      const data = await getProjectBids(clientId, projectId);
      setBids(data);
    } catch (error) {
      console.error("Gagal memuat penawaran:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (bid) => {
    if (window.confirm(`YAKIN TERIMA PENAWARAN INI?\n\nAnda akan mempekerjakan ${bid.mitra_name} dengan nilai kesepakatan Rp ${bid.bid_amount.toLocaleString('id-ID')}.\nProyek akan langsung dikunci dan dimulai.`)) {
      setIsAccepting(true);
      try {
        await acceptProjectBid(clientId, bid.id);
        alert("✅ SUKSES! Mitra terpilih dan proyek resmi dimulai.");
        onSuccess(); // Refresh data dashboard
        onClose(); // Tutup modal
      } catch (error) {
        alert(`❌ Gagal menerima penawaran: ${error.message}`);
        setIsAccepting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm font-mono text-black">
      <div className="bg-white border-8 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-8 border-black pb-4 mb-6 shrink-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">DAFTAR PELAMAR</h2>
            <p className="text-sm font-bold text-gray-600 uppercase mt-1">PROYEK ID: {projectId}</p>
          </div>
          <button onClick={onClose} className="text-4xl font-black hover:text-red-500 leading-none">&times;</button>
        </div>

        {/* LIST PENAWARAN */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-grow">
          {isLoading ? (
            <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-xl text-center animate-pulse">
              ⏳ MEMUAT PROPOSAL...
            </div>
          ) : bids.length === 0 ? (
            <div className="border-4 border-black border-dashed p-8 bg-gray-50 text-center">
              <p className="font-black text-xl text-gray-500 uppercase">BELUM ADA PENAWARAN MASUK.</p>
              <p className="font-bold text-sm text-gray-400 mt-2">Tunggu beberapa saat hingga Mitra mengajukan proposal mereka.</p>
            </div>
          ) : (
            bids.map((bid) => (
              <div key={bid.id} className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                
                {/* Bagian Kiri: Profil & Harga */}
                <div className="bg-blue-50 p-6 border-b-4 md:border-b-0 md:border-r-4 border-black w-full md:w-1/3 flex flex-col justify-between shrink-0">
                  <div>
                    <h3 className="text-2xl font-black uppercase mb-1">{bid.mitra_name}</h3>
                    <p className="text-sm font-bold uppercase text-gray-600 mb-4">
                      ⭐ {bid.rating} ({bid.projects_completed} SELESAI)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Menawarkan Harga:</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-600">Rp {bid.bid_amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Bagian Kanan: Surat Lamaran & Aksi */}
                <div className="p-6 flex flex-col justify-between w-full">
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase text-gray-500 border-b-2 border-black pb-1 mb-3">Surat Penawaran / Cover Letter:</p>
                    <p className="text-sm font-medium leading-relaxed bg-gray-50 p-4 border-2 border-black whitespace-pre-wrap">
                      {bid.cover_letter}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleAccept(bid)}
                    disabled={isAccepting}
                    className="w-full bg-green-400 text-black font-black uppercase py-3 border-4 border-black hover:bg-green-500 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all disabled:bg-gray-300 disabled:shadow-none"
                  >
                    {isAccepting ? 'MEMPROSES KONTRAK...' : 'TERIMA PENAWARAN INI'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* FOOTER */}
        <div className="mt-6 pt-4 border-t-8 border-black shrink-0">
           <button 
             onClick={onClose}
             className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
           >
             TUTUP PANEL
           </button>
        </div>

      </div>
    </div>
  );
}