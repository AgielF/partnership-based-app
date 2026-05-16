import React, { useState, useEffect } from 'react';
import { getMitraJobs } from '../../services/api';

export default function MitraJobs() {
  const [activeFilter, setActiveFilter] = useState('SEMUA');
  const [jobList, setJobList] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getMitraJobs();
        setJobList(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = activeFilter === 'SEMUA' 
    ? jobList 
    : jobList.filter(job => job.tags.includes(activeFilter) || job.type === activeFilter);

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black">
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

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {['SEMUA', 'SOFTWARE / WEB', 'IOT / EMBEDDED', 'SERVIS HARDWARE', 'ONLINE', 'HIBRIDA', 'DROP-OFF'].map((filter) => (
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
           <p className="font-bold border-4 border-black p-4 bg-gray-50">TIDAK ADA PEKERJAAN DITEMUKAN.</p>
        ) : filteredJobs.map((job) => (
          <div key={job.id} className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col justify-between hover:bg-yellow-50 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase">{job.type}</span>
                <span className="font-bold text-xs uppercase text-gray-500">ID: {job.id}</span>
              </div>
              <h2 className="text-2xl font-black uppercase leading-tight mb-2">{job.title}</h2>
              <p className="font-bold text-sm text-gray-600 uppercase mb-4">KLIEN: {job.client}</p>
              <div className="p-4 border-2 border-black border-dashed bg-gray-50 mb-6">
                <p className="text-sm font-medium">{job.description}</p>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags.map(tag => (
                  <span key={tag} className="border-2 border-black px-2 py-1 text-xs font-bold uppercase bg-white">{tag}</span>
                ))}
              </div>
              <div className="flex justify-between items-center border-t-4 border-black pt-4">
                <div>
                  <p className="text-xs font-black uppercase text-gray-500">Nilai Kontrak</p>
                  <p className="text-xl font-black tracking-tighter">{job.budget}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-gray-500">Estimasi</p>
                  <p className="text-lg font-bold">{job.deadline}</p>
                </div>
              </div>
              <button className="w-full mt-6 bg-blue-600 text-white border-4 border-black py-4 font-black uppercase hover:bg-blue-700 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
                AMBIL PROYEK INI
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}