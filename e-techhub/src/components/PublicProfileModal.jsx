import React, { useState, useEffect } from 'react';
import { getMitraPublicProfile, getClientPublicProfile } from '../services/api';

export default function PublicProfileModal({ type, targetId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        if (type === 'mitra') {
          const data = await getMitraPublicProfile(targetId);
          setProfile(data);
        } else if (type === 'client') {
          const data = await getClientPublicProfile(targetId);
          setProfile(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (targetId) fetchProfile();
  }, [targetId, type]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,204,0,1)] w-full max-w-lg p-8 font-mono text-black relative">
        
        {/* Tombol Close Silang */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-black text-white px-3 py-1 font-black text-xl hover:bg-red-600 transition-colors"
        >
          X
        </button>

        <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2 tracking-tighter">
          INSPEKSI {type === 'mitra' ? 'VENDOR' : 'KLIEN'}
        </h2>

        {isLoading ? (
          <div className="animate-pulse bg-gray-200 h-32 border-4 border-dashed border-gray-400"></div>
        ) : error ? (
          <div className="bg-red-200 text-red-800 border-4 border-red-600 p-4 font-bold uppercase">
            ⚠️ GAGAL: {error}
          </div>
        ) : profile && type === 'mitra' ? (
          /* TAMPILAN PROFIL PUBLIK MITRA */
          <div className="space-y-6">
            <div className="bg-yellow-300 border-4 border-black p-4 text-center">
              <p className="text-sm font-bold uppercase text-gray-800">Nama Disamarkan</p>
              <p className="text-4xl font-black uppercase tracking-tighter">{profile.name_masked}</p>
              <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase mt-2 inline-block">
                {profile.specialty_role}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border-4 border-black p-4 text-center">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">RATING</p>
                <p className="text-3xl font-black">{profile.rating.toFixed(1)} / 5.0</p>
              </div>
              <div className="border-4 border-black p-4 text-center">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">PROYEK SELESAI</p>
                <p className="text-3xl font-black">{profile.projects_completed}</p>
              </div>
            </div>

            <div className="border-l-8 border-black pl-4 bg-gray-50 p-2">
              <p className="text-xs font-bold uppercase text-gray-500">Estimasi Tarif/Biaya</p>
              <p className="text-lg font-black uppercase">{profile.hourly_rate_or_fee}</p>
            </div>

            <p className="text-xs font-bold text-red-600 uppercase text-center mt-4">
              *Informasi kontak dilindungi sistem. Gunakan Chat Internal E-TechHub untuk bernegosiasi.
            </p>
          </div>
        ) : profile && type === 'client' ? (
          /* TAMPILAN PROFIL PUBLIK KLIEN */
          <div className="space-y-6">
            <div className="border-4 border-black p-6 bg-white">
              <h3 className="text-3xl font-black uppercase mb-1">{profile.name_masked}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase">ID: {profile.id}</p>
            </div>
            
            <div className={`border-4 border-black p-4 flex items-center justify-between ${profile.is_payment_verified ? 'bg-green-300' : 'bg-red-300'}`}>
              <span className="font-black uppercase">Status Pembayaran</span>
              <span className="bg-black text-white px-4 py-1 font-black uppercase text-sm">
                {profile.is_payment_verified ? 'VERIFIED ✅' : 'UNVERIFIED ❌'}
              </span>
            </div>

            <div className="border-4 border-black p-4 flex items-center justify-between bg-blue-200">
              <span className="font-black uppercase">Riwayat Publikasi SPK</span>
              <span className="text-2xl font-black uppercase">{profile.total_projects_posted} PROYEK</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}