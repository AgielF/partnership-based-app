import React, { useState, useEffect } from 'react';
import { getClientHistory } from '../../services/api';

export default function ClientHistory() {
  const [history, setHistory] = useState([]);
  const clientId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!clientId) return;
      try {
        const data = await getClientHistory(clientId);
        setHistory(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHistory();
  }, [clientId]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black">
      <div className="border-b-8 border-black pb-6 mb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter">RIWAYAT POS & FISIK</h1>
        <p className="text-sm font-bold text-gray-600 uppercase mt-2">TRANSAKSI LOKET, PEMBELIAN, & REFUND</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">TRANSAKSI BULAN INI</h2>
          
          {history.length === 0 ? (
             <p className="font-bold border-4 border-black p-4">BELUM ADA TRANSAKSI</p>
          ) : history.map((trx) => (
            <div key={trx.id} className={`border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${trx.amount.includes('+') ? 'bg-green-100 hover:bg-green-200' : 'bg-white hover:bg-gray-50'}`}>
              <div className="flex justify-between mb-2">
                <span className={`font-black uppercase text-lg ${trx.amount.includes('+') ? 'text-green-800' : ''}`}>{trx.type}</span>
                <span className={`font-bold text-sm px-2 py-1 ${trx.amount.includes('+') ? 'bg-green-800 text-white' : 'bg-black text-white'}`}>{trx.status}</span>
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase mb-4">{trx.date} | {trx.id}</p>
              <div className={`border-t-2 border-dashed pt-3 flex justify-between font-black ${trx.amount.includes('+') ? 'border-green-800 text-green-900' : 'border-black'}`}>
                <span>NILAI TRANSAKSI</span>
                <span>{trx.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-4 border-black p-8 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit">
          <h2 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">KLAIM GARANSI FISIK</h2>
          <p className="font-bold text-sm uppercase mb-6">
            Apakah perangkat keras yang diservis mengalami kendala lagi? Bawa bukti Kontrak Garansi dari sistem POS ke Drop-off Center terdekat.
          </p>
          <button className="w-full bg-black text-white border-4 border-black py-4 font-black uppercase hover:bg-gray-800 active:translate-y-1">
            CEK STATUS MASA GARANSI
          </button>
        </div>
      </div>
    </div>
  );
}