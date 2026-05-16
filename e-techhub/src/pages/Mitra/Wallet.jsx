import React, { useState, useEffect } from 'react';
import { getMitraWallet } from '../../services/api';

export default function MitraWallet() {
  const [wallet, setWallet] = useState({ available: 0, escrow: 0, history: [] });
  const mitraId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchWallet = async () => {
      if (!mitraId) return;
      try {
        const data = await getMitraWallet(mitraId);
        setWallet(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchWallet();
  }, [mitraId]);

  return (
    <div className="min-h-screen bg-white p-8 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter">SALDO ESCROW</h1>
        <p className="text-sm font-bold uppercase mt-2 text-gray-600 tracking-widest">
          MANAJEMEN PENDAPATAN & SPLIT PAYMENT
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="border-4 border-black p-8 bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black uppercase mb-2">SALDO BISA DITARIK (AVAILABLE)</p>
          <p className="text-5xl font-black tracking-tighter">Rp {wallet.available.toLocaleString('id-ID')}</p>
          <button className="mt-8 w-full bg-black text-white border-4 border-black py-4 font-black uppercase text-lg hover:bg-gray-800 transition active:translate-y-1">
            TARIK KE REKENING BANK
          </button>
        </div>

        <div className="border-4 border-black p-8 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black uppercase mb-2 flex items-center gap-2">
            <span>DANA TERTENTU (ESCROW AKTIF)</span>
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
          </p>
          <p className="text-5xl font-black tracking-tighter">Rp {wallet.escrow.toLocaleString('id-ID')}</p>
          <p className="mt-4 text-xs font-bold uppercase">
            *Dana ini berasal dari DP Klien. Akan cair ke saldo Available setelah BAST Digital diterbitkan oleh sistem.
          </p>
        </div>
      </div>

      <div className="border-4 border-black p-6 bg-white">
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">RIWAYAT SPLIT PAYMENT</h2>
        <div className="space-y-4">
          {wallet.history.length === 0 ? (
             <p className="font-bold">BELUM ADA RIWAYAT TRANSAKSI.</p>
          ) : wallet.history.map((trx) => (
            <div key={trx.id} className="flex justify-between items-center border-4 border-black p-4 hover:bg-gray-50">
              <div>
                <p className="font-black uppercase">{trx.type}</p>
                <p className="text-xs font-bold text-gray-500">{trx.date} | {trx.id}</p>
              </div>
              <div className="text-right">
                <p className={`font-black text-xl ${trx.amount.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {trx.amount}
                </p>
                <p className="text-xs font-bold uppercase bg-black text-white px-2 py-1 inline-block mt-1">
                  {trx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}