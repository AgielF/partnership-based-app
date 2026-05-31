import React, { useState, useEffect } from 'react';
import { getMitraJobs, getMitraProfile, submitProjectBid } from '../../services/api'; // <-- Ubah import ini
import PublicProfileModal from '../../components/PublicProfileModal'; 
import QnABoardModal from '../../components/QnABoardModal';

export default function MitraJobs() {
  const [activeFilter, setActiveFilter] = useState('SEMUA');
  const [jobList, setJobList] = useState([]);
  const [mitraProfile, setMitraProfile] = useState(null);
  
  const [inspectedClient, setInspectedClient] = useState(null); 
  const [activeQnA, setActiveQnA] = useState(null);
  
  // STATE BARU UNTUK MODAL BIDDING
  const [biddingProject, setBiddingProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mitraId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchData();
  }, [mitraId]);

  const fetchData = async () => {
    if (!mitraId) return;
    try {
      const [jobsData, profileData] = await Promise.all([
        getMitraJobs(),
        getMitraProfile(mitraId)
      ]);
      setJobList(jobsData);
      setMitraProfile(profileData);
    } catch (error) {
      console.error("Gagal menarik data dari server:", error);
    }
  };

  const filteredJobs = activeFilter === 'SEMUA' 
    ? jobList 
    : jobList.filter(job => job.type === activeFilter);

  const filterOptions = ['SEMUA', 'SOFTWARE/WEB', 'IOT/EMBEDDED', 'SERVIS HARDWARE', 'PERENTALAN'];

  // Fungsi saat tombol "KIRIM PROPOSAL" di klik pada modal
  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!biddingProject || !mitraProfile) return;

    if (mitraProfile.kyc_status === 'BANNED') return alert("AKSES DITOLAK: Akun diblokir.");
    if (mitraProfile.kyc_status !== 'VERIFIED') return alert("AKSES DITOLAK: Akun belum diverifikasi.");

    const finalBidAmount = parseFloat(bidAmount);
    if (mitraProfile.projects_completed === 0 && finalBidAmount > 1000000) {
      return alert("⚠️ DITOLAK: Nilai penawaran proyek pertama maksimal Rp 1.000.000.");
    }

    setIsSubmitting(true);
    try {
      await submitProjectBid(biddingProject.id, {
        mitra_id: mitraId,
        bid_amount: finalBidAmount,
        cover_letter: coverLetter
      });
      alert("✅ PROPOSAL TERKIRIM! Klien akan meninjau penawaran Anda.");
      setBiddingProject(null);
      setBidAmount('');
      setCoverLetter('');
      fetchData(); // Refresh data
    } catch (error) {
      alert(`❌ GAGAL: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mitraProfile) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center font-mono">
        <div className="border-4 border-black p-10 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-2xl font-black uppercase">
          ⏳ MENYINKRONKAN DATA SERVER...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black relative">
      
      {/* MODAL BIDDING (PENAWARAN PROYEK) */}
      {biddingProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase text-blue-600">AJUKAN PROPOSAL</h2>
                <p className="text-sm font-bold mt-1 uppercase text-gray-600">ID: {biddingProject.id}</p>
              </div>
              <button onClick={() => setBiddingProject(null)} className="text-4xl font-black hover:text-red-500 leading-none">&times;</button>
            </div>

            <div className="bg-blue-50 border-4 border-black p-4 mb-6">
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">Anggaran Awal Klien:</p>
              <p className="text-xl font-black">{biddingProject.budget}</p>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase mb-2">Penawaran Harga Anda (Rp)</label>
                <input 
                  type="number" 
                  required 
                  min="10000"
                  value={bidAmount} 
                  onChange={(e) => setBidAmount(e.target.value)} 
                  placeholder="Misal: 4500000" 
                  className="w-full border-4 border-black p-4 font-bold uppercase focus:outline-none focus:bg-yellow-50 text-lg transition-colors" 
                />
                <p className="text-xs font-bold text-gray-500 mt-2 uppercase">*Anda bisa menawar lebih tinggi atau lebih rendah dari anggaran awal klien.</p>
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-2">Surat Penawaran / Mengapa Anda Cocok?</label>
                <textarea 
                  rows="5" 
                  required 
                  value={coverLetter} 
                  onChange={(e) => setCoverLetter(e.target.value)} 
                  placeholder="Ceritakan pengalaman Anda yang relevan dengan proyek ini..." 
                  className="w-full border-4 border-black p-4 font-bold focus:outline-none focus:bg-yellow-50 transition-colors"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-black uppercase py-4 border-4 border-black hover:bg-blue-700 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:bg-gray-400 disabled:shadow-none disabled:translate-y-1"
              >
                {isSubmitting ? 'MENGIRIM PROPOSAL...' : 'KIRIM PENAWARAN SEKARANG'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KLIEN & QnA */}
      {inspectedClient && <PublicProfileModal type="client" targetId={inspectedClient} onClose={() => setInspectedClient(null)} />}
      {activeQnA && <QnABoardModal projectId={activeQnA} userId={mitraId} onClose={() => setActiveQnA(null)} />}

      {/* PERINGATAN MASA PROBATION */}
      {mitraProfile.projects_completed < 10 && (
        <div className="border-4 border-black p-4 bg-red-500 text-white font-black uppercase text-sm mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
          🚨 STATUS AKUN: MASA PERCOBAAN (PROYEK SELESAI: {mitraProfile.projects_completed}/10).
          <br/>
          ATURAN: Anda HANYA diizinkan mengerjakan 1 proyek dalam satu waktu. Proyek pertama maksimal senilai Rp 1 JUTA.
        </div>
      )}

      <div className="border-b-8 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">BURSA KERJA</h1>
          <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">AJUKAN PROPOSAL. MENANGKAN PROYEK.</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase border-4 border-black">
          {filteredJobs.length} PROYEK TERSEDIA
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-3 font-black uppercase whitespace-nowrap transition-all border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
              activeFilter === filter ? 'bg-yellow-300 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 pb-12">
        {filteredJobs.length === 0 ? (
           <p className="font-bold border-4 border-black p-4 bg-gray-50 uppercase">TIDAK ADA PEKERJAAN UNTUK KATEGORI {activeFilter}.</p>
        ) : filteredJobs.map((job) => {
          
          const isLockedByKyc = mitraProfile.kyc_status !== 'VERIFIED';
          const isLockedByActiveQuota = mitraProfile.projects_completed < 10 && (mitraProfile.active_projects >= 1);

          return (
            <div key={job.id} className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col justify-between hover:bg-yellow-50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase">{job.type || 'UMUM'}</span>
                  <span className="font-bold text-xs uppercase text-gray-500">ID: {job.id}</span>
                </div>
                <h2 className="text-2xl font-black uppercase leading-tight mb-2">{job.title}</h2>
                
                <div className="font-bold text-sm text-gray-600 uppercase mb-4 flex items-center flex-wrap gap-y-2">
                  <span className="mr-2">KLIEN:</span> 
                  <button 
                    onClick={() => job.client_id ? setInspectedClient(job.client_id) : alert("ID Klien tidak tersedia.")} 
                    className="underline decoration-2 hover:bg-black hover:text-white px-1 transition-colors mr-3"
                  >
                    {job.client || 'KLIEN RAHASIA'} 🔍
                  </button>
                  <button 
                    onClick={() => setActiveQnA(job.id)}
                    className="bg-white text-black border-2 border-black px-2 py-0.5 text-xs hover:bg-blue-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                  >
                    ❓ TANYA PUBLIK (Q&A)
                  </button>
                </div>

                <div className="p-4 border-2 border-black border-dashed bg-gray-50 mb-6">
                  <p className="text-sm font-medium">{job.description}</p>
                </div>
              </div>
              
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(job.tags || []).map(tag => (
                    <span key={tag} className="border-2 border-black px-2 py-1 text-xs font-bold uppercase bg-white">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t-4 border-black pt-4">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500">Anggaran Awal</p>
                    <p className="text-xl font-black tracking-tighter">{job.budget}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-gray-500">Estimasi</p>
                    <p className="text-lg font-bold">{job.deadline}</p>
                  </div>
                </div>
                
                {/* TOMBOL BIDDING BARU */}
                <button 
                  onClick={() => {
                    setBiddingProject(job);
                    setBidAmount(''); // Reset form setiap kali modal dibuka
                    setCoverLetter('');
                  }}
                  disabled={isLockedByKyc || isLockedByActiveQuota}
                  className={`w-full mt-6 border-4 border-black py-4 font-black uppercase transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
                    isLockedByKyc ? 'bg-gray-800 text-white cursor-not-allowed shadow-none active:translate-y-0' :
                    isLockedByActiveQuota ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none active:translate-y-0' : 
                    'bg-green-400 text-black hover:bg-green-500'
                  }`}
                >
                  {isLockedByKyc ? '🔒 MENUNGGU VERIFIKASI KYC' :
                   isLockedByActiveQuota ? '⏳ KUOTA PROYEK AKTIF PENUH' :
                   '📝 AJUKAN PROPOSAL (BID)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}