import React, { useState, useEffect } from 'react';
import { getProjectDeliverables, submitDeliverable, reviewDeliverable } from '../services/api';

export default function ProgressModal({ projectId, userRole, onClose }) {
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State form input untuk Mitra & Klien
  const [linkInput, setLinkInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [activeActionId, setActiveActionId] = useState(null);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const data = await getProjectDeliverables(userRole, projectId);
      setDeliverables(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [projectId, userRole]);

  // Aksi Mitra
  const handleSubmitWork = async (deliverableId) => {
    if (!linkInput.trim()) return alert("Tautan bukti kerja wajib diisi!");
    try {
      await submitDeliverable(projectId, deliverableId, { submission_link: linkInput });
      setLinkInput('');
      setActiveActionId(null);
      fetchProgress(); // Refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  // Aksi Klien
  const handleReviewWork = async (deliverableId, status) => {
    if (status === 'REVISION_REQUESTED' && !feedbackInput.trim()) {
      return alert("Harap berikan catatan revisi untuk Mitra.");
    }
    try {
      await reviewDeliverable(projectId, deliverableId, { status, feedback: feedbackInput });
      setFeedbackInput('');
      setActiveActionId(null);
      fetchProgress(); // Refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="bg-gray-200 text-black px-2 border-2 border-black">MENUNGGU PENGERJAAN</span>;
      case 'SUBMITTED': return <span className="bg-yellow-300 text-black px-2 border-2 border-black animate-pulse">SIAP DITINJAU KLIEN</span>;
      case 'REVISION_REQUESTED': return <span className="bg-red-500 text-white px-2 border-2 border-black">BUTUH REVISI</span>;
      case 'APPROVED': return <span className="bg-green-500 text-white px-2 border-2 border-black">DISETUJUI ✅</span>;
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,204,0,1)] w-full max-w-3xl max-h-[85vh] flex flex-col relative">
        
        {/* HEADER MODAL */}
        <div className="bg-yellow-300 border-b-8 border-black p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">PELACAK PROGRES (MILESTONES)</h2>
            <p className="text-xs font-bold uppercase">ID PROYEK: {projectId} | MODE: {userRole}</p>
          </div>
          <button onClick={onClose} className="bg-black text-white px-4 py-2 font-black text-xl hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            X TUTUP
          </button>
        </div>

        {/* AREA KONTEN */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-6">
          {isLoading ? (
            <div className="text-center font-black uppercase text-xl">MEMUAT DATA...</div>
          ) : deliverables.length === 0 ? (
            <div className="text-center font-bold text-gray-500 border-4 border-dashed border-gray-400 p-8">
              BELUM ADA DATA MILESTONE UNTUK PROYEK INI.
            </div>
          ) : (
            deliverables.map((item, index) => (
              <div key={item.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
                  <h3 className="font-black text-lg uppercase">{item.title}</h3>
                  <div className="text-xs font-bold">{getStatusBadge(item.status)}</div>
                </div>
                <p className="text-sm font-bold text-gray-600 mb-4">{item.description}</p>

                {/* RIWAYAT LINK & FEEDBACK */}
                {item.submission_link && (
                  <div className="mb-2 text-sm font-bold">
                    <span className="bg-blue-200 px-2 border-2 border-black">🔗 BUKTI KERJA:</span> <a href={item.submission_link} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">{item.submission_link}</a>
                  </div>
                )}
                {item.feedback && (
                  <div className="mb-4 text-sm font-bold">
                    <span className="bg-red-200 px-2 border-2 border-black">❌ CATATAN REVISI KLIEN:</span> <span className="text-red-700">{item.feedback}</span>
                  </div>
                )}

                {/* TOMBOL AKSI MITRA */}
                {userRole === 'mitra' && (item.status === 'PENDING' || item.status === 'REVISION_REQUESTED') && (
                  <div className="mt-4 border-t-2 border-dashed border-black pt-4">
                    {activeActionId === item.id ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Masukkan URL File / Bukti / Github / Drive..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="border-4 border-black p-2 font-bold text-sm" />
                        <div className="flex gap-2">
                          <button onClick={() => handleSubmitWork(item.id)} className="bg-black text-white px-4 py-2 font-black uppercase text-sm hover:bg-gray-800">KIRIM BUKTI KERJA</button>
                          <button onClick={() => setActiveActionId(null)} className="bg-white text-black border-4 border-black px-4 py-2 font-black uppercase text-sm hover:bg-gray-200">BATAL</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveActionId(item.id)} className="bg-yellow-300 text-black border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400">
                        {item.status === 'REVISION_REQUESTED' ? 'KIRIM PERBAIKAN' : 'UNGGAH BUKTI KERJA'}
                      </button>
                    )}
                  </div>
                )}

                {/* TOMBOL AKSI KLIEN */}
                {userRole === 'client' && item.status === 'SUBMITTED' && (
                  <div className="mt-4 border-t-2 border-dashed border-black pt-4">
                    {activeActionId === item.id ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Tulis catatan revisi untuk Mitra..." value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} className="border-4 border-black p-2 font-bold text-sm" />
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewWork(item.id, 'REVISION_REQUESTED')} className="bg-red-600 text-white border-4 border-black px-4 py-2 font-black uppercase text-sm hover:bg-red-700">KIRIM REVISI</button>
                          <button onClick={() => setActiveActionId(null)} className="bg-white text-black border-4 border-black px-4 py-2 font-black uppercase text-sm hover:bg-gray-200">BATAL</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleReviewWork(item.id, 'APPROVED')} className="bg-green-500 text-white border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600">
                          ✅ SETUJUI PROGRES
                        </button>
                        <button onClick={() => setActiveActionId(item.id)} className="bg-red-500 text-white border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600">
                          ❌ MINTA REVISI
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}