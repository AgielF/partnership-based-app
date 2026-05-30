import React, { useState, useEffect } from 'react';
import { getMitraPublicProfile, getClientPublicProfile, getClientProjectsHistory } from '../services/api'; 
// Pastikan path ke '../services/api' benar sesuai struktur Anda

export default function PublicProfileModal({ type, targetId, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [clientProjects, setClientProjects] = useState([]); // State untuk daftar proyek Klien
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        if (type === 'mitra') {
          const data = await getMitraPublicProfile(targetId);
          setProfileData(data);
        } else if (type === 'client') {
          // Jika targetnya adalah Klien, tarik profil DAN riwayat proyeknya bersamaan
          const [data, projects] = await Promise.all([
            getClientPublicProfile(targetId),
            getClientProjectsHistory(targetId)
          ]);
          setProfileData(data);
          setClientProjects(projects);
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (targetId) fetchProfile();
  }, [type, targetId]);

  if (!targetId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white border-8 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] flex flex-col font-mono text-black">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-start border-b-8 border-black pb-4 mb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-black uppercase">
              PROFIL {type === 'mitra' ? 'MITRA' : 'KLIEN'}
            </h2>
            <p className="text-sm font-bold text-gray-500 uppercase">IDENTITAS PUBLIK (SAMAR)</p>
          </div>
          <button onClick={onClose} className="text-4xl font-black hover:text-red-600 transition-colors leading-none">&times;</button>
        </div>

        {/* KONTEN UTAMA */}
        <div className="overflow-y-auto pr-2 flex-grow">
          {isLoading ? (
             <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-xl text-center animate-pulse">
               ⏳ MENARIK DATA SERVER...
             </div>
          ) : !profileData ? (
             <div className="bg-red-500 text-white border-4 border-black p-6 font-black uppercase text-xl text-center">
               ❌ PROFIL TIDAK DITEMUKAN.
             </div>
          ) : (
            <div className="space-y-6">
              
              {/* KOTAK IDENTITAS */}
              <div className="border-4 border-black p-6 bg-gray-50">
                <h3 className="text-4xl font-black uppercase mb-2 text-blue-600">{profileData.name_masked}</h3>
                <p className="font-bold text-sm uppercase text-gray-500">ID SISTEM: {profileData.id}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {type === 'mitra' ? (
                    <>
                      <div className="border-t-4 border-black pt-2">
                         <p className="text-xs uppercase font-bold text-gray-500">Spesialisasi</p>
                         <p className="font-black uppercase text-lg">{profileData.specialty_role}</p>
                      </div>
                      <div className="border-t-4 border-black pt-2">
                         <p className="text-xs uppercase font-bold text-gray-500">Kinerja</p>
                         <p className="font-black uppercase text-lg">⭐ {profileData.rating} ({profileData.projects_completed} PROYEK)</p>
                      </div>
                      <div className="col-span-2 border-t-4 border-black pt-2">
                         <p className="text-xs uppercase font-bold text-gray-500">Rate Pekerjaan</p>
                         <p className="font-black uppercase text-lg">{profileData.hourly_rate_or_fee}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-t-4 border-black pt-2">
                         <p className="text-xs uppercase font-bold text-gray-500">Status Pembayaran</p>
                         <p className={`font-black uppercase text-lg ${profileData.is_payment_verified ? 'text-green-600' : 'text-red-600'}`}>
                           {profileData.is_payment_verified ? '✅ TERVERIFIKASI' : '❌ BELUM TOP-UP'}
                         </p>
                      </div>
                      <div className="border-t-4 border-black pt-2">
                         <p className="text-xs uppercase font-bold text-gray-500">Total Proyek Dibuat</p>
                         <p className="font-black uppercase text-lg">{profileData.total_projects_posted} SPK TERBIT</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AREA KHUSUS RIWAYAT PROYEK KLIEN */}
              {type === 'client' && (
                <div>
                  <h4 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
                    📋 RIWAYAT PROYEK ({clientProjects.length})
                  </h4>
                  
                  {clientProjects.length === 0 ? (
                    <p className="border-2 border-dashed border-gray-400 p-4 text-center font-bold text-gray-500 uppercase text-sm">
                      Klien ini belum pernah menerbitkan proyek.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {clientProjects.map((proj) => (
                        <div key={proj.id} className="border-4 border-black p-4 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-yellow-50 transition-colors">
                          <div>
                             <h5 className="font-black uppercase text-lg">{proj.title}</h5>
                             <div className="flex gap-3 text-xs font-bold text-gray-600 uppercase mt-1">
                               <span>{proj.service_type}</span>
                               <span>|</span>
                               <span>{proj.created_at}</span>
                             </div>
                          </div>
                          
                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                            <span className={`px-2 py-1 text-xs font-black uppercase border-2 border-black ${
                               proj.status === 'COMPLETED' ? 'bg-green-400' : 
                               proj.status === 'OPEN' ? 'bg-blue-300' : 
                               proj.status === 'DISPUTED' ? 'bg-red-400' : 'bg-yellow-300'
                             }`}>
                               {proj.status}
                            </span>
                            <span className="font-black text-blue-700 mt-2 sm:mt-1 tracking-tighter">
                              Rp {proj.budget.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t-8 border-black shrink-0">
           <button 
             onClick={onClose}
             className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-gray-800 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
           >
             TUTUP PANEL
           </button>
        </div>
      </div>
    </div>
  );
}