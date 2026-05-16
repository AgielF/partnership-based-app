import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black font-mono border-[16px] border-black flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-8 border-black bg-blue-600 text-white">
        <h1 
          onClick={() => navigate('/')} 
          className="text-3xl font-extrabold uppercase tracking-tighter cursor-pointer hover:underline decoration-4 underline-offset-4"
        >
          E-TECHHUB
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-black border-4 border-black px-6 py-2 text-sm font-black uppercase hover:bg-gray-200 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
        >
          KEMBALI KE BERANDA
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-16 bg-gray-50 flex flex-col items-center">
        
        <div className="max-w-4xl w-full">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 text-center border-b-8 border-black pb-4">
            MANIFESTO SISTEM
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* Kartu 1: Tentang Platform */}
            <div className="border-4 border-black p-8 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">O2O IT PLATFORM</h3>
              <p className="font-bold text-sm leading-relaxed">
                E-TechHub bukan sekadar bursa kerja biasa. Ini adalah ekosistem Online-to-Offline (O2O) yang dirancang untuk memecahkan masalah kepercayaan dalam transaksi layanan IT. 
                <br/><br/>
                Mulai dari pengembangan perangkat lunak jarak jauh, riset teknologi BCI, hingga reparasi perangkat keras secara fisik di Drop-off Center. Semua dilindungi oleh sistem Escrow (Rekber) dan E-Contract yang mengikat secara otomatis.
              </p>
            </div>

            {/* Kartu 2: Identitas Developer */}
            <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
              <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">PENGEMBANG UTAMA</h3>
              <div className="space-y-3 font-bold text-sm uppercase">
                <p className="flex justify-between border-b-2 border-black border-dashed pb-1">
                  <span className="text-gray-500">NAMA</span>
                  <span>Agiel Fernanda Putra</span>
                </p>
                <p className="flex justify-between border-b-2 border-black border-dashed pb-1">
                  <span className="text-gray-500">NRP</span>
                  <span>152022032</span>
                </p>
                <p className="flex justify-between border-b-2 border-black border-dashed pb-1">
                  <span className="text-gray-500">INSTITUSI</span>
                  <span className="text-right">Informatika ITENAS<br/>Bandung</span>
                </p>
                <p className="flex justify-between pt-1">
                  <span className="text-gray-500">FOKUS</span>
                  <span className="text-right">Fullstack Dev &<br/>Cloud Infrastructure</span>
                </p>
              </div>
            </div>

          </div>

          {/* Kartu 3: Tech Stack */}
          <div className="border-4 border-black p-8 bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">ARSITEKTUR TEKNOLOGI</h3>
            <div className="flex flex-wrap gap-4">
              {['React.js', 'Tailwind CSS', 'FastAPI', 'Python', 'MySQL', 'Docker', 'Google Cloud Platform', 'Ubuntu Linux'].map(tech => (
                <span key={tech} className="bg-black text-white px-4 py-2 font-black uppercase text-sm border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  {tech}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm font-bold">
              Sistem ini dibangun dengan pendekatan arsitektur *Monolith*, memisahkan lapisan UI dan API secara tegas, serta mengedepankan desain antarmuka bergaya Brutalist yang transparan, fungsional, dan tanpa basa-basi.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm font-bold uppercase border-t-8 border-black bg-white">
        <p>E-TECHHUB © 2026 - INSTITUT TEKNOLOGI NASIONAL BANDUNG</p>
      </footer>
    </div>
  );
}