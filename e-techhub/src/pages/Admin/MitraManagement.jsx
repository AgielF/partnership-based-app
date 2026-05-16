import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getMitras, verifyMitraKyc, banUser } from '../../services/api';

export default function AdminMitraManagement() {
  const [mitras, setMitras] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const scannerInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // 1. Tarik data dari database MySQL
  const fetchMitraData = async () => {
    try {
      const data = await getMitras();
      setMitras(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMitraData();
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // 2. Filter data berdasarkan status kepatuhan
  const pendingMitras = mitras.filter(m => m.kyc_status === 'PENDING');
  const verifiedMitras = mitras.filter(m => m.kyc_status === 'VERIFIED');
  const nonActiveMitras = mitras.filter(m => m.kyc_status === 'BANNED' || m.kyc_status === 'REJECTED');

  // 3. Fungsi Verifikasi HANYA MELALUI SCANNER
  const executeKycVerification = async (mitraId) => {
    const cleanId = mitraId.trim().toUpperCase();
    if (!cleanId.startsWith('VND-')) {
      alert("FORMAT QR SALAH: Barcode tidak dikenali sebagai entitas Mitra.");
      return;
    }
    
    // Cek apakah mitra tersebut ada dan statusnya PENDING
    const targetMitra = mitras.find(m => m.id === cleanId);
    if (!targetMitra) {
      alert(`GAGAL: Mitra dengan ID ${cleanId} tidak ditemukan di database.`);
      return;
    }
    if (targetMitra.kyc_status === 'BANNED') {
      alert(`DITOLAK: Mitra ${cleanId} berstatus BLACKLIST dan tidak bisa diverifikasi ulang!`);
      return;
    }
    if (targetMitra.kyc_status === 'VERIFIED') {
      alert(`INFO: Mitra ${cleanId} sudah berstatus aktif/terverifikasi.`);
      return;
    }

    try {
      await verifyMitraKyc(cleanId);
      alert(`[BUNYI BEEP] - KYC Mitra ${cleanId} BERHASIL DIVERIFIKASI VIA QR!`);
      fetchMitraData();
    } catch (e) { alert(`GAGAL MEMVERIFIKASI QR: ${e.message}`); }
  };

  const toggleCamera = async () => {
    if (isCameraOpen) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await html5QrCode.stop();
            html5QrCode.clear();
            setIsCameraOpen(false);
            setScanInput(decodedText);
            executeKycVerification(decodedText);
          },
          () => {}
        ).catch((err) => {
          alert(`GAGAL MENGAKSES KAMERA: ${err.message}`);
          setIsCameraOpen(false);
        });
      }, 100);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (scanInput) {
      executeKycVerification(scanInput);
      setScanInput('');
    }
  };

  // Fungsi Pemblokiran (Bisa dilakukan kapan saja: saat Pending maupun Verified)
  const handleBan = async (mitraId) => {
    if (window.confirm(`PERINGATAN: Anda akan memblokir Mitra ${mitraId}. Tindakan ini tidak dapat dibatalkan dari UI. Lanjutkan?`)) {
      try {
        await banUser(mitraId);
        alert('Mitra resmi diblokir dari ekosistem E-TechHub.');
        fetchMitraData();
      } catch (e) { alert(`GAGAL: ${e.message}`); }
    }
  };

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">MANAJEMEN MITRA (KYC)</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">OTORISASI IDENTITAS & KEPATUHAN</p>
        </div>
      </header>

      {/* MODUL SCANNER SEBAGAI SATU-SATUNYA PINTU MASUK VERIFIKASI */}
      <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase">SYSTEM SCANNER AKTIF</h2>
            <p className="text-xs font-bold mt-1">Gunakan alat pemindai fisik atau kamera perangkat untuk memverifikasi Mitra</p>
          </div>
          <button onClick={toggleCamera} className={`px-6 py-3 font-black uppercase border-4 border-black transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${isCameraOpen ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>
            {isCameraOpen ? '❌ MATIKAN KAMERA' : '📷 BUKA KAMERA'}
          </button>
        </div>
        {isCameraOpen && (
          <div className="border-8 border-black bg-white p-4 flex justify-center items-center">
             <div id="reader" className="w-full max-w-sm border-4 border-dashed border-gray-400"></div>
          </div>
        )}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xl font-black">⌨️</span>
            <input ref={scannerInputRef} type="text" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="TEMBAKKAN QR / KETIK ID MANUAL DI SINI..." className="w-full border-4 border-black p-4 pl-12 font-black uppercase text-xl bg-yellow-50 focus:outline-none focus:bg-white" />
          </div>
          <button type="submit" className="bg-black text-white px-8 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">VALIDASI</button>
        </form>
      </div>

      <div className="space-y-12">
        {/* =========================================
            BAGIAN 1: ANTREAN VERIFIKASI (PENDING)
        ========================================= */}
        <div>
          <h3 className="text-2xl font-black uppercase bg-yellow-200 border-4 border-black p-3 mb-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            ⏳ ANTREAN VERIFIKASI BARU ({pendingMitras.length})
          </h3>
          {pendingMitras.length === 0 ? (
            <p className="border-4 border-black border-dashed p-6 text-center font-bold text-gray-500 bg-gray-50 uppercase">Tidak ada pengajuan dokumen baru.</p>
          ) : (
            <div className="space-y-4">
              {pendingMitras.map((m) => (
                <div key={m.id} className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-black uppercase">{m.name}</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-1">ID MITRA: {m.id}</p>
                  </div>
                  <div className="flex gap-4 mt-4 md:mt-0 items-center">
                    {/* INDIKATOR WAJIB SCAN (MENGGANTIKAN TOMBOL MANUAL) */}
                    <span className="bg-yellow-100 border-2 border-black px-4 py-2 font-black uppercase text-xs tracking-widest animate-pulse">
                      ⚠️ MENUNGGU SCAN QR
                    </span>
                    <button onClick={() => handleBan(m.id)} className="bg-red-600 text-white border-4 border-black px-6 py-2 font-black uppercase hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">REJECT / BAN</button>
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
                    <p className="text-xs font-bold text-gray-500 uppercase mt-1">ID MITRA: {m.id}</p>
                  </div>
                  {/* TOMBOL BAN TETAP ADA JIKA MELANGGAR SLA DI KEMUDIAN HARI */}
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
                  <span className="bg-black text-white px-4 py-2 font-black uppercase border-2 border-black text-xs">
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