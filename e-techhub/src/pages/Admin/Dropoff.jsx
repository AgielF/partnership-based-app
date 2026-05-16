import React, { useState, useEffect } from 'react';
import { getPhysicalProjects, receiveDropOffDevice, setProjectToUAT, executeBAST } from '../../services/api';

export default function AdminDropOff() {
  const [projects, setProjects] = useState([]);
  
  // State Form Penerimaan Perangkat
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');

  const fetchProjects = async () => {
    try {
      const data = await getPhysicalProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleReceiveDevice = async (e) => {
    e.preventDefault();
    try {
      await receiveDropOffDevice({
        client_id: clientId,
        title: `[FISIK] ${title}`,
        description,
        budget: parseFloat(budget)
      });
      alert('TANDA TERIMA TERCETAK. Proyek masuk ke Bursa Kerja Hardware.');
      setClientId(''); setTitle(''); setDescription(''); setBudget('');
      fetchProjects();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAction = async (project) => {
    try {
      if (project.status === 'SEDANG DIKERJAKAN') {
        if (window.confirm('Mitra sudah mendemokan perangkat? Lanjutkan ke tahap Peninjauan Akhir (UAT)?')) {
          await setProjectToUAT(project.id);
          alert('Status diubah ke UAT. Silakan panggil Klien ke loket.');
          fetchProjects();
        }
      } else if (project.status === 'MENUNGGU UAT') {
        if (window.confirm('Klien menyetujui hasil? Eksekusi BAST dan lepaskan dana Escrow ke Mitra?')) {
          await executeBAST(project.id);
          alert('BAST Tereksekusi. Perangkat bisa diserahkan ke Klien.');
          fetchProjects();
        }
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">DROP-OFF CENTER</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">LOKET SERAH TERIMA & EKSEKUSI BAST</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: FORM PENERIMAAN PERANGKAT (SKENARIO 2) */}
        <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit">
          <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">PENERIMAAN BARANG BARU</h2>
          <form onSubmit={handleReceiveDevice} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">ID Klien</label>
              <input required value={clientId} onChange={(e)=>setClientId(e.target.value.toUpperCase())} placeholder="USER-XYZ" className="w-full border-4 border-black p-2 font-bold uppercase focus:outline-none bg-white" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Perangkat</label>
              <input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="LAPTOP LENOVO MATI TOTAL" className="w-full border-4 border-black p-2 font-bold uppercase focus:outline-none bg-white" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Diagnosa / Keluhan</label>
              <textarea required value={description} onChange={(e)=>setDescription(e.target.value)} rows="3" className="w-full border-4 border-black p-2 font-bold uppercase focus:outline-none bg-white"></textarea>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nilai Taksiran / Escrow (Rp)</label>
              <input type="number" required value={budget} onChange={(e)=>setBudget(e.target.value)} placeholder="500000" className="w-full border-4 border-black p-2 font-bold uppercase focus:outline-none bg-white" />
            </div>
            <button type="submit" className="w-full bg-black text-white border-4 border-black py-3 font-black uppercase hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none mt-2">
              TERBITKAN SPK FISIK
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: DAFTAR PROYEK FISIK (SKENARIO 3 & 4) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2">ANTREAN PERANGKAT DI LOKET</h2>
          
          {projects.length === 0 ? (
            <p className="font-bold border-4 border-black p-4 text-center bg-gray-50">TIDAK ADA PERANGKAT DI DROP-OFF CENTER.</p>
          ) : projects.map((p) => (
            <div key={p.id} className="border-4 border-black p-5 bg-white flex flex-col md:flex-row justify-between items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <p className="text-xs font-black text-gray-500 uppercase">{p.id}</p>
                <h3 className="text-lg font-black uppercase leading-tight mt-1">{p.title}</h3>
                <div className="text-xs font-bold uppercase mt-2 space-y-1 text-gray-600">
                  <p>KLIEN: {p.client_id}</p>
                  <p>MITRA: {p.mitra_id || 'BELUM ADA (DI BURSA KERJA)'}</p>
                </div>
              </div>
              
              <div className="w-full md:w-auto text-right flex flex-col items-end gap-3">
                <span className={`px-3 py-1 font-black uppercase text-sm border-2 border-black ${
                  p.status === 'OPEN' ? 'bg-gray-200' :
                  p.status === 'SEDANG DIKERJAKAN' ? 'bg-blue-400 text-white' :
                  p.status === 'MENUNGGU UAT' ? 'bg-yellow-400' : 'bg-green-500 text-white'
                }`}>
                  {p.status}
                </span>

                {p.status === 'SEDANG DIKERJAKAN' && (
                  <button onClick={() => handleAction(p)} className="bg-blue-600 text-white border-2 border-black px-4 py-2 font-black uppercase hover:bg-blue-700 active:translate-y-1">
                    UJI PERANGKAT (UAT)
                  </button>
                )}

                {p.status === 'MENUNGGU UAT' && (
                  <button onClick={() => handleAction(p)} className="bg-green-500 text-white border-2 border-black px-4 py-2 font-black uppercase hover:bg-green-600 active:translate-y-1">
                    EKSEKUSI BAST
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}