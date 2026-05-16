import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMitraDirectory, getMitraJobs } from '../services/api';

export default function PublicMarketplace() {
  const navigate = useNavigate();
  const [mitras, setMitras] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // Menarik data mitra dan bursa kerja secara bersamaan
        const [mitraData, jobData] = await Promise.all([
          getMitraDirectory(),
          getMitraJobs()
        ]);
        setMitras(mitraData);
        setJobs(jobData);
      } catch (error) {
        console.error("Gagal menarik data publik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-mono border-[16px] border-black flex flex-col">
      
      {/* Header Navigasi Publik */}
      <header className="flex justify-between items-center p-6 border-b-8 border-black bg-yellow-300">
        <h1 
          onClick={() => navigate('/')} 
          className="text-3xl font-extrabold uppercase tracking-tighter cursor-pointer hover:underline"
        >
          E-TECHHUB
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase hidden md:block bg-white border-2 border-black px-3 py-1">
            MODE AKSES PUBLIK
          </span>
          <button 
            onClick={() => navigate('/login')}
            className="bg-black text-white px-6 py-2 text-sm font-black uppercase hover:bg-neutral-800 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            LOGIN / DAFTAR
          </button>
        </div>
      </header>

      {/* Area Konten Utama */}
      <div className="flex-1 p-6 md:p-10 bg-gray-50">
        <div className="mb-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            EKSPLORASI O2O
          </h2>
          <p className="text-sm md:text-base font-bold uppercase mt-4 text-gray-600 max-w-2xl mx-auto">
            Lihat daftar mitra profesional kami atau intip proyek-proyek yang sedang mencari talenta. Masuk ke sistem untuk berinteraksi.
          </p>
        </div>

        {loading ? (
          <div className="text-center p-20 font-black text-2xl uppercase animate-pulse">
            MEMUAT DATA DARI SERVER...
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            
            {/* KOLOM KIRI: DIREKTORI MITRA */}
            <div>
              <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex justify-between items-end">
                <span>DIREKTORI MITRA</span>
                <span className="text-sm bg-black text-white px-2 py-1">{mitras.length} TERDAFTAR</span>
              </h3>
              
              <div className="space-y-6">
                {mitras.length === 0 ? (
                  <p className="font-bold border-4 border-black p-4 bg-white">TIDAK ADA MITRA.</p>
                ) : mitras.map((mitra) => (
                  <div key={mitra.id} className="border-4 border-black p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-black uppercase">{mitra.name}</h4>
                      <span className="font-black bg-yellow-300 border-2 border-black px-2">⭐ {mitra.rating}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-600 uppercase mb-3">{mitra.role}</p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {mitra.tags.map(tag => (
                        <span key={tag} className="border-2 border-black px-2 py-1 text-xs font-bold uppercase bg-gray-100">{tag}</span>
                      ))}
                    </div>
                    <div className="border-t-4 border-black pt-4">
                      <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-white text-black border-4 border-black py-2 font-black uppercase hover:bg-black hover:text-white transition"
                      >
                        LOGIN UNTUK MENYEWA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KOLOM KANAN: BURSA KERJA / PROYEK TERBUKA */}
            <div>
              <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex justify-between items-end">
                <span>PROYEK TERBUKA</span>
                <span className="text-sm bg-blue-600 text-white px-2 py-1">{jobs.length} LOWONGAN</span>
              </h3>
              
              <div className="space-y-6">
                {jobs.length === 0 ? (
                  <p className="font-bold border-4 border-black p-4 bg-white">TIDAK ADA PROYEK TERSEDIA.</p>
                ) : jobs.map((job) => (
                  <div key={job.id} className="border-4 border-black p-5 bg-blue-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase">{job.type}</span>
                      <span className="font-bold text-xs uppercase text-gray-500">ID: {job.id}</span>
                    </div>
                    <h4 className="text-xl font-black uppercase leading-tight mb-2">{job.title}</h4>
                    <p className="font-bold text-xs text-gray-600 uppercase mb-4">KLIEN: MENGHARUSKAN LOGIN</p>
                    
                    <div className="flex justify-between items-center border-t-4 border-black pt-4 mt-4">
                      <div>
                        <p className="text-xs font-black uppercase text-gray-500">Nilai Kontrak</p>
                        <p className="text-lg font-black tracking-tighter">{job.budget}</p>
                      </div>
                      <button 
                        onClick={() => navigate('/login')}
                        className="bg-blue-600 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-blue-700 transition"
                      >
                        AMBIL PROYEK
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}