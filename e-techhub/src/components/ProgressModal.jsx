import React, { useState, useEffect } from 'react';
import { getDeliverables, submitDeliverable, reviewDeliverable } from '../services/api';

export default function ProgressModal({ projectId, userRole, onClose }) {
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk form input Mitra
  const [linkInputs, setLinkInputs] = useState({});
  const [descInputs, setDescInputs] = useState({});
  const [isProcessing, setIsProcessing] = useState(null);

  useEffect(() => {
    fetchData();
  }, [projectId, userRole]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getDeliverables(userRole, projectId);
      setDeliverables(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- AKSI MITRA ---
  const handleMitraSubmit = async (e, deliverableId) => {
    e.preventDefault();
    const link = linkInputs[deliverableId];
    if (!link) return alert("Tautan (Link) bukti kerja wajib diisi!");

    setIsProcessing(deliverableId);
    try {
      await submitDeliverable(projectId, deliverableId, {
        submission_link: link,
        description: descInputs[deliverableId] || ""
      });
      alert("✅ Bukti kerja berhasil dikirim ke Klien!");
      fetchData();
    } catch (error) {
      alert(`❌ Gagal: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  // --- AKSI KLIEN ---
  const handleClientReview = async (deliverableId, status) => {
    let feedback = "";
    if (status === "REVISION_REQUESTED") {
      feedback = prompt("Tuliskan bagian mana yang perlu direvisi oleh Mitra:");
      if (feedback === null) return; // Batal jika klien menekan cancel
    } else {
      if (!window.confirm("Yakin ingin menyetujui tahap ini?")) return;
    }

    setIsProcessing(deliverableId);
    try {
      await reviewDeliverable(projectId, deliverableId, { status, feedback });
      alert(status === "APPROVED" ? "✅ Tahapan disetujui!" : "⚠️ Permintaan revisi dikirim.");
      fetchData();
    } catch (error) {
      alert(`❌ Gagal: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm font-mono text-black">
      <div className="bg-white border-8 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-8 border-black pb-4 mb-6 shrink-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-blue-600">
              WORKSPACE (MILESTONES)
            </h2>
            <p className="text-sm font-bold text-gray-600 uppercase mt-1">PROYEK ID: {projectId}</p>
          </div>
          <button onClick={onClose} className="text-4xl font-black hover:text-red-500 leading-none">&times;</button>
        </div>

        {/* LIST DELIVERABLES */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-grow">
          {isLoading ? (
            <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-xl text-center animate-pulse">
              ⏳ MEMUAT TAHAPAN KERJA...
            </div>
          ) : deliverables.length === 0 ? (
            <div className="border-4 border-black border-dashed p-8 bg-gray-50 text-center">
              <p className="font-black text-xl text-gray-500 uppercase">BELUM ADA TAHAPAN KERJA.</p>
            </div>
          ) : (
            deliverables.map((item, index) => {
              
              const isPending = item.status === 'PENDING';
              const isSubmitted = item.status === 'SUBMITTED';
              const isApproved = item.status === 'APPROVED';
              const isRevision = item.status === 'REVISION_REQUESTED';

              return (
                <div key={item.id} className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:-translate-y-1 transition-transform">
                  
                  {/* Bagian Info Milestone */}
                  <div className={`p-4 border-b-4 border-black flex justify-between items-center ${
                    isApproved ? 'bg-green-300' : isRevision ? 'bg-red-300' : isSubmitted ? 'bg-yellow-300' : 'bg-gray-100'
                  }`}>
                    <h3 className="text-xl font-black uppercase">{item.title}</h3>
                    <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase">
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-gray-50">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-4">{item.description}</p>
                    
                    {/* Tampilkan Hasil Kerja jika sudah dikirim */}
                    {(isSubmitted || isApproved || isRevision) && (
                      <div className="border-2 border-black p-4 bg-white mb-4">
                        <p className="text-xs font-black uppercase text-gray-500 mb-1">Tautan Bukti Kerja (Drive/Repo):</p>
                        <a href={item.submission_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline break-all">
                          🔗 {item.submission_link}
                        </a>
                        
                        {item.feedback && (
                          <div className="mt-4 pt-4 border-t-2 border-dashed border-red-400">
                            <p className="text-xs font-black uppercase text-red-600 mb-1">Catatan Revisi dari Klien:</p>
                            <p className="text-sm font-medium text-red-800">{item.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================== */}
                    {/* AREA KENDALI MITRA (FORM UPLOAD)           */}
                    {/* ========================================== */}
                    {userRole === 'mitra' && (isPending || isRevision) && (
                      <form onSubmit={(e) => handleMitraSubmit(e, item.id)} className="border-t-4 border-black pt-4 mt-2">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-black uppercase mb-1">Tautan Bukti Kerja *</label>
                            <input 
                              type="url" required 
                              placeholder="https://github.com/..." 
                              value={linkInputs[item.id] || ''}
                              onChange={(e) => setLinkInputs(prev => ({...prev, [item.id]: e.target.value}))}
                              className="w-full border-2 border-black p-2 text-sm font-bold focus:outline-none focus:bg-yellow-50" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase mb-1">Catatan Tambahan (Opsional)</label>
                            <textarea 
                              rows="2"
                              placeholder="Deskripsi singkat hasil pengerjaan..." 
                              value={descInputs[item.id] || ''}
                              onChange={(e) => setDescInputs(prev => ({...prev, [item.id]: e.target.value}))}
                              className="w-full border-2 border-black p-2 text-sm font-bold focus:outline-none focus:bg-yellow-50 resize-none" 
                            ></textarea>
                          </div>
                          <button 
                            type="submit" disabled={isProcessing === item.id}
                            className="w-full bg-blue-600 text-white border-2 border-black py-2 font-black uppercase hover:bg-blue-700 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:bg-gray-400"
                          >
                            {isProcessing === item.id ? 'MENGIRIM...' : '📤 KIRIM HASIL KERJA'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ========================================== */}
                    {/* AREA KENDALI KLIEN (TOMBOL APPROVE/REVISI) */}
                    {/* ========================================== */}
                    {userRole === 'client' && isSubmitted && (
                      <div className="border-t-4 border-black pt-4 mt-2 flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => handleClientReview(item.id, 'APPROVED')}
                          disabled={isProcessing === item.id}
                          className="flex-1 bg-green-400 text-black border-2 border-black py-2 font-black uppercase hover:bg-green-500 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:bg-gray-400"
                        >
                          ✅ SETUJUI (APPROVE)
                        </button>
                        <button 
                          onClick={() => handleClientReview(item.id, 'REVISION_REQUESTED')}
                          disabled={isProcessing === item.id}
                          className="flex-1 bg-red-400 text-black border-2 border-black py-2 font-black uppercase hover:bg-red-500 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:bg-gray-400"
                        >
                          ❌ MINTA REVISI
                        </button>
                      </div>
                    )}
                    
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* FOOTER */}
        <div className="mt-6 pt-4 border-t-8 border-black shrink-0">
           <button 
             onClick={onClose}
             className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
           >
             TUTUP WORKSPACE
           </button>
        </div>

      </div>
    </div>
  );
}