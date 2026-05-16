
import React, { useState } from 'react';
import { topUpPhysical, checkUserName } from '../../services/api';

export default function PosModule() {
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState(null); 
  const [targetRole, setTargetRole] = useState(null); 
  const [isCheckingId, setIsCheckingId] = useState(false);

  const [lembaran, setLembaran] = useState(0);
  const [pecahan, setPecahan] = useState(100000);
  
  const [scanStatus, setScanStatus] = useState('STANDBY'); 
  const [totalHitung, setTotalHitung] = useState(0);

  const handleScanMesin = () => {
    if (lembaran <= 0) return alert("Masukkan jumlah lembar uang fisik!");
    
    setScanStatus('SCANNING');
    setTotalHitung(0);
    
    setTimeout(() => {
      const total = lembaran * pecahan;
      setTotalHitung(total);
      setScanStatus('VALID');
    }, 2000);
  };

  // FUNGSI INQUIRY LANGSUNG KE DATABASE MYSQL
  const handleCheckId = async (e) => {
    e.preventDefault();
    if (!targetId.includes('USER-') && !targetId.includes('VND-')) {
      return alert("Format ID salah! Harus mengandung awalan USER- atau VND-");
    }
    
    setIsCheckingId(true);
    setTargetName(null);
    setTargetRole(null);
    
    try {
      const data = await checkUserName(targetId);
      setTargetName(data.name);
      setTargetRole(data.role);
    } catch (e) {
      alert(`GAGAL: ${e.message}`);
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleProsesTopUp = async () => {
    if (!targetName) return alert("Anda harus memvalidasi ID dan Nama Pengguna terlebih dahulu!");

    if (window.confirm(`KONFIRMASI KASIR: Tambahkan Rp ${totalHitung.toLocaleString('id-ID')} ke dompet ${targetName}?`)) {
      try {
        await topUpPhysical(targetId, totalHitung);
        alert(`[STRUK TERCETAK] - SUKSES! Dana tunai berhasil masuk ke dompet ${targetName}`);
        
        // Reset Mesin Total
        setScanStatus('STANDBY'); setLembaran(0); setTotalHitung(0); 
        setTargetId(''); setTargetName(null); setTargetRole(null);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="font-mono bg-white text-black min-h-full">
      <header className="flex justify-between items-end border-b-8 border-black pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">KASIR FISIK & MESIN UANG</h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-1">LAYANAN TOP-UP & VALIDASI UANG TUNAI</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase animate-pulse">
          LOKET BUKA
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* MESIN HITUNG & SCAN UANG (Kiri) */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gray-100 flex flex-col">
          <div className="bg-black text-white p-4 font-black uppercase text-xl border-b-4 border-black">
            [ MESIN VALIDASI UV & PENGHITUNG UANG ]
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Pecahan Uang</label>
                <select 
                  value={pecahan} 
                  onChange={(e) => setPecahan(Number(e.target.value))}
                  className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none"
                >
                  <option value={100000}>Rp 100.000 (Merah)</option>
                  <option value={50000}>Rp 50.000 (Biru)</option>
                  <option value={20000}>Rp 20.000 (Hijau)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Jumlah Lembar (Fisik)</label>
                <input 
                  type="number" 
                  min="0"
                  value={lembaran}
                  onChange={(e) => setLembaran(Number(e.target.value))}
                  className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className={`border-8 border-black p-6 text-center transition-colors ${
              scanStatus === 'SCANNING' ? 'bg-yellow-300' : 
              scanStatus === 'VALID' ? 'bg-green-400' : 'bg-white'
            }`}>
              <p className="text-sm font-black uppercase mb-2">
                {scanStatus === 'SCANNING' ? 'MEMINDAI SINAR UV & MENGHITUNG...' : 
                 scanStatus === 'VALID' ? 'UANG ASLI - TOTAL TEPAT' : 'LAYAR MESIN STANDBY'}
              </p>
              <p className="text-5xl font-black tracking-tighter">
                Rp {totalHitung.toLocaleString('id-ID')}
              </p>
            </div>

            <button 
              onClick={handleScanMesin}
              disabled={scanStatus === 'SCANNING'}
              className="w-full bg-blue-600 text-white border-4 border-black py-4 font-black uppercase text-lg hover:bg-blue-700 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              HIDUPKAN MESIN HITUNG
            </button>
          </div>
        </div>

        {/* INPUT TARGET TOP UP (Kanan) */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white h-fit flex flex-col">
          <div className="p-6 border-b-4 border-black bg-yellow-300">
             <h2 className="text-2xl font-black uppercase">PROSES TRANSAKSI TOP-UP</h2>
             <p className="text-xs font-bold uppercase mt-1">Identifikasi Tujuan & Eksekusi Saldo</p>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            
            {/* TAHAP 1: INQUIRY (PENGECEKAN NAMA DATABASE) */}
            <form onSubmit={handleCheckId} className="space-y-2">
              <label className="block text-xs font-black uppercase">ID Pengguna Tujuan</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value.toUpperCase());
                    setTargetName(null); 
                    setTargetRole(null);
                  }}
                  placeholder="USER-ABCD / VND-XYZ"
                  className="w-full border-4 border-black p-4 font-black uppercase text-xl focus:bg-yellow-50 focus:outline-none" 
                />
                <button 
                  type="submit"
                  disabled={isCheckingId}
                  className="bg-black text-white px-6 font-black uppercase border-4 border-black hover:bg-gray-800 active:translate-y-1"
                >
                  {isCheckingId ? '...' : 'CEK'}
                </button>
              </div>
            </form>

            {/* TAHAP 2: VERIFIKASI VERBAL */}
            <div className={`p-4 border-4 border-black ${targetName ? 'bg-green-100' : 'bg-gray-50 opacity-50'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold uppercase text-gray-500">IDENTITAS PENERIMA DANA:</p>
                {targetRole && (
                  <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase">
                    {targetRole}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black uppercase">
                {targetName ? targetName : 'NAMA BELUM DIVALIDASI'}
              </p>
            </div>

            <div className="p-4 border-2 border-black border-dashed bg-gray-50">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">DANA YANG AKAN DIKIRIM:</p>
              <p className="text-3xl font-black text-green-600">Rp {totalHitung.toLocaleString('id-ID')}</p>
            </div>

            {/* TAHAP 3: EKSEKUSI */}
            <button 
              onClick={handleProsesTopUp}
              disabled={scanStatus !== 'VALID' || totalHitung === 0 || !targetName}
              className={`w-full py-4 font-black uppercase text-xl border-4 border-black transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mt-auto ${
                (scanStatus === 'VALID' && totalHitung > 0 && targetName)
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              TRANSFER DANA (CETAK STRUK)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}