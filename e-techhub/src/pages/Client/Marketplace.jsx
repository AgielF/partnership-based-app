import React, { useState, useEffect } from 'react';
import { getMitraDirectory, createProject, getMitraHistory } from '../../services/api'; // <-- IMPORT getMitraHistory
import ChatModal from '../../components/ChatModal';

export default function ClientMarketplace() {
  const [mitraList, setMitraList] = useState([]);
  const clientId = localStorage.getItem('user_id');

  // State untuk form
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('SOFTWARE/WEB');
  const [budget, setBudget] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  
  // State untuk menyimpan Mitra yang sedang dipilih (Sewa Langsung)
  const [selectedMitra, setSelectedMitra] = useState(null);

  // MENGONTROL MODAL CHAT NEGOSIASI
  const [activeChatRoom, setActiveChatRoom] = useState(null);

  // STATE BARU: MENGONTROL MODAL PORTOFOLIO
  const [portfolioMitra, setPortfolioMitra] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  useEffect(() => {
    const fetchMitras = async () => {
      try {
        const data = await getMitraDirectory();
        setMitraList(data);
      } catch (error) {
        console.error("Gagal mengambil data mitra:", error);
      }
    };
    fetchMitras();
  }, []);

  const handlePostProject = async (e) => {
    e.preventDefault();
    if (!clientId) return alert("Sesi tidak valid, harap login kembali.");
    
    let finalDescription = description;
    if (selectedMitra) {
      finalDescription = `[PROYEK PRIVATE UNTUK MITRA: ${selectedMitra.id}] - ` + description;
    }

    const parsedTags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      await createProject(clientId, {
        title,
        service_type: serviceType,
        budget: parseFloat(budget),
        description: finalDescription,
        deadline_days: parseInt(deadlineDays, 10), 
        tags: parsedTags                                           
      });
      
      alert(selectedMitra ? `Permintaan SPK berhasil dikirim langsung ke ${selectedMitra.name}!` : "Proyek berhasil dipublikasikan ke Bursa Kerja Umum!");
      
      setTitle(''); setBudget(''); setDescription(''); setDeadlineDays(''); setTagsInput(''); setSelectedMitra(null);
    } catch (error) {
      alert(`Gagal: ${error.message}`);
    }
  };

  // FUNGSI BARU: Mengambil dan membuka Portofolio
  const handleViewPortfolio = async (mitra) => {
    setPortfolioMitra(mitra);
    setIsLoadingPortfolio(true);
    try {
      const data = await getMitraHistory(mitra.id);
      setPortfolioData(data);
    } catch (error) {
      alert(`Gagal memuat portofolio: ${error.message}`);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black relative">
      
      {/* TAMPILKAN MODAL CHAT JIKA TOMBOL NEGO DITEKAN */}
      {activeChatRoom && (
        <ChatModal 
          roomId={activeChatRoom} 
          userId={clientId} 
          onClose={() => setActiveChatRoom(null)} 
        />
      )}

      {/* ========================================================
          MODAL BARU: PORTOFOLIO MITRA
          ======================================================== */}
      {portfolioMitra && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-8 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4 shrink-0">
              <div>
                <h2 className="text-3xl font-black uppercase text-blue-600">PORTOFOLIO: {portfolioMitra.name}</h2>
                <p className="text-gray-600 font-bold uppercase mt-1">⭐ {parseFloat(portfolioMitra.rating).toFixed(1)} | {portfolioMitra.role}</p>
              </div>
              <button 
                onClick={() => setPortfolioMitra(null)} 
                className="text-4xl font-black hover:text-red-500 transition-colors leading-none"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 grow">
              {isLoadingPortfolio ? (
                <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-xl text-center animate-pulse">
                  ⏳ MEMUAT BUKTI KERJA...
                </div>
              ) : portfolioData.length === 0 ? (
                <div className="bg-gray-100 border-4 border-black p-8 font-bold uppercase text-center text-gray-500">
                  MITRA INI BELUM MEMILIKI RIWAYAT PROYEK YANG SELESAI.
                </div>
              ) : (
                portfolioData.map((proj) => (
                  <div key={proj.id} className="border-4 border-black p-5 bg-gray-50 hover:bg-white transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-black uppercase text-green-700">{proj.title}</h3>
                      <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase whitespace-nowrap">
                        {proj.service_type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t-2 border-black border-dashed pt-3">
                      <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Pemberi Kerja (Klien)</p>
                        <p className="font-black uppercase">{proj.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase font-bold text-gray-500">Nilai Kontrak</p>
                        <p className="font-black uppercase text-blue-600 text-lg">Rp {proj.budget.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t-4 border-black shrink-0">
              <button 
                onClick={() => setPortfolioMitra(null)}
                className="w-full bg-black text-white font-black uppercase py-3 border-4 border-black hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                TUTUP PORTOFOLIO
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ======================================================== */}

      <div className="border-b-8 border-black pb-6 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">CARI JASA (O2O)</h1>
          <p className="text-sm font-bold text-gray-600 uppercase mt-2">POSTING PROYEK ATAU SEWA MITRA LANGSUNG</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* Form Posting Proyek */}
        <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit transition-colors ${selectedMitra ? 'bg-yellow-300' : 'bg-blue-50'}`}>
          <h2 className="text-2xl font-black uppercase mb-2">BUAT PERMINTAAN SPK BARU</h2>
          
          {selectedMitra ? (
            <div className="mb-6 flex justify-between items-center bg-black text-white p-3 font-bold text-sm">
              <span>MENGONTRAK: {selectedMitra.name}</span>
              <button onClick={() => setSelectedMitra(null)} className="text-red-400 hover:text-red-300 underline">BATALKAN</button>
            </div>
          ) : (
            <div className="mb-6 bg-white border-2 border-black border-dashed p-3 font-bold text-sm text-gray-600">
              MODE: PUBLIKASI KE BURSA KERJA UMUM
            </div>
          )}

          <form onSubmit={handlePostProject} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Judul Pekerjaan</label>
              <input type="text" required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="MISAL: PEMBUATAN API BACKEND" className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Kategori Layanan</label>
                <select 
                    value={serviceType} 
                    onChange={(e)=>setServiceType(e.target.value)} 
                    className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none bg-white"
                  >
                    <option value="SOFTWARE/WEB">SOFTWARE / WEB</option>
                    <option value="IOT/EMBEDDED">IOT / EMBEDDED</option>
                    <option value="SERVIS HARDWARE">SERVIS HARDWARE</option>
                    <option value="PERENTALAN">PERENTALAN ALAT</option>
                  </select>
                   </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Budget Escrow (Rp)</label>
                <input type="number" required min="1" value={budget} onChange={(e)=>setBudget(e.target.value)} placeholder="5000000" className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Estimasi Waktu (Hari)</label>
                <input type="number" required min="1" value={deadlineDays} onChange={(e)=>setDeadlineDays(e.target.value)} placeholder="MISAL: 14" className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Keahlian (Pisahkan Koma)</label>
                <input type="text" value={tagsInput} onChange={(e)=>setTagsInput(e.target.value)} placeholder="REACT, NODEJS, GOLANG" className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
              <textarea rows="3" required value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="JELASKAN KEBUTUHAN ANDA SECARA DETAIL..." className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none"></textarea>
            </div>
            <button type="submit" className="w-full mt-4 bg-black text-white border-4 border-black py-4 font-black uppercase hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
              {selectedMitra ? 'KIRIM SPK LANGSUNG' : 'PUBLIKASIKAN KE BURSA KERJA'}
            </button>
          </form>
        </div>

        {/* Direktori Mitra */}
        <div>
          <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">DIREKTORI MITRA TERVERIFIKASI</h2>
          <div className="space-y-6">
            {mitraList.length === 0 ? (
              <p className="font-bold border-4 border-black p-4">MEMUAT DATA MITRA...</p>
            ) : mitraList.map((mitra) => (
              <div 
                key={mitra.id} 
                className={`border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition ${selectedMitra?.id === mitra.id ? 'bg-yellow-300' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black uppercase">{mitra.name}</h3>
                  <span className="font-black text-yellow-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">⭐ {parseFloat(mitra.rating).toFixed(1)}</span>
                </div>
                <p className="text-sm font-bold text-gray-600 uppercase mb-3">{mitra.role}</p>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {mitra.tags.map(tag => (
                    <span key={tag} className="border-2 border-black px-2 py-1 text-xs font-bold uppercase bg-white">{tag}</span>
                  ))}
                </div>
                
                {/* BARIS TOMBOL AKSI DIPERBARUI */}
                <div className="flex justify-between items-center border-t-4 border-black pt-4 mt-2">
                  <span className="font-black text-lg">{mitra.rate}</span>
                  
                  <div className="flex gap-2">
                     {/* TOMBOL PORTOFOLIO BARU */}
                     <button 
                       onClick={() => handleViewPortfolio(mitra)}
                       className="bg-green-400 text-black border-2 border-black px-3 py-2 font-black uppercase hover:bg-green-500 active:translate-y-1 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
                       title="Lihat Riwayat Proyek"
                     >
                       📂 PORTFOLIO
                     </button>

                     <button 
                       onClick={() => setActiveChatRoom(`NEGO-${clientId}-${mitra.id}`)}
                       className="bg-white text-black border-2 border-black px-3 py-2 font-black uppercase hover:bg-yellow-300 active:translate-y-1 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
                     >
                       💬 NEGO
                     </button>

                     <button 
                       onClick={() => setSelectedMitra(mitra)}
                       className="bg-blue-600 text-white border-2 border-black px-4 py-2 font-black uppercase hover:bg-blue-700 active:translate-y-1 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
                     >
                       {selectedMitra?.id === mitra.id ? 'DIPILIH' : 'BUAT SPK'}
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}