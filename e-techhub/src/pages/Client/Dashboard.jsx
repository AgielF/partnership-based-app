import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getClientContracts, 
  approveContractUAT, 
  topUpOnline, 
  getContractPDF, 
  getClientWallet,
  updateClientProfile, 
  uploadClientAvatar, 
  getClientPrivateProfile 
} from '../../services/api';

import BidsReviewModal from '../../components/BidsReviewModal';

// ==========================================
// SUB-KOMPONEN: EDITOR PROFIL KLIEN
// ==========================================
function ClientProfileEditor({ clientId, initialData, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    display_name: initialData?.name || '',
    avatar_url: initialData?.avatar_url || '' 
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialData?.avatar_url || null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Maksimal 2MB!");
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (avatarFile) {
        const uploadResponse = await uploadClientAvatar(clientId, avatarFile);
        finalAvatarUrl = uploadResponse.url; 
      }

      await updateClientProfile(clientId, {
        name: formData.display_name,
        avatar_url: finalAvatarUrl,
      });
      
      alert("✅ Profil Perusahaan/Klien diperbarui!");
      
      // Update local storage name agar header berubah
      if (formData.display_name) {
        localStorage.setItem('name', formData.display_name);
      }
      
      setAvatarFile(null); 
      if(onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      alert(`❌ Gagal: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2 w-fit">
        🏢 PROFIL KLIEN / PERUSAHAAN
      </h3>
      
      <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 items-center">
        
        {/* FOTO PROFIL KLIEN */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-32 h-32 border-4 border-black bg-blue-100 overflow-hidden flex items-center justify-center mb-3">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Klien" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🏢</span>
            )}
          </div>
          <label className="w-full bg-blue-300 text-black border-2 border-black py-1 font-black uppercase text-xs text-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 active:translate-y-1 active:shadow-none transition-all">
            UBAH LOGO
            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        {/* DATA PROFIL KLIEN */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <label className="block text-xs font-black uppercase mb-1 text-gray-500">Nama Tampilan (Publik)</label>
            <input 
              type="text" 
              name="display_name" 
              value={formData.display_name} 
              onChange={handleChange}
              placeholder="Contoh: PT. Maju Bersama / Agiel"
              className="w-full border-b-4 border-black bg-gray-50 p-3 font-bold uppercase focus:outline-none focus:bg-yellow-50"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-black text-white border-4 border-black py-3 font-black uppercase transition-all hover:bg-gray-800 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
          >
            {isSaving ? 'MENYIMPAN...' : 'SIMPAN IDENTITAS KLIEN'}
          </button>
        </div>
      </form>

      {/* ======================================================== */}
      {/* INDIKATOR KAPASITAS FINANSIAL & HISTORY (KHUSUS KLIEN) */}
      {/* ======================================================== */}
      <div className="mt-8 border-t-4 border-dashed border-gray-300 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="border-4 border-black p-4 bg-gray-50 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Status Kepercayaan</p>
          {initialData?.is_payment_verified ? (
            <p className="font-black text-green-600 text-sm flex items-center gap-2">✅ VERIFIED PAYMENT</p>
          ) : (
            <p className="font-black text-red-600 text-sm flex items-center gap-2 animate-pulse">❌ BELUM DEPOSIT</p>
          )}
        </div>
        <div className="border-4 border-black p-4 bg-yellow-300 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase text-gray-700 mb-1">Total Pengadaan</p>
          <p className="text-2xl font-black leading-none">{initialData?.total_projects_posted || 0} SPK</p>
        </div>
        <div className="border-4 border-black p-4 bg-blue-300 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase text-gray-700 mb-1">Total Dana Dibayarkan</p>
          <p className="text-xl font-black tracking-tighter text-blue-900 leading-none">
            Rp {initialData?.total_paid_to_mitra?.toLocaleString('id-ID') || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function ClientDashboard() {
  const [contracts, setContracts] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, escrow_balance: 0 });
  const [clientProfile, setClientProfile] = useState(null); 
  
  const [reviewingProjectId, setReviewingProjectId] = useState(null);

  const clientId = localStorage.getItem('user_id');
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!clientId) return;
    try {
      const contractData = await getClientContracts(clientId);
      setContracts(contractData);
      
      const walletData = await getClientWallet(clientId);
      setWallet(walletData);

      const profileData = await getClientPrivateProfile(clientId);
      setClientProfile(profileData);
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const handleTopUp = async () => {
    const nominal = prompt("Masukkan nominal Top-Up (Contoh: 1000000):");
    if (nominal && !isNaN(nominal) && parseFloat(nominal) > 0) {
      try {
        if (!window.snap) return alert("Sistem pembayaran belum siap.");
        const responseData = await topUpOnline(clientId, parseFloat(nominal));
        if (!responseData.token) throw new Error("Token Snap gagal ditarik.");

        window.snap.pay(responseData.token, {
          onSuccess: async function(result){
            try {
              await fetch('http://127.0.0.1:8000/api/client/midtrans/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: result.order_id,
                  transaction_status: 'settlement',
                  fraud_status: 'accept'
                })
              });
              alert("Pembayaran berhasil!");
              fetchData(); 
            } catch (error) {
              console.error(error);
            }
          }
        });
      } catch (e) {
        alert(`Gagal: ${e.message}`);
      }
    }
  };

  const handleApproveUAT = async (contractId) => {
    if (window.confirm('Apakah Anda yakin hasil kerja sudah sesuai? Dana escrow akan dilepas ke Mitra.')) {
      let finalRating = parseFloat(prompt("Beri rating kinerja Mitra (1.0 - 5.0):", "5.0"));
      if (isNaN(finalRating) || finalRating < 1.0 || finalRating > 5.0) finalRating = 5.0;

      try {
        await approveContractUAT(clientId, contractId, finalRating); 
        alert(`BAST Diterbitkan! Bintang ${finalRating}.`);
        fetchData(); 
      } catch (error) {
        alert(`Gagal: ${error.message}`);
      }
    }
  };

  const handleViewPDF = async (contractId) => {
    try {
      const blob = await getContractPDF(clientId, contractId);
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (error) {
      alert(`Gagal membuka PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-mono text-black relative">
      
      {reviewingProjectId && (
        <BidsReviewModal projectId={reviewingProjectId} clientId={clientId} onClose={() => setReviewingProjectId(null)} onSuccess={fetchData} />
      )}

      <header className="flex flex-col md:flex-row justify-between items-end border-b-8 border-black pb-6 mb-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">KLIEN HUB</h1>
          <p className="text-lg font-bold text-gray-600 uppercase mt-2">PENGADAAN, KEUANGAN, & PROFIL</p>
        </div>
        <button 
          onClick={() => navigate('/client/marketplace')}
          className="mt-4 md:mt-0 bg-blue-600 text-white border-4 border-black px-6 py-3 font-black uppercase hover:bg-blue-700 transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
        >
          + CARI / BUAT PROYEK
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* PANEL KIRI: PROFIL & DOMPET */}
        <div className="space-y-6">
          
          {/* EDITOR PROFIL KLIEN */}
          {clientProfile ? (
            <ClientProfileEditor clientId={clientId} initialData={clientProfile} onUpdateSuccess={fetchData} />
          ) : (
             <div className="border-4 border-black p-6 bg-white animate-pulse">MEMUAT PROFIL...</div>
          )}

          <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-blue-50">
            <h2 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">SALDO DOMPET</h2>
            <p className="text-xs font-bold uppercase text-gray-500">BISA DITARIK / DIGUNAKAN</p>
            <p className="text-4xl font-black tracking-tighter mb-4 text-green-700">
              Rp {wallet.balance.toLocaleString('id-ID')}
            </p> 
            
            <button onClick={handleTopUp} className="w-full bg-green-500 text-black border-4 border-black py-3 font-black uppercase hover:bg-green-600 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mb-4">
              + DEPOSIT ONLINE
            </button>

            <div className="border-t-4 border-black pt-4">
              <p className="text-xs font-bold uppercase text-gray-500">TERTENTU / DANA ESCROW KONTRAK</p>
              <p className="text-2xl font-black tracking-tighter text-red-600">
                Rp {wallet.escrow_balance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: DAFTAR PROYEK (E-CONTRACT) */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-4">
            <span className="bg-black text-white px-3 py-1">E-CONTRACT</span> AKTIF
          </h2>

          <div className="space-y-6">
            {contracts.length === 0 ? (
              <p className="font-bold uppercase text-gray-500 border-4 border-black border-dashed bg-white p-10 text-center">TIDAK ADA KONTRAK AKTIF.</p>
            ) : contracts.map((contract) => (
              <div key={contract.id} className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-gray-50 transition flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase">{contract.title}</h3>
                      <p className="text-sm font-bold mt-1 uppercase text-gray-600">
                        MITRA: {contract.mitra || "BELUM ADA (MENUNGGU PELAMAR)"}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-black uppercase border-4 border-black text-center ${
                      contract.status === 'COMPLETED' ? 'bg-green-400' : 
                      contract.status === 'MENUNGGU UAT' ? 'bg-yellow-400' : 
                      contract.status === 'OPEN' ? 'bg-blue-300' : 'bg-white'
                    }`}>
                      {contract.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">ID Dokumen</p>
                      <p className="font-bold">{contract.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">Jalur Layanan</p>
                      <p className="font-bold">{contract.type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">Milestone Saat Ini</p>
                      <p className="font-bold">{contract.milestone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">Nilai Anggaran</p>
                      <p className="font-bold font-sans tracking-tight">Rp {contract.budget.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-auto border-t-4 border-black pt-4">
                  {contract.status === 'OPEN' && (
                    <button 
                      onClick={() => setReviewingProjectId(contract.id)}
                      className="w-full bg-yellow-300 text-black border-4 border-black py-3 font-black uppercase hover:bg-yellow-400 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      👀 LIHAT PELAMAR (BIDS)
                    </button>
                  )}

                  {contract.status === 'MENUNGGU UAT' && (
                    <button 
                      onClick={() => handleApproveUAT(contract.id)}
                      className="flex-1 bg-black text-white border-4 border-black py-3 font-black uppercase hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      SETUJUI UAT (RELEASE DANA)
                    </button>
                  )}

                  {contract.status !== 'OPEN' && (
                    <button 
                      onClick={() => handleViewPDF(contract.id)}
                      className="flex-1 bg-white text-black border-4 border-black py-3 font-black uppercase hover:bg-gray-100 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      LIHAT PDF SPK
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}