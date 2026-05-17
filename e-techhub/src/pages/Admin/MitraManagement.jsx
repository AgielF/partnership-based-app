import React, { useState, useEffect } from 'react';
import { getMitras, verifyMitraKyc, rejectMitraKyc, banUser } from '../../services/api';

export default function AdminMitraManagement() {
  const [mitras, setMitras] = useState([]);
  const [visibleKtp, setVisibleKtp] = useState({});

  const fetchMitraData = async () => {
    try {
      const data = await getMitras();
      setMitras(data);
    } catch (error) {
      console.error("Gagal menarik data mitra", error);
    }
  };

  useEffect(() => {
    fetchMitraData();
  }, []);

  const handleVerify = async (id, name) => {
    if(window.confirm(`YAKIN TERIMA KTP: Sahkan akun milik ${name}?`)) {
      try {
        await verifyMitraKyc(id);
        alert("BERHASIL: Akun Mitra telah diverifikasi dan aktif!");
        fetchMitraData();
      } catch (err) {
        alert("Gagal memverifikasi akun.");
      }
    }
  };

  const handleReject = async (id, name) => {
    if(window.confirm(`YAKIN TOLAK KTP: Kembalikan status ${name} untuk unggah ulang?`)) {
      try {
        await rejectMitraKyc(id);
        alert("DITOLAK: Mitra akan diminta mengunggah ulang KTP yang lebih jelas.");
        fetchMitraData();
      } catch (err) {
        alert("Gagal menolak akun.");
      }
    }
  };

  const handleBan = async (mitraId) => {
    if (window.confirm(`PERINGATAN: Anda akan memblokir Mitra ${mitraId}. Tindakan ini tidak dapat dibatalkan dari UI. Lanjutkan?`)) {
      try {
        await banUser(mitraId);
        alert('Mitra resmi diblokir dari ekosistem E-TechHub.');
        fetchMitraData();
      } catch (e) { alert(`GAGAL: ${e.message}`); }
    }
  };

  const toggleKtp = (id) => {
    setVisibleKtp(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const pendingMitras = mitras.filter(m => m.kyc_status === 'PENDING');
  const verifiedMitras = mitras.filter(m => m.kyc_status === 'VERIFIED');
  const nonActiveMitras = mitras.filter(m => m.kyc_status === 'BANNED' || m.kyc_status === 'REJECTED');

  return (
    <div className="font-mono bg-white text-black min-h-full p-8">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">MANAJEMEN MITRA (KYC)</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">OTORISASI IDENTITAS & KEPATUHAN</p>
        </div>
      </header>

      <div className="space-y-12">
        {/* =========================================
            BAGIAN 1: ANTREAN VERIFIKASI (PENDING)
        ========================================= */}
        <div>
          <h3 className="text-2xl font-black uppercase bg-yellow-200 border-4 border-black p-3 mb-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            ⏳ ANTREAN REVIEW KTP ({pendingMitras.length})
          </h3>
          
          {pendingMitras.length === 0 ? (
            <p className="border-4 border-black border-dashed p-6 text-center font-bold text-gray-500 bg-gray-50 uppercase">
              TIDAK ADA ANTREAN KTP BARU.
            </p>
          ) : (
            <div className="space-y-6">
              {pendingMitras.map((m) => (
                <div key={m.id} className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black pb-4 mb-4">
                    <div>
                      <h4 className="text-2xl font-black uppercase">{m.name || "NAMA BELUM DISET"}</h4>
                      <p className="text-sm font-bold text-gray-600 uppercase mt-1">ID: {m.id} | ROLE: {m.specialty_role || "UMUM"}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <button 
                        onClick={() => handleVerify(m.id, m.name)} 
                        className="bg-green-500 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-green-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                      >
                        ✅ TERIMA (VALID)
                      </button>
                      <button 
                        onClick={() => handleReject(m.id, m.name)} 
                        className="bg-orange-500 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                      >
                        ❌ TOLAK (BURAM)
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-100 border-4 border-black border-dashed p-4 flex flex-col items-center justify-center">
                    <button 
                      onClick={() => toggleKtp(m.id)}
                      className="bg-black text-white px-6 py-2 font-black uppercase text-sm hover:bg-gray-800 transition-colors"
                    >
                      {visibleKtp[m.id] ? "SEMBUNYIKAN FOTO KTP" : "📸 BUKA & PERIKSA FOTO KTP"}
                    </button>

                    {visibleKtp[m.id] && (
                      <div className="mt-4 w-full flex justify-center border-t-4 border-black border-dashed pt-4">
                        <img 
                          src={`http://127.0.0.1:8000/api/admin/mitras/${m.id}/ktp`} 
                          alt={`KTP ${m.name}`} 
                          className="max-h-96 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <p className="hidden text-red-600 font-black uppercase bg-red-100 p-4 border-4 border-red-600 mt-4 text-center">
                          ⚠️ GAMBAR KTP TIDAK DITEMUKAN / BELUM DIUNGGAH OLEH MITRA
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================
            BAGIAN 2: MITRA AKTIF (VERIFIED)
        ========================================= */}
        <div>
          <h3 className="text-2xl font-black uppercase bg-green-400 text-black border-4 border-black p-3 mb-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            ✅ VENDOR TERVERIFIKASI ({verifiedMitras.length})
          </h3>
          {verifiedMitras.length === 0 ? (
            <p className="border-4 border-black border-dashed p-6 text-center font-bold text-gray-500 bg-gray-50 uppercase">Belum ada vendor resmi yang aktif.</p>
          ) : (
            <div className="space-y-4">
              {verifiedMitras.map((m) => (
                <div key={m.id} className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center hover:bg-green-50 transition-colors">
                  <div>
                    <h4 className="text-2xl font-black uppercase">{m.name}</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-1">ID MITRA: {m.id} | ROLE: {m.specialty_role}</p>
                  </div>
                  <button onClick={() => handleBan(m.id)} className="bg-red-600 text-white border-4 border-black px-6 py-2 font-black uppercase hover:bg-red-700 mt-4 md:mt-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">
                    SUSPEND / BAN
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================
            BAGIAN 3: BLACKLIST / REJECTED (NON-ACTIVE)
        ========================================= */}
        <div>
          <h3 className="text-2xl font-black uppercase bg-gray-200 text-black border-4 border-black p-3 mb-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            🚫 RIWAYAT BLOKIR & REJECT ({nonActiveMitras.length})
          </h3>
          {nonActiveMitras.length === 0 ? (
            <p className="border-4 border-black border-dashed p-6 text-center font-bold text-gray-500 bg-gray-50 uppercase">Bersih. Tidak ada kasus pelanggaran hukum.</p>
          ) : (
            <div className="space-y-4">
              {nonActiveMitras.map((m) => (
                <div key={m.id} className="border-4 border-black p-6 bg-gray-100 opacity-60 flex flex-col md:flex-row justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-black uppercase text-gray-600 line-through">{m.name}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">ID MITRA: {m.id}</p>
                  </div>
                  <span className={`px-4 py-2 font-black uppercase border-2 border-black text-xs ${m.kyc_status === 'REJECTED' ? 'bg-orange-200 text-orange-800' : 'bg-black text-white'}`}>
                    {m.kyc_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}