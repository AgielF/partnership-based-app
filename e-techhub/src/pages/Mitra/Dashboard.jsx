import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMitraProjects, getMitraWallet, getMitraProfile, updateMitraProfile } from '../../services/api';

// ==========================================
// SUB-KOMPONEN: EDITOR PROFIL MITRA
// ==========================================
function MitraProfileEditor({ mitraId, initialData, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    specialty_role: initialData?.specialty_role || 'UMUM',
    hourly_rate_or_fee: initialData?.hourly_rate_or_fee || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fungsi Canggih: Tarik Lokasi GPS Otomatis
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return alert("Browser Anda tidak mendukung fitur GPS Geolocation.");
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        alert("Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses GPS di Browser.");
        setIsLocating(false);
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMitraProfile(mitraId, {
        specialty_role: formData.specialty_role,
        hourly_rate_or_fee: formData.hourly_rate_or_fee,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null
      });
      alert("PROFIL BERHASIL DISIMPAN!");
      if(onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      alert(`GAGAL: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-4 border-black p-6 bg-blue-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">⚙️ PENGATURAN PROFIL</h3>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase mb-1">Spesialisasi Utama (Bursa Kerja)</label>
          <select 
            name="specialty_role" 
            value={formData.specialty_role} 
            onChange={handleChange}
            className="w-full border-4 border-black p-3 font-bold uppercase cursor-pointer"
          >
            <option value="UMUM">PILIH SPESIALISASI...</option>
            <option value="SOFTWARE/WEB">SOFTWARE & WEB DEVELOPMENT</option>
            <option value="IOT/EMBEDDED">IOT & EMBEDDED SYSTEM</option>
            <option value="SERVIS HARDWARE">SERVIS HARDWARE / FISIK</option>
            <option value="PERENTALAN">VENDOR RENTAL</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">Tarif Dasar / Estimasi Fee (Contoh: Rp 50.000/Jam)</label>
          <input 
            type="text" 
            name="hourly_rate_or_fee" 
            value={formData.hourly_rate_or_fee} 
            onChange={handleChange}
            placeholder="Ketik tarif dasar Anda..."
            className="w-full border-4 border-black p-3 font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">Titik Koordinat (GPS untuk O2O Drop-Off)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={formData.latitude ? `${formData.latitude}, ${formData.longitude}` : "LOKASI BELUM DIATUR"} 
              className="w-full border-4 border-black p-3 font-bold text-gray-500 bg-gray-100"
            />
            <button 
              type="button" 
              onClick={handleGetLocation}
              className="bg-black text-white border-4 border-black px-4 font-black uppercase hover:bg-gray-800 transition active:translate-y-1"
            >
              {isLocating ? 'MENCARI...' : '📍 LACAK GPS'}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full mt-4 bg-white text-black border-4 border-black py-3 font-black uppercase transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 active:translate-y-1 active:shadow-none"
        >
          {isSaving ? 'MENYIMPAN DATA...' : '💾 SIMPAN PERUBAHAN PROFIL'}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// SUB-KOMPONEN: FORMULIR UNGGAH KTP
// ==========================================
function MitraKycUpload({ mitraId, currentKycStatus, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("Pilih file KTP terlebih dahulu!");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/mitra/${mitraId}/upload-ktp`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        if(onUploadSuccess) onUploadSuccess();
      } else {
        alert(`GAGAL: ${data.detail}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsUploading(false);
    }
  };

  const isRejected = currentKycStatus === 'REJECTED';

  return (
    <div className={`border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono text-black w-full mb-8 transition-colors duration-500 ${isSuccess ? 'bg-green-400' : 'bg-yellow-300'}`}>
      {isSuccess ? (
        <div className="text-center py-4">
          <h3 className="text-3xl font-black uppercase mb-2">✅ DOKUMEN DITERIMA</h3>
          <p className="text-sm font-bold uppercase text-gray-900 border-t-4 border-black pt-4 mt-2 inline-block">
            KTP Anda telah masuk ke antrean sistem. Silakan tunggu Admin melakukan validasi identitas Anda.
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-2xl font-black uppercase mb-2">
            {isRejected ? '❌ KTP DITOLAK (UNGGAH ULANG)' : '⚠️ VERIFIKASI IDENTITAS (KTP) DIBUTUHKAN'}
          </h3>
          <p className="text-sm font-bold uppercase mb-6 text-gray-800">
            {isRejected 
              ? 'Foto KTP Anda sebelumnya buram/tidak valid. Silakan unggah foto baru yang lebih jelas.' 
              : 'Akun Anda belum aktif. Unggah foto KTP asli Anda untuk membuka kunci bursa kerja.'}
          </p>
          <div className="border-4 border-black border-dashed bg-white p-6 mb-4 flex flex-col items-center justify-center">
            <input 
              type="file" accept="image/jpeg, image/png" onChange={handleFileChange} disabled={isUploading}
              className="font-bold text-sm w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-4 file:border-black file:text-sm file:font-black file:bg-black file:text-white hover:file:bg-gray-800 transition-colors disabled:opacity-50"
            />
          </div>
          <button 
            onClick={handleUpload} disabled={isUploading || !file}
            className={`w-full border-4 border-black py-4 font-black uppercase transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
              isUploading || !file ? 'bg-gray-400 text-gray-700 cursor-not-allowed shadow-none active:translate-y-0' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'MENGUNGGAH DOKUMEN...' : 'KIRIM DOKUMEN KTP SAYA'}
          </button>
        </>
      )}
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA: MITRA DASHBOARD
// ==========================================
export default function MitraDashboard() {
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [mitraProfile, setMitraProfile] = useState(null);
  
  const mitraId = localStorage.getItem('user_id') || 'VND-UNKNOWN';

  const fetchDashboardData = async () => {
    if (!mitraId || mitraId === 'VND-UNKNOWN') return;
    
    try {
      const [projects, walletData, profileData] = await Promise.all([
          getMitraProjects(mitraId),
          getMitraWallet(mitraId),
          getMitraProfile(mitraId)
      ]);

      const activeCount = projects.filter(
        (p) => p.status === 'SEDANG DIKERJAKAN' || p.status === 'MENUNGGU UAT'
      ).length;
      setActiveProjectsCount(activeCount);
      setWalletBalance(walletData.balance || 0);
      setMitraProfile(profileData);

    } catch (error) {
      console.error("Gagal menarik data dashboard mitra:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [mitraId]);

  if (!mitraProfile) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center font-mono">
        <div className="border-4 border-black p-10 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-2xl font-black uppercase">
          ⏳ MEMUAT HUB UTAMA...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black">
        
      {/* BANNER INDIKATOR MASA PERCOBAAN (PROBATION) */}
      {mitraProfile.kyc_status === 'VERIFIED' && mitraProfile.projects_completed < 10 && (
        <div className="border-4 border-black p-4 bg-red-500 text-white font-black uppercase text-sm mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
          🚨 STATUS AKUN: MASA PERCOBAAN (PROYEK SELESAI: {mitraProfile.projects_completed}/10).
          <br/>
          ATURAN: Anda HANYA diizinkan mengerjakan 1 proyek dalam satu waktu. Proyek pertama maksimal senilai Rp 1 JUTA.
        </div>
      )}

      {/* FORMULIR UNGGAH KTP JIKA BELUM VERIFIED */}
      {mitraProfile.kyc_status !== 'VERIFIED' && (
        <MitraKycUpload 
          mitraId={mitraId} 
          currentKycStatus={mitraProfile.kyc_status}
          onUploadSuccess={fetchDashboardData} 
        />
      )}

      <div className="border-b-8 border-black pb-6 mb-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter">HUB UTAMA</h1>
        <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">
          RINGKASAN AKTIVITAS & IDENTITAS VENDOR
        </p>
      </div>

      {/* COMPONENT: FORMULIR EDIT PROFIL */}
      <MitraProfileEditor 
        mitraId={mitraId} 
        initialData={mitraProfile} 
        onUpdateSuccess={fetchDashboardData} 
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: QR Code Anti-Fraud (Validasi Fisik) */}
        <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center">
          <h2 className="text-xl font-black uppercase mb-2 border-b-4 border-black pb-2 w-full">KARTU IDENTITAS MITRA</h2>
          <p className="text-xs font-bold uppercase mb-6">TUNJUKKAN QR INI KE KASIR DROP-OFF CENTER UNTUK VALIDASI</p>
          
          <div className="w-48 h-48 bg-white border-8 border-black flex items-center justify-center p-2 mb-6">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mitraId}')` }}
            ></div>
          </div>
          
          <div className="bg-black text-white w-full p-3 font-black uppercase text-xl">
            ID: {mitraId}
          </div>
          
          <p className={`text-xs font-bold uppercase mt-4 ${mitraProfile.kyc_status === 'VERIFIED' ? 'text-green-700' : 'text-red-700'}`}>
            *{mitraProfile.kyc_status === 'VERIFIED' ? 'Telah Lolos Verifikasi KYC' : 'Belum Lolos Verifikasi KYC'}
          </p>
        </div>

        {/* Kolom Kanan: Statistik & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <p className="text-sm font-black uppercase text-gray-500 mb-2">PROYEK AKTIF (SPK)</p>
                <p className="text-6xl font-black tracking-tighter">{activeProjectsCount}</p>
              </div>
              <Link to="/mitra/projects" className="block mt-4 text-xs font-bold uppercase underline hover:bg-black hover:text-white w-fit px-2 transition-colors">
                LIHAT PROYEK &rarr;
              </Link>
            </div>
            <div className="border-4 border-black p-6 bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <p className="text-sm font-black uppercase text-black mb-2">SALDO CAIR</p>
                <p className="text-4xl font-black tracking-tighter mt-4">
                  Rp {walletBalance.toLocaleString('id-ID')}
                </p>
              </div>
              <Link to="/mitra/wallet" className="block mt-4 text-xs font-bold uppercase underline hover:bg-black hover:text-white w-fit px-2 transition-colors">
                TARIK DANA &rarr;
              </Link>
            </div>
          </div>

          <div className="border-4 border-black p-6 bg-gray-50">
            <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 mb-4">PENGUMUMAN SISTEM</h3>
            <div className="border-l-8 border-black pl-4">
              <p className="font-bold text-sm uppercase">Pembaruan Modul E-Contract</p>
              <p className="text-xs mt-1">Pastikan Anda selalu menekan tombol "Ajukan UAT" setelah milestone selesai agar BAST dapat diterbitkan secara otomatis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}