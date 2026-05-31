import React, { useState, useEffect } from 'react';
import { getMitraPublicProfile, getClientPublicProfile } from '../services/api';

export default function PublicProfileModal({ type, targetId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = type === 'mitra' 
          ? await getMitraPublicProfile(targetId) 
          : await getClientPublicProfile(targetId);
        setProfile(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (targetId) fetchProfile();
  }, [type, targetId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-yellow-300 border-8 border-black p-8 font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse">
          ⏳ MENGAMBIL DATA PROFIL...
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm font-mono text-black">
      <div className="bg-white border-8 border-black p-8 shadow-[16px_16px_0px_0px_rgba(255,100,100,1)] max-w-sm w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-4xl font-black hover:text-red-500 leading-none transition-colors"
        >
          &times;
        </button>
        
        {type === 'mitra' ? (
          <div className="flex flex-col items-center text-center mt-6">
            
            {/* AREA FOTO PROFIL (AVATAR) */}
            <div className="w-40 h-40 border-8 border-black bg-gray-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">👤</span>
              )}
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">{profile.name_masked}</h2>
            <span className="bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest mb-6">
              {profile.specialty_role}
            </span>

            <div className="w-full grid grid-cols-2 gap-4 mb-6">
              <div className="border-4 border-black p-3 bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase text-gray-700">RATING</p>
                <p className="text-2xl font-black tracking-tighter">⭐ {profile.rating.toFixed(1)}</p>
              </div>
              <div className="border-4 border-black p-3 bg-blue-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase text-gray-700">SELESAI</p>
                <p className="text-xl font-black tracking-tighter mt-1">{profile.projects_completed} SPK</p>
              </div>
            </div>

            <div className="w-full border-t-4 border-dashed border-gray-300 pt-4 mb-6">
              <p className="text-xs font-black uppercase text-gray-500 mb-1">Estimasi Tarif / Fee:</p>
              <p className="font-black text-xl text-green-700">{profile.hourly_rate_or_fee}</p>
            </div>

            {/* TOMBOL LINK PORTOFOLIO DINAMIS */}
            {profile.portfolio_link ? (
              <a 
                href={profile.portfolio_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full block bg-blue-600 text-white border-4 border-black py-4 font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all"
              >
                🔗 LIHAT PORTOFOLIO
              </a>
            ) : (
              <div className="w-full block bg-gray-200 text-gray-500 border-4 border-gray-400 py-4 font-black uppercase border-dashed text-xs cursor-not-allowed">
                TIDAK ADA LINK PORTOFOLIO
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center text-center mt-6">
            
            {/* AVATAR KLIEN */}
            <div className="w-32 h-32 border-8 border-black bg-blue-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-4 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar Klien" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🏢</span>
              )}
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">{profile.name_masked}</h2>
            <span className="bg-blue-600 text-white px-4 py-1 text-xs font-black uppercase mb-6 tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              KLIEN PENGADAAN
            </span>

            {/* TRUST FACTOR BADGE */}
            <div className={`w-full border-4 border-black p-4 mb-4 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${profile.is_payment_verified ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-[10px] font-black uppercase text-gray-600 mb-1 border-b-2 border-black pb-1">Kapasitas Keuangan:</p>
              {profile.is_payment_verified ? (
                <p className="font-black text-green-700 text-xl mt-2 flex items-center gap-2">✅ VERIFIED PAYMENT</p>
              ) : (
                <p className="font-black text-red-700 text-sm mt-2 flex items-center gap-2">❌ PEMBAYARAN BELUM TERVERIFIKASI</p>
              )}
            </div>

            {/* HISTORY PENGADAAN */}
            <div className="w-full grid grid-cols-2 gap-4">
              <div className="border-4 border-black p-4 bg-yellow-300 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase text-gray-700 mb-1">Riwayat Pos</p>
                <p className="font-black text-2xl leading-none">{profile.total_projects_posted} SPK</p>
              </div>
              <div className="border-4 border-black p-4 bg-gray-50 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Total Terbayar</p>
                <p className="font-black text-lg text-blue-700 tracking-tighter leading-tight">Rp {profile.total_paid_to_mitra?.toLocaleString('id-ID')}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}