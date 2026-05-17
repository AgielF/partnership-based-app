import React, { useState, useEffect } from 'react';
import { getMitraJobs, getMitraProfile, takeMitraProject } from '../../services/api';

export default function MitraJobs() {
  const [activeFilter, setActiveFilter] = useState('SEMUA');
  const [jobList, setJobList] = useState([]);
  
  // State profil akan kosong/null sebelum data dari database tiba
  const [mitraProfile, setMitraProfile] = useState(null);
  
  const mitraId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!mitraId) return;
      try {
        // Tarik data bursa kerja dan profil database secara paralel (bersamaan) agar lebih cepat
        const [jobsData, profileData] = await Promise.all([
          getMitraJobs(),
          getMitraProfile(mitraId)
        ]);
        
        setJobList(jobsData);
        setMitraProfile(profileData); // Data murni dari MySQL masuk ke sini!

      } catch (error) {
        console.error("Gagal menarik data dari server:", error);
      }
    };
    fetchData();
  }, [mitraId]);

  // LOGIKA FILTER
  const filteredJobs = activeFilter === 'SEMUA' 
    ? jobList 
    : jobList.filter(job => job.type === activeFilter);

  const filterOptions = [
    'SEMUA', 
    'SOFTWARE/WEB', 
    'IOT/EMBEDDED', 
    'SERVIS HARDWARE', 
    'PERENTALAN'
  ];

  // FUNGSI PENGAMBILAN PEKERJAAN KE DATABASE
  const handleTakeJob = async (projectId, budgetAmount) => {
    if (!mitraProfile) return alert("Sistem masih memuat data profil Anda.");

    // Validasi Frontend Dasar
    if (mitraProfile.kyc_status === 'BANNED') {
        return alert("AKSES DITOLAK: Akun Anda telah diblokir permanen.");
    }
    if (mitraProfile.kyc_status !== 'VERIFIED') {
        return alert("AKSES DITOLAK: Akun Anda belum diverifikasi oleh Admin. Silakan selesaikan proses KYC terlebih dahulu.");
    }

    if (mitraProfile.projects_completed === 0 && budgetAmount > 1000000) {
      return alert("⚠️ DITOLAK: Untuk proyek pertama Anda, dilarang mengambil kontrak dengan nilai di atas Rp 1.000.000.");
    }

    // Eksekusi API
    if (window.confirm("Apakah Anda yakin ingin mengambil kontrak proyek ini? Pastikan Anda sanggup menyelesaikannya tepat waktu.")) {
      try {
        await takeMitraProject(projectId, mitraId); 
        
        alert("SUKSES: Pekerjaan resmi ditambahkan ke ruang kerja Anda! Segera cek Dasbor Proyek.");
        
        // Refresh daftar pekerjaan & profil agar UI langsung mengunci tombol lain
        const [updatedJobs, updatedProfile] = await Promise.all([
          getMitraJobs(),
          getMitraProfile(mitraId)
        ]);
        
        setJobList(updatedJobs);
        setMitraProfile(updatedProfile);
      } catch (error) {
        alert(`GAGAL: ${error.message}`);
      }
    }
  };

  // Tampilkan layar loading brutalist jika data database belum tiba
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
    <div className="min-h-screen bg-white p-8 font-mono text-black">
      
      {/* BANNER INDIKATOR MASA PERCOBAAN (PROBATION) */}
      {mitraProfile.projects_completed < 10 && (
        <div className="border-4 border-black p-4 bg-red-500 text-white font-black uppercase text-sm mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
          🚨 STATUS AKUN: MASA PERCOBAAN (PROYEK SELESAI: {mitraProfile.projects_completed}/10).
          <br/>
          ATURAN: Anda HANYA diizinkan mengerjakan 1 proyek dalam satu waktu. Proyek pertama maksimal senilai Rp 1 JUTA. Mendapatkan ulasan bintang 1 pada masa percobaan akan mengakibatkan pemblokiran akun permanen.
        </div>
      )}

      <div className="border-b-8 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">BURSA KERJA</h1>
          <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">
            TEMUKAN PROYEK. SELESAIKAN. DAPATKAN BAYARAN.
          </p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase border-4 border-black">
          {filteredJobs.length} PROYEK TERSEDIA
        </div>
      </div>

      {/* RENDER TOMBOL FILTER */}
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
           <p className="font-bold border-4 border-black p-4 bg-gray-50 uppercase">
             TIDAK ADA PEKERJAAN UNTUK KATEGORI {activeFilter}.
           </p>
        ) : filteredJobs.map((job) => {
          
          // KALKULASI PENGUNCIAN TOMBOL BERDASARKAN DATABASE ASLI
          const numericBudget = typeof job.budget === 'number' 
            ? job.budget 
            : Number(job.budget?.replace(/[^0-9.-]+/g, "")) || 0;

          // 1. Terkunci jika proyek pertama > Rp 1 juta
          const isLockedByFirstJobBudget = mitraProfile.projects_completed === 0 && numericBudget > 1000000;
          
          // 2. Terkunci jika status belum VERIFIED
          const isLockedByKyc = mitraProfile.kyc_status !== 'VERIFIED';

          // 3. Terkunci jika masih masa percobaan (< 10) DAN sudah punya >= 1 proyek berjalan
          const isLockedByActiveQuota = mitraProfile.projects_completed < 10 && (mitraProfile.active_projects >= 1);

          return (
            <div key={job.id} className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col justify-between hover:bg-yellow-50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase">
                    {job.type || 'UMUM'}
                  </span>
                  <span className="font-bold text-xs uppercase text-gray-500">ID: {job.id}</span>
                </div>
                <h2 className="text-2xl font-black uppercase leading-tight mb-2">{job.title}</h2>
                <p className="font-bold text-sm text-gray-600 uppercase mb-4">
                  KLIEN: {job.client || 'KLIEN RAHASIA'}
                </p>
                <div className="p-4 border-2 border-black border-dashed bg-gray-50 mb-6">
                  <p className="text-sm font-medium">{job.description}</p>
                </div>
              </div>
              
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(job.tags || []).map(tag => (
                    <span key={tag} className="border-2 border-black px-2 py-1 text-xs font-bold uppercase bg-white">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t-4 border-black pt-4">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500">Nilai Kontrak</p>
                    <p className="text-xl font-black tracking-tighter">
                      {typeof job.budget === 'number' ? `Rp ${job.budget.toLocaleString('id-ID')}` : job.budget}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-gray-500">Estimasi</p>
                    <p className="text-lg font-bold">
                      {typeof job.deadline === 'number' ? `${job.deadline} HARI` : job.deadline}
                    </p>
                  </div>
                </div>
                
                {/* TOMBOL PENGAMBILAN BERDASARKAN DATABASE */}
                <button 
                  onClick={() => handleTakeJob(job.id, numericBudget)}
                  disabled={isLockedByFirstJobBudget || isLockedByKyc || isLockedByActiveQuota}
                  className={`w-full mt-6 border-4 border-black py-4 font-black uppercase transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
                    isLockedByKyc ? 'bg-gray-800 text-white cursor-not-allowed shadow-none active:translate-y-0' :
                    (isLockedByFirstJobBudget || isLockedByActiveQuota) ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none active:translate-y-0' : 
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLockedByKyc ? '🔒 MENUNGGU VERIFIKASI KYC' :
                   isLockedByActiveQuota ? '⏳ KUOTA PROYEK AKTIF PENUH' :
                   isLockedByFirstJobBudget ? '❌ BUDGET MELEBIHI BATAS PERCOBAAN' : 
                   'AMBIL PROYEK INI'}
                </button>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}