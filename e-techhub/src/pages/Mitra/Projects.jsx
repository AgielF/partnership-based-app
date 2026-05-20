import React, { useState, useEffect } from 'react';
import { getMitraProjects, signMitraContract, updateMitraProgress } from '../../services/api';
// IMPORT PROGRESS MODAL
import ProgressModal from '../../components/ProgressModal';

export default function MitraProjects() {
  const [projects, setProjects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(null);
  const [progressInputs, setProgressInputs] = useState({}); 
  
  // STATE UNTUK PROGRESS MODAL
  const [activeProgressProject, setActiveProgressProject] = useState(null);
  
  const mitraId = localStorage.getItem('user_id');

  const fetchProjects = async () => {
    if (!mitraId) return;
    try {
      const data = await getMitraProjects(mitraId);
      setProjects(data);
    } catch (error) {
      console.error("Gagal menarik data proyek:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [mitraId]);

  const handleSignContract = async (projectId, clientName) => {
    const legalWarning = `PERINGATAN HUKUM (CLICK-WRAP AGREEMENT):\n\nDengan menekan OK, Anda mengikatkan diri secara hukum untuk menyelesaikan Proyek ID: ${projectId} milik Klien (${clientName}) sesuai tenggat waktu dan anggaran yang disepakati (Pasal 1320 KUHPerdata).\n\nApakah Anda siap mengesahkan dokumen SPK ini?`;
    
    if (window.confirm(legalWarning)) {
      setIsProcessing(projectId);
      try {
        await signMitraContract(projectId, mitraId);
        alert("SAH SECARA HUKUM: SPK telah ditandatangani secara digital. Form pelaporan progres kini terbuka!");
        fetchProjects(); 
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const handleSubmitProgress = async (projectId, isUat = false) => {
    const textToSubmit = isUat 
        ? "PENGERJAAN SELESAI. MENGAJUKAN UAT / PENINJAUAN AKHIR KEPADA KLIEN." 
        : progressInputs[projectId];

    if (!textToSubmit || textToSubmit.trim() === '') {
        return alert("Teks progres tidak boleh kosong!");
    }

    if (isUat && !window.confirm("YAKIN AJUKAN UAT SECARA MANUAL? Status proyek akan terkunci. Disarankan mengajukan UAT melalui penyerahan TAHAP 3 di dalam panel BUKTI KERJA (MILESTONES).")) {
        return;
    }

    setIsProcessing(projectId);
    try {
      await updateMitraProgress(projectId, mitraId, textToSubmit);
      alert(isUat ? "PENGAJUAN UAT MANUAL BERHASIL TERKIRIM!" : "LOG TEKS PROGRES BERHASIL DICATAT!");
      
      setProgressInputs(prev => ({ ...prev, [projectId]: '' }));
      fetchProjects(); 
    } catch (error) {
      alert(`GAGAL: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleInputChange = (projectId, text) => {
    setProgressInputs(prev => ({ ...prev, [projectId]: text }));
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black relative">
      
      {/* TAMPILKAN MODAL PELACAK PROGRES TINGKAT INDUSTRI */}
      {activeProgressProject && (
        <ProgressModal 
          projectId={activeProgressProject} 
          userRole="mitra" // Penting: Memberitahu modal bahwa ini adalah Mitra (Bisa Submit Link Bukti Kerja)
          onClose={() => {
              setActiveProgressProject(null);
              fetchProjects(); // Refresh UI jika ada milestone baru yang dikirim
          }} 
        />
      )}

      <div className="border-b-8 border-black pb-6 mb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter">RUANG KERJA (SPK)</h1>
        <p className="text-sm font-bold text-gray-600 uppercase mt-2">LEGALITAS DOKUMEN & PENYERAHAN BUKTI KERJA MILESTONE</p>
      </div>

      <div className="space-y-8">
        {projects.length === 0 ? (
          <div className="border-4 border-black p-10 bg-gray-50 text-center font-black uppercase text-2xl">
            TIDAK ADA PROYEK AKTIF DI RUANG KERJA ANDA.
          </div>
        ) : projects.map((p) => {
          
          const isAlreadySigned = p.current_milestone?.includes('disetujui Mitra') || p.status === 'MENUNGGU UAT' || p.status === 'COMPLETED' || p.status === 'SEDANG DIKERJAKAN';
          const isWaitingUat = p.status === 'MENUNGGU UAT';
          const isCompleted = p.status === 'COMPLETED';

          return (
            <div key={p.id} className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row">
              
              {/* BAGIAN KIRI: INFORMASI PROYEK */}
              <div className="md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-black p-6 bg-yellow-300 flex flex-col justify-between">
                <div>
                  <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase inline-block mb-4">
                    {p.service_type || 'UMUM'}
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">{p.title}</h2>
                  <p className="font-bold text-sm text-gray-800 uppercase mb-4">ID: {p.id}</p>
                  
                  <div className="space-y-2 text-sm font-bold border-t-4 border-black pt-4">
                    <p>KLIEN: <span className="font-black">{p.client_id || 'RAHASIA'}</span></p>
                    <p>NILAI: <span className="font-black text-xl">Rp {(p.budget || 0).toLocaleString('id-ID')}</span></p>
                    <p>DEADLINE: <span className="font-black">{p.deadline_days || '-'} HARI</span></p>
                  </div>
                </div>
              </div>

              {/* BAGIAN KANAN: KENDALI WORKSPACE (SIGN & PROGRESS) */}
              <div className="md:w-2/3 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4">
                     <h3 className="text-lg font-black uppercase">STATUS LINI MASA PENGADAAN</h3>
                     
                     {/* ==========================================
                         TOMBOL BARU: BUKA MODAL PENYERAHAN BUKTI
                         Hanya muncul jika kontrak sudah ditandatangani
                         ========================================== */}
                     {isAlreadySigned && !isCompleted && (
                         <button 
                           onClick={() => setActiveProgressProject(p.id)}
                           className="bg-green-300 text-black border-4 border-black px-4 py-1 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-1 active:shadow-none"
                         >
                           📤 UNGGAH BUKTI KERJA (MILESTONES)
                         </button>
                     )}
                  </div>

                  <div className={`p-4 border-4 border-black font-bold text-sm uppercase mb-6 ${isCompleted ? 'bg-green-300' : isWaitingUat ? 'bg-blue-300' : 'bg-gray-100'}`}>
                     JEJAK AUDIT TEXT-LOG TERAKHIR: <br/> 
                     <span className="text-lg font-black mt-1 block">{p.current_milestone || "MENUNGGU PERSETUJUAN"}</span>
                  </div>
                </div>

                {/* AREA AKSI DINAMIS BERDASARKAN STATUS */}
                <div className="mt-auto">
                  
                  {/* KONDISI 1: BELUM SIGN KONTRAK */}
                  {!isAlreadySigned && !isCompleted && (
                    <div className="bg-gray-50 border-4 border-black border-dashed p-4 text-center">
                      <p className="text-sm font-bold uppercase mb-4 text-red-600">
                        ⚠️ Anda belum bisa mengakses Milestone pengerjaan sebelum kontrak hukum disetujui.
                      </p>
                      <button 
                        onClick={() => handleSignContract(p.id, p.client_id)}
                        disabled={isProcessing === p.id}
                        className={`w-full text-white border-4 border-black py-4 font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
                          isProcessing === p.id ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isProcessing === p.id ? 'MEMPROSES LEGALITAS...' : '✍️ SIGN E-CONTRACT (CLICK-WRAP)'}
                      </button>
                    </div>
                  )}

                  {/* KONDISI 2: SUDAH SIGN, SEDANG DIKERJAKAN */}
                  {isAlreadySigned && !isWaitingUat && !isCompleted && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-2">UPDATE LOG TEKS MANUAL (OPSIONAL):</label>
                        <textarea 
                          value={progressInputs[p.id] || ''}
                          onChange={(e) => handleInputChange(p.id, e.target.value)}
                          placeholder="Ketik progres singkat jika Anda tidak mengunggah file bukti di panel Milestone..."
                          className="w-full border-4 border-black p-3 font-bold h-16 resize-none"
                        ></textarea>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => handleSubmitProgress(p.id, false)}
                          disabled={isProcessing === p.id}
                          className="sm:w-1/2 bg-white text-black border-4 border-black py-3 font-black uppercase hover:bg-yellow-300 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                        >
                          {isProcessing === p.id ? 'MENGIRIM...' : '📝 KIRM LOG TEKS SAJA'}
                        </button>
                        
                        <button 
                          onClick={() => handleSubmitProgress(p.id, true)}
                          disabled={isProcessing === p.id}
                          className="sm:w-1/2 bg-black text-white border-4 border-black py-3 font-black uppercase hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                        >
                          {isProcessing === p.id ? 'MEMPROSES...' : '🚀 PAKSA AJUKAN UAT MANUAL'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KONDISI 3: MENUNGGU UAT ATAU SELESAI (FORM DIKUNCI) */}
                  {(isWaitingUat || isCompleted) && (
                    <div className="flex flex-col sm:flex-row gap-4">
                       <button disabled className="w-full bg-gray-300 text-gray-600 border-4 border-black py-4 font-black uppercase cursor-not-allowed">
                          🔒 {isCompleted ? 'PROYEK TELAH SELESAI' : 'MENUNGGU VALIDASI UAT KLIEN'}
                       </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}