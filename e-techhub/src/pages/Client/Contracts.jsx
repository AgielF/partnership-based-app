import React, { useState, useEffect } from 'react';
import { getClientContracts } from '../../services/api';

export default function ClientContracts() {
  const [contracts, setContracts] = useState([]);
  const clientId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchContracts = async () => {
      if (!clientId) return;
      try {
        const data = await getClientContracts(clientId);
        setContracts(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchContracts();
  }, [clientId]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter">DOKUMEN E-CONTRACT</h1>
        <p className="text-sm font-bold text-gray-600 uppercase mt-2">LEGALITAS SPK & CLICK-WRAP AGREEMENT</p>
      </div>

      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-black text-white font-black uppercase text-sm">
              <th className="p-4 border-r-4 border-black">ID Dokumen</th>
              <th className="p-4 border-r-4 border-black">Jalur Layanan</th>
              <th className="p-4 border-r-4 border-black">Mitra Terkait</th>
              <th className="p-4 border-r-4 border-black">Status Signature</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr><td colSpan="5" className="p-4 font-bold text-center">TIDAK ADA KONTRAK</td></tr>
            ) : contracts.map((c, index) => (
              <tr key={c.id} className={`border-b-4 border-black hover:bg-gray-50 font-bold uppercase text-sm ${index % 2 !== 0 ? 'bg-gray-100' : 'bg-white'}`}>
                <td className="p-4 border-r-4 border-black">{c.id}</td>
                <td className="p-4 border-r-4 border-black">{c.type}</td>
                <td className="p-4 border-r-4 border-black">{c.mitra}</td>
                <td className={`p-4 border-r-4 border-black ${c.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {c.status === 'COMPLETED' ? 'SAH SECARA HUKUM' : 'MENUNGGU TINDAKAN'}
                </td>
                <td className="p-4">
                  {c.status !== 'COMPLETED' ? (
                     <button className="bg-blue-600 text-white border-2 border-black px-4 py-2 hover:bg-blue-700 active:translate-y-1">
                       SIGN (CLICK-WRAP)
                     </button>
                  ) : (
                     <button className="bg-white text-black border-2 border-black px-4 py-2 hover:bg-gray-200 active:translate-y-1">
                       UNDUH PDF
                     </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs font-bold text-red-600 uppercase">
        *Semua kontrak merujuk pada Pasal 1320 KUHPdt dan UU ITE yang berlaku.
      </p>
    </div>
  );
}