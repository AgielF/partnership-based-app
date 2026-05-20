import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { topUpPhysical, checkUserName } from '../../services/api';

export default function PosModule() {
  // State Target User
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState(null); 
  const [targetRole, setTargetRole] = useState(null); 
  const [isCheckingId, setIsCheckingId] = useState(false);

  // State Kasir & AI
  const [scanMode, setScanMode] = useState('MANUAL'); // MANUAL atau AI
  const [lembaran, setLembaran] = useState(0);
  const [pecahan, setPecahan] = useState(100000);
  
  const [scanStatus, setScanStatus] = useState('STANDBY'); 
  const [totalHitung, setTotalHitung] = useState(0);

  // Referensi Kamera
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  // Fungsi Menangkap Gambar dari Webcam
  const capture = useCallback(() => {
    const imageBase64 = webcamRef.current.getScreenshot();
    setImageSrc(imageBase64);
  }, [webcamRef]);

  // Fungsi Scan AI (Murni Berdiri Sendiri untuk Verifikasi Keaslian)
  const handleAIScan = async () => {
    if (!imageSrc) return alert("Tangkap gambar uang terlebih dahulu!");
    
    setScanStatus('SCANNING');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/scan-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageSrc })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Terjadi kesalahan di server backend.");
      }

      const data = await response.json();
      console.log("Respon Verifikasi AI:", data); 

      // Mengambil persentase (confidence) dan hasil dari OpenCV Backend
      const persentase = data.confidence;
      const statusUang = data.hasil_deteksi; 

      // Tampilkan hasil berupa persentase lewat alert sesuai instruksi
      if (statusUang === "ASLI") {
        alert(`[AI VISION]: Uang terverifikasi ${statusUang} dengan tingkat ketajaman tekstur ${persentase}%`);
        setScanStatus('VALID'); 
      } else {
        alert(`🚨 [PERINGATAN AI]: Uang dicurigai ${statusUang}! Tingkat kemiripan tekstur asli hanya ${persentase}%`);
        setScanStatus('STANDBY');
      }

    } catch (error) {
      alert(`Gagal menghubungi server AI: ${error.message}`);
      setScanStatus('STANDBY');
    }
  };

  // Fungsi Hitung Manual (Backup)
  const handleManualScan = () => {
    if (lembaran <= 0) return alert("Masukkan jumlah lembar uang fisik!");
    setScanStatus('SCANNING');
    setTotalHitung(0);
    setTimeout(() => {
      setTotalHitung(lembaran * pecahan);
      setScanStatus('VALID');
    }, 1500);
  };

  const handleProsesTopUp = async () => {
    if (!targetName) return alert("Validasi ID dan Nama Pengguna terlebih dahulu!");
    if (window.confirm(`KONFIRMASI KASIR: Tambahkan Rp ${totalHitung.toLocaleString('id-ID')} ke dompet ${targetName}?\n\n*With this, I guarantee the cash has passed UV light verification.*`)) {
      try {
        await topUpPhysical(targetId, totalHitung);
        alert(`[STRUK TERCETAK] - SUKSES! Dana tunai masuk ke dompet ${targetName}`);
        
        // Reset Total
        setScanStatus('STANDBY'); setLembaran(0); setTotalHitung(0); setImageSrc(null);
        setTargetId(''); setTargetName(null); setTargetRole(null);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  // FUNGSI INQUIRY DATABASE
  const handleCheckId = async (e) => {
    e.preventDefault();
    if (!targetId.includes('USER-') && !targetId.includes('VND-')) {
      return alert("Format ID salah! Harus mengandung awalan USER- atau VND-");
    }
    setIsCheckingId(true); setTargetName(null); setTargetRole(null);
    try {
      const data = await checkUserName(targetId);
      setTargetName(data.name); setTargetRole(data.role);
    } catch (e) { alert(`GAGAL: ${e.message}`); } 
    finally { setIsCheckingId(false); }
  };

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">SMART CASHEER</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">LAYANAN TOP-UP</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase animate-pulse">
          LOKET BUKA
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* BAGIAN KIRI: MESIN HITUNG & AI CAMERA */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gray-100 flex flex-col">
          <div className="bg-black text-white p-4 font-black uppercase text-xl flex justify-between items-center">
            <span>[ POS KEUANGAN ]</span>
            <div className="flex gap-2">
              <button onClick={() => setScanMode('MANUAL')} className={`text-xs px-2 py-1 border-2 border-white ${scanMode === 'MANUAL' ? 'bg-white text-black' : 'text-white'}`}>HITUNG UANG</button>
              <button onClick={() => setScanMode('AI')} className={`text-xs px-2 py-1 border-2 border-white ${scanMode === 'AI' ? 'bg-white text-black' : 'text-white'}`}>VERIFIKASI</button>
            </div>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            
            {/* RENDER BERDASARKAN MODE */}
            {scanMode === 'AI' ? (
              <div className="space-y-4">
                <div className="border-4 border-black bg-black p-2 relative h-48 flex justify-center items-center overflow-hidden">
                  {!imageSrc ? (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={imageSrc} alt="Uang yang difoto" className="w-full h-full object-cover" />
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!imageSrc ? (
                    <button onClick={capture} className="w-full bg-yellow-300 border-4 border-black py-2 font-black uppercase hover:bg-yellow-400 active:translate-y-1">
                      📸 TANGKAP GAMBAR UANG
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setImageSrc(null)} className="w-1/3 bg-white border-4 border-black py-2 font-black uppercase hover:bg-gray-100 active:translate-y-1">
                        ULANGI
                      </button>
                      <button onClick={handleAIScan} className="w-2/3 bg-blue-600 text-white border-4 border-black py-2 font-black uppercase hover:bg-blue-700 active:translate-y-1">
                        🧠 ANALISIS DENGAN AI
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Pecahan Uang</label>
                  <select value={pecahan} onChange={(e) => setPecahan(Number(e.target.value))} className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none">
                    <option value={100000}>Rp 100.000</option>
                    <option value={50000}>Rp 50.000</option>
                    <option value={20000}>Rp 20.000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Jml Lembar</label>
                  <input type="number" min="0" value={lembaran} onChange={(e) => setLembaran(Number(e.target.value))} className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none" />
                </div>
                <button onClick={handleManualScan} className="col-span-2 bg-blue-600 text-white border-4 border-black py-3 font-black uppercase hover:bg-blue-700 active:translate-y-1">
                  HITUNG
                </button>
              </div>
            )}

            <div className={`border-8 border-black p-6 text-center transition-colors ${scanStatus === 'SCANNING' ? 'bg-yellow-300' : scanStatus === 'VALID' ? 'bg-green-400' : 'bg-white'}`}>
              <p className="text-sm font-black uppercase mb-2">
                {scanStatus === 'SCANNING' ? 'MENGHITUNG...' : scanStatus === 'VALID' ? 'UANG DIHITUNG - WAJIB CEK UV' : 'LAYAR MESIN STANDBY'}
              </p>
              <p className="text-5xl font-black tracking-tighter">Rp {totalHitung.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* BAGIAN KANAN: INPUT TARGET TOP UP */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white h-fit flex flex-col">
          <div className="p-6 border-b-4 border-black bg-yellow-300">
             <h2 className="text-2xl font-black uppercase">PROSES TRANSAKSI TOP-UP</h2>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <form onSubmit={handleCheckId} className="space-y-2">
              <label className="block text-xs font-black uppercase">ID Tujuan</label>
              <div className="flex gap-2">
                <input type="text" required value={targetId} onChange={(e) => { setTargetId(e.target.value.toUpperCase()); setTargetName(null); setTargetRole(null); }} placeholder="USER-ABCD / VND-XYZ" className="w-full border-4 border-black p-4 font-black uppercase text-xl focus:bg-yellow-50 focus:outline-none" />
                <button type="submit" disabled={isCheckingId} className="bg-black text-white px-6 font-black uppercase border-4 border-black hover:bg-gray-800 active:translate-y-1">
                  {isCheckingId ? '...' : 'CEK'}
                </button>
              </div>
            </form>

            <div className={`p-4 border-4 border-black ${targetName ? 'bg-green-100' : 'bg-gray-50 opacity-50'}`}>
              <p className="text-2xl font-black uppercase">{targetName ? targetName : 'NAMA BELUM DIVALIDASI'}</p>
            </div>

            <button 
              onClick={handleProsesTopUp}
              disabled={scanStatus !== 'VALID' || totalHitung === 0 || !targetName}
              className={`w-full py-4 font-black uppercase text-xl border-4 border-black transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mt-auto ${
                (scanStatus === 'VALID' && totalHitung > 0 && targetName) ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              TRANSFER (KONFIRMASI UV)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}