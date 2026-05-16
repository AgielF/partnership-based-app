import React, { useState, useEffect } from 'react';
import { getMitraProjects } from '../../services/api';

export default function MitraProjects() {
  const [projects, setProjects] = useState([]);
  const mitraId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!mitraId) return;
      try {
        const data = await getMitraProjects(mitraId);
        setProjects(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProjects();
  }, [mitraId]);

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">PROYEK & KONTRAK</h1>
          <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">
            MANAJEMEN SPK & PENGAJUAN UAT
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {projects.length === 0 ? (
           <p className="font-bold border-4 border-black p-4 bg-gray-50">ANDA BELUM MENGAMBIL PROYEK APAPUN.</p>
        ) : projects.map((project) => (
          <div key={project.id} className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row">
            <div className="p-6 flex-1 border-b-4 md:border-b-0 md:border-r-4 border-black">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black uppercase leading-tight">{project.title}</h3>
                <span className={`px-3 py-1 text-xs font-black uppercase border-4 border-black ${project.status.includes('UAT') ? 'bg-yellow-300' : 'bg-white'}`}>
                  {project.status}
                </span>
              </div>
              <p className="font-bold text-sm uppercase text-gray-600 mb-6">KLIEN: {project.client} | ID: {project.id}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-gray-500">Nilai Kontrak</p>
                  <p className="text-lg font-black">{project.budget}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-gray-500">Tenggat Waktu</p>
                  <p className="text-lg font-bold text-red-600">{project.deadline}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 w-full md:w-1/3 flex flex-col justify-center">
              <p className="text-xs font-black uppercase mb-2">TARGET MILESTONE SAAT INI:</p>
              <div className="bg-white border-2 border-black p-3 font-bold text-sm mb-4">
                {project.description || "Tahap Implementasi"}
              </div>
              
              {project.status === 'SEDANG DIKERJAKAN' ? (
                <button className="w-full bg-blue-600 text-white border-4 border-black py-4 font-black uppercase hover:bg-blue-700 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
                  AJUKAN VALIDASI UAT
                </button>
              ) : (
                <button disabled className="w-full bg-gray-300 text-gray-500 border-4 border-black py-4 font-black uppercase cursor-not-allowed">
                  MENUNGGU KLIEN...
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}