import React, { useState, useEffect } from 'react';
import { getClientContracts, signClientContract, approveContractUAT, rejectClientUat, getContractPDF } from '../../services/api';

// IMPORT KOMPONEN MODAL
import PublicProfileModal from '../../components/PublicProfileModal';
import ChatModal from '../../components/ChatModal';
import ProgressModal from '../../components/ProgressModal'; 
import QnABoardModal from '../../components/QnABoardModal'; 

export default function ClientContracts() {
  const [contracts, setContracts] = useState([]);
  const [isSigning, setIsSigning] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // STATE UNTUK MENGONTROL MODAL
  const [inspectedMitra, setInspectedMitra] = useState(null);
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [activeProgressProject, setActiveProgressProject] = useState(null); 
  const [activeQnA, setActiveQnA] = useState(null); 

  const clientId = localStorage.getItem('user_id');

  const fetchContracts = async () => {
    if (!clientId) return;
    try {
      const data = await getClientContracts(clientId);
      setContracts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [clientId]);

  const handleSignContract = async (contractId, mitraName) => {
    const legalWarning = `PERINGATAN HUKUM (CLICK-WRAP AGREEMENT):\n\nDengan menekan OK, Anda secara sadar mengikatkan diri secara hukum dengan Mitra (${mitraName}) untuk Proyek ID: ${contractId} berdasarkan Pasal 1320 KUHPerdata.\n\nApakah Anda setuju dengan seluruh Syarat & Ketentuan E-TechHub?`;
    
    if (window.confirm(legalWarning)) {
      setIsSigning(contractId);
      try {
        await signClientContract(contractId, clientId);
        alert("SAH SECARA HUKUM: Kontrak telah ditandatangani secara digital (Click-Wrap).");
        fetchContracts(); 
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      } finally {
        setIsSigning(null);
      }
    }
  };

  // FUNGSI APPROVE UAT (Disesuaikan agar bisa kirim Rating)
  const handleApproveUAT = async (contractId) => {
    if (window.confirm("YAKIN SETUJUI UAT?\n\nDengan menyetujui, dana Escrow akan otomatis dicairkan ke Mitra dan BAST diterbitkan. Tindakan ini TIDAK DAPAT DIBATALKAN.")) {
      
      let inputRating = prompt("Beri rating kinerja Mitra dari skala 1.0 hingga 5.0 (Contoh: 4.5):", "5.0");
      let finalRating = parseFloat(inputRating);
      
      if (isNaN(finalRating) || finalRating < 1.0 || finalRating > 5.0) {
        alert("Format rating tidak valid, sistem memberikan default 5.0");
        finalRating = 5.0;
      }

      setIsProcessing(true);
      try {
        await approveContractUAT(clientId, contractId, finalRating);
        alert(`SUKSES: BAST Diterbitkan dan Dana Berhasil Dicairkan ke Mitra! (Rating: ${finalRating})`);
        fetchContracts();
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRejectUAT = async (contractId) => {
    if (window.confirm("YAKIN TOLAK UAT?\n\nProyek akan dibekukan dan dialihkan ke tim Arbitrase Admin E-TechHub untuk diselidiki. Lanjutkan?")) {
      setIsProcessing(true);
      try {
        await rejectClientUat(clientId, contractId);
        alert("DITOLAK: Proyek masuk status Sengketa (DISPUTED). Hubungi Admin untuk investigasi lebih lanjut.");
        fetchContracts();
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleViewPDF = async (contractId) => {
    try {
      const blob = await getContractPDF(clientId, contractId);
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      alert(`Gagal membuka PDF: ${error.message}`);
    }
  };

  const toggleRow = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black relative">
      
      {inspectedMitra && (
        <PublicProfileModal type="mitra" targetId={inspectedMitra} onClose={() => setInspectedMitra(null)} />
      )}

      {activeChatProject && (
        <ChatModal roomId={`PROJ-${activeChatProject}`} userId={clientId} onClose={() => setActiveChatProject(null)} />
      )}

      {/* MODAL PELACAK PROGRES DELIVERABLES (SISI KLIEN) */}
      {activeProgressProject && (
        <ProgressModal 
          projectId={activeProgressProject} 
          userRole="client" 
          onClose={() => {
              setActiveProgressProject(null);
              fetchContracts(); // Refresh tabel setelah review bukti kerja
          }} 
        />
      )}

      {activeQnA && (
        <QnABoardModal projectId={activeQnA} userId={clientId} onClose={() => setActiveQnA(null)} />
      )}

      <div className="border-b-8 border-black pb-6 mb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter">DOKUMEN E-CONTRACT</h1>
        <p className="text-sm font-bold text-gray-600 uppercase mt-2">LEGALITAS SPK & PANTAUAN PROGRES MITRA</p>
      </div>

      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-black text-white font-black uppercase text-sm">
              <th className="p-4 border-r-4 border-black">ID Dokumen</th>
              <th className="p-4 border-r-4 border-black">Jalur Layanan</th>
              <th className="p-4 border-r-4 border-black">Mitra Terkait</th>
              <th className="p-4 border-r-4 border-black">Status & Progres</th>
              <th className="p-4">Aksi Legal</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr><td colSpan="5" className="p-4 font-bold text-center">TIDAK ADA KONTRAK</td></tr>
            ) : contracts.map((c, index) => {
              
              const isAlreadySigned = c.current_milestone?.includes('disetujui Klien') || c.status === 'COMPLETED';
              const isWaitingUat = c.status === 'MENUNGGU UAT';
              const isDisputed = c.status === 'DISPUTED';
              const isExpanded = expandedRowId === c.id;

              return (
                <React.Fragment key={c.id}>
                  <tr className={`border-b-4 border-black font-bold uppercase text-sm ${index % 2 !== 0 ? 'bg-gray-100' : 'bg-white'}`}>
                    <td className="p-4 border-r-4 border-black">{c.id}</td>
                    <td className="p-4 border-r-4 border-black">{c.type || c.service_type || 'UMUM'}</td>
                    
                    <td className="p-4 border-r-4 border-black">
                      {c.mitra_id ? ( 
                         <button onClick={() => setInspectedMitra(c.mitra_id)} className="underline decoration-2 hover:bg-yellow-300 transition-colors px-1">
                           {c.mitra_name || c.mitra} 🔍
                         </button>
                      ) : c.mitra ? ( 
                         <span className="text-gray-800 font-normal">{c.mitra} (ID Tidak Ditemukan)</span>
                      ) : (
                         <span className="text-gray-400 italic font-normal">Menunggu Mitra...</span>
                      )}
                    </td>
                    
                    <td className="p-4 border-r-4 border-black">
                      <span className={`block mb-2 ${c.status === 'COMPLETED' ? 'text-green-600' : isDisputed ? 'text-red-600' : isAlreadySigned ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {c.status === 'COMPLETED' ? '✅ SELESAI (SAH)' : isDisputed ? '🚨 DALAM SENGKETA' : isAlreadySigned ? '📄 KONTRAK AKTIF' : '⚠️ MENUNGGU SIGNATURE'}
                      </span>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(c.mitra || c.mitra_id) && (
                          <button onClick={() => toggleRow(c.id)} className={`text-xs px-2 py-1 border-2 border-black uppercase ${isWaitingUat ? 'bg-blue-300 animate-pulse' : isDisputed ? 'bg-red-200' : 'bg-yellow-200'} hover:bg-black hover:text-white transition-colors`}>
                            {isExpanded ? 'TUTUP PANEL TEKS' : isWaitingUat ? '🔍 MITRA MENGAJUKAN UAT!' : isDisputed ? '🔍 CEK SENGKETA' : '🔍 LOG TEXT PROGRES'}
                          </button>
                        )}

                        {/* TOMBOL TINJAU BUKTI KERJA (PANGGIL PROGRESS MODAL) */}
                        {(c.mitra_id && c.status !== 'COMPLETED' && c.status !== 'OPEN') && (
                          <button onClick={() => setActiveProgressProject(c.id)} className="text-xs px-2 py-1 border-2 border-black uppercase bg-green-300 hover:bg-green-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                            📈 TINJAU BUKTI KERJA
                          </button>
                        )}

                        {/* TOMBOL CHAT */}
                        {(c.mitra_id && c.status !== 'COMPLETED') && (
                          <button onClick={() => setActiveChatProject(c.id)} className="text-xs px-2 py-1 border-2 border-black uppercase bg-white hover:bg-yellow-300 transition-colors">
                            💬 CHAT REKAN KERJA
                          </button>
                        )}

                        <button onClick={() => setActiveQnA(c.id)} className="text-xs px-2 py-1 border-2 border-black uppercase bg-blue-200 hover:bg-blue-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                          ❓ Q&A PUBLIK
                        </button>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      {!isAlreadySigned && (c.mitra || c.mitra_id) ? (
                          <button 
                            onClick={() => handleSignContract(c.id, c.mitra_name || c.mitra)}
                            disabled={isSigning === c.id}
                            className={`text-white border-2 border-black px-4 py-2 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all ${
                              isSigning === c.id ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isSigning === c.id ? 'MEMPROSES...' : 'SIGN (CLICK-WRAP)'}
                          </button>
                      ) : (c.status === 'COMPLETED' || isDisputed) ? (
                          <button 
                            onClick={() => handleViewPDF(c.id)}
                            className="bg-white text-black border-2 border-black px-4 py-2 hover:bg-gray-200 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            📄 UNDUH PDF (SAH)
                          </button>
                      ) : (
                          <span className="text-gray-400 text-xs italic font-bold">SPK Aktif. Menunggu UAT.</span>
                      )}
                    </td>
                  </tr>

                  {/* PANEL TEKS LOG (CADANGAN JIKA BUKTI KERJA TIDAK CUKUP) */}
                  {isExpanded && (
                    <tr className="bg-gray-800 text-white border-b-4 border-black">
                      <td colSpan="5" className="p-6">
                        <h4 className="text-lg font-black uppercase mb-2 text-yellow-300">JEJAK AUDIT TEXT-LOG MURNI:</h4>
                        <div className="bg-black p-4 border-2 border-yellow-300 font-mono text-sm leading-relaxed mb-4">
                          {c.current_milestone ? (
                            <p> {c.current_milestone}</p>
                          ) : (
                            <p className="text-gray-500 italic">Belum ada progres teks yang dilaporkan oleh Mitra.</p>
                          )}
                        </div>
                        
                        {isWaitingUat && (
                           <div className="flex flex-col sm:flex-row gap-4">
                             <button 
                               onClick={() => handleApproveUAT(c.id)} 
                               disabled={isProcessing}
                               className={`font-black uppercase px-6 py-3 border-2 border-white transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-y-1 ${isProcessing ? 'bg-gray-500 cursor-wait' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                             >
                               ✅ SETUJUI UAT & TERBITKAN BAST
                             </button>
                             <button 
                               onClick={() => handleRejectUAT(c.id)} 
                               disabled={isProcessing}
                               className={`font-black uppercase px-6 py-3 border-2 border-white transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-y-1 ${isProcessing ? 'bg-red-500 cursor-wait' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                             >
                               ❌ TOLAK (AJUKAN SENGKETA)
                             </button>
                           </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs font-bold text-red-600 uppercase">
        *Semua kontrak merujuk pada Pasal 1320 KUHPdt dan UU ITE yang berlaku.
      </p>
    </div>
  );
}