import React, { useState, useEffect } from 'react';
import { getMitraProjects, getMitraWallet, signMitraContract, updateMitraProgress } from '../../services/api';

// IMPORT MODAL
import ChatModal from '../../components/ChatModal';
import ProgressModal from '../../components/ProgressModal'; 

export default function MitraWorkspace() {
  const [activeProjects, setActiveProjects] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, escrow_balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const [progressInputs, setProgressInputs] = useState({}); 
  
  // STATE MODAL
  const [activeChat, setActiveChat] = useState(null);
  const [activeProgress, setActiveProgress] = useState(null);

  const mitraId = localStorage.getItem('user_id');

  const fetchData = async () => {
    if (!mitraId) return;
    setIsLoading(true);
    try {
      const [projectsData, walletData] = await Promise.all([
        getMitraProjects(mitraId),
        getMitraWallet(mitraId)
      ]);
      
      // Filter proyek berjalan, menunggu tanda tangan (belum ada milestone persetujuan), dan sengketa
      const ongoing = projectsData.filter(p => 
        ['SEDANG DIKERJAKAN', 'MENUNGGU UAT', 'DISPUTED'].includes(p.status) || 
        (p.status === 'OPEN' && p.mitra_id === mitraId) // Kasus ekstrem jika masih berstatus OPEN tapi sudah ada Mitra
      );
      
      setActiveProjects(ongoing);
      setWallet(walletData);
    } catch (error) {
      console.error("Gagal menarik data workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mitraId]);

  const handleSignContract = async (projectId, clientId) => {
    const legalWarning = `PERINGATAN HUKUM (CLICK-WRAP AGREEMENT):\n\nDengan menekan OK, Anda mengikatkan diri secara hukum untuk menyelesaikan Proyek ID: ${projectId} milik Klien (${clientId}) sesuai tenggat waktu dan anggaran yang disepakati (Pasal 1320 KUHPerdata).\n\nApakah Anda siap mengesahkan dokumen SPK ini?`;
    
    if (window.confirm(legalWarning)) {
      setIsProcessing(projectId);
      try {
        await signMitraContract(projectId, mitraId);
        alert("SAH SECARA HUKUM: SPK telah ditandatangani secara digital. Ruang kerja progres kini terbuka!");
        fetchData(); 
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const handleSubmitProgress = async (projectId) => {
    const textToSubmit = progressInputs[projectId];

    if (!textToSubmit || textToSubmit.trim() === '') {
        return alert("Teks progres tidak boleh kosong!");
    }

    setIsProcessing(projectId);
    try {
      await updateMitraProgress(projectId, mitraId, textToSubmit);
      alert("LOG TEKS PROGRES BERHASIL DICATAT!");
      setProgressInputs(prev => ({ ...prev, [projectId]: '' }));
      fetchData(); 
    } catch (error) {
      alert(`GAGAL: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black relative">
      
      {/* MODAL CHAT */}
      {activeChat && (
        <ChatModal 
          roomId={`PROJ-${activeChat}`} 
          userId={mitraId} 
          onClose={() => setActiveChat(null)} 
        />
      )}

      {/* MODAL PROGRESS (WORKSPACE DELIVERABLES) */}
      {activeProgress && (
        <ProgressModal 
          projectId={activeProgress} 
          userRole="mitra" 
          onClose={() => {
            setActiveProgress(null);
            fetchData();
          }} 
        />
      )}

      <header className="border-b-8 border-black pb-6 mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">RUANG KERJA</h1>
          <p className="text-sm font-bold text-gray-600 uppercase mt-2">LEGALITAS SPK & PUSAT PENGIRIMAN BUKTI KERJA</p>
        </div>
        
        {/* RINGKASAN DOMPET MITRA */}
        <div className="bg-green-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-right min-w-[250px]">
          <p className="text-xs font-black uppercase mb-1">Saldo Pendapatan Anda</p>
          <p className="text-3xl font-black tracking-tighter">Rp {wallet.balance.toLocaleString('id-ID')}</p>
        </div>
      </header>

      <div>
        <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-4">
          <span className="bg-black text-white px-3 py-1">{activeProjects.length}</span> KONTRAK AKTIF
        </h2>

        {isLoading ? (
          <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-xl text-center animate-pulse">
            ⏳ MEMUAT RUANG KERJA...
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="border-4 border-black border-dashed p-10 bg-gray-50 text-center">
            <p className="font-black text-2xl text-gray-500 uppercase mb-2">TIDAK ADA PROYEK AKTIF.</p>
            <p className="font-bold text-sm text-gray-400">Silakan kunjungi Bursa Kerja untuk mencari dan melamar proyek baru.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {activeProjects.map((project) => {
              
              const isAlreadySigned = project.current_milestone?.includes('disetujui Mitra') || project.current_milestone?.includes('Kontrak resmi dimulai') || project.status === 'MENUNGGU UAT' || project.status === 'COMPLETED';
              const isWaitingUat = project.status === 'MENUNGGU UAT';
              const isDisputed = project.status === 'DISPUTED';

              return (
                <div key={project.id} className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                  
                  {/* HEADER KARTU */}
                  <div className={`p-6 border-b-4 border-black ${isAlreadySigned ? 'bg-yellow-300' : 'bg-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black uppercase leading-tight">{project.title}</h3>
                      <span className={`px-2 py-1 text-xs font-black uppercase border-2 border-black whitespace-nowrap ml-4 ${
                        isWaitingUat ? 'bg-yellow-400 animate-pulse' : 
                        isDisputed ? 'bg-red-400' : 'bg-white'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 uppercase">KLIEN ID: {project.client_id} | TIPE: {project.service_type}</p>
                  </div>

                  {/* INFO KARTU */}
                  <div className="p-6 bg-gray-50 flex-grow">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs font-black uppercase text-gray-500">Nilai Kontrak</p>
                        <p className="text-xl font-black tracking-tighter text-blue-700">Rp {project.budget.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black uppercase text-gray-500">Tenggat Waktu</p>
                        <p className="text-lg font-bold">{project.deadline_days} HARI</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-black uppercase text-gray-500 mb-1">Jejak Log Terakhir:</p>
                      <div className="bg-black text-white font-mono text-xs p-3 border-2 border-black">
                        {project.current_milestone || "> Menunggu Tanda Tangan SPK..."}
                      </div>
                    </div>

                    {/* INPUT LOG MANUAL (JIKA SUDAH SIGN) */}
                    {isAlreadySigned && !isWaitingUat && !isDisputed && (
                      <div className="border-t-2 border-dashed border-gray-400 pt-4">
                        <textarea 
                          value={progressInputs[project.id] || ''}
                          onChange={(e) => setProgressInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                          placeholder="Ketik catatan cepat/log manual di sini..."
                          className="w-full border-2 border-black p-2 text-xs font-bold resize-none h-12 focus:outline-none mb-2"
                        ></textarea>
                        <button 
                          onClick={() => handleSubmitProgress(project.id)}
                          disabled={isProcessing === project.id}
                          className="w-full bg-white text-black border-2 border-black py-1 font-black text-xs uppercase hover:bg-gray-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 disabled:bg-gray-300"
                        >
                          {isProcessing === project.id ? 'MENGIRIM...' : 'KIRIM LOG MANUAL'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AREA TOMBOL AKSI UTAMA */}
                  <div className="p-6 pt-0 bg-gray-50 flex flex-col sm:flex-row gap-4 mt-auto">
                    
                    {!isAlreadySigned ? (
                      <button 
                        onClick={() => handleSignContract(project.id, project.client_id)}
                        disabled={isProcessing === project.id}
                        className="w-full bg-blue-600 text-white border-4 border-black py-4 font-black uppercase hover:bg-blue-700 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:bg-gray-400"
                      >
                        {isProcessing === project.id ? 'MEMPROSES...' : '✍️ SIGN E-CONTRACT'}
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setActiveChat(project.id)}
                          className="flex-1 bg-white text-black border-4 border-black py-3 font-black uppercase hover:bg-yellow-300 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                        >
                          💬 CHAT KLIEN
                        </button>
                        
                        <button 
                          onClick={() => setActiveProgress(project.id)}
                          disabled={isDisputed || isWaitingUat}
                          className="flex-1 bg-green-400 text-black border-4 border-black py-3 font-black uppercase hover:bg-green-500 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:bg-gray-400 disabled:shadow-none disabled:translate-y-1"
                        >
                          {isWaitingUat ? '🔒 UAT TERKUNCI' : '📤 BUKA WORKSPACE'}
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}