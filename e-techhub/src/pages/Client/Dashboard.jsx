import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientContracts, approveContractUAT, topUpOnline, getContractPDF, getClientWallet } from '../../services/api';

export default function ClientDashboard() {
  const [contracts, setContracts] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, escrow_balance: 0 });
  
  const clientId = localStorage.getItem('user_id');
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!clientId) return;
    try {
      const contractData = await getClientContracts(clientId);
      setContracts(contractData);
      
      const walletData = await getClientWallet(clientId);
      setWallet(walletData);
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
        // 1. CEK APAKAH SCRIPT MIDTRANS SUDAH TERLOAD DI BROWSER
        if (!window.snap) {
          alert("Sistem pembayaran (Midtrans) belum siap atau terblokir. Matikan AdBlocker atau refresh halaman.");
          return;
        }

        console.log("Meminta token ke server untuk nominal:", nominal);
        const responseData = await topUpOnline(clientId, parseFloat(nominal));
        
        console.log("Respon dari server:", responseData);
        if (!responseData.token) {
          throw new Error("Token Snap tidak diterima dari server. Cek Server Key Midtrans di Backend.");
        }

        console.log("Token didapat, membuka popup Midtrans...");
        window.snap.pay(responseData.token, {
          onSuccess: async function(result){
            try {
              // Hack khusus Localhost: Frontend yang memicu Webhook Backend
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
              console.error("Gagal memanggil webhook lokal:", error);
            }
          },
          onPending: function(result){
            alert("Menunggu pembayaran Anda. Silakan selesaikan instruksi.");
          },
          onError: function(result){
            alert("Pembayaran gagal!");
          },
          onClose: function(){
            alert("Anda menutup jendela pembayaran sebelum menyelesaikannya.");
          }
        });

      } catch (e) {
        console.error("DETAIL ERROR:", e);
        alert(`Gagal memproses pembayaran: ${e.message}`);
      }
    } else {
      alert("Nominal tidak valid.");
    }
  };
  const handleApproveUAT = async (contractId) => {
    if (window.confirm('Apakah Anda yakin hasil kerja sudah sesuai? Dana escrow akan dilepas ke Mitra.')) {
      
      // Minta Klien untuk memberikan rating (1-5)
      let inputRating = prompt("Beri rating kinerja Mitra dari skala 1.0 hingga 5.0 (Contoh: 4.5):", "5.0");
      let finalRating = parseFloat(inputRating);
      
      // Validasi Angka
      if (isNaN(finalRating) || finalRating < 1.0 || finalRating > 5.0) {
        alert("Format rating tidak valid, sistem secara default akan memberikan Bintang 5.0");
        finalRating = 5.0;
      }

      try {
        await approveContractUAT(clientId, contractId, finalRating); // Kirim rating ke backend
        alert(`BAST Berhasil Diterbitkan! Anda memberikan bintang ${finalRating}.`);
        fetchData(); 
      } catch (error) {
        alert(`Gagal: ${error.message}`);
      }
    }
  };

  const handleViewPDF = async (contractId) => {
    try {
      const blob = await getContractPDF(clientId, contractId);
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      alert(`Gagal membuka PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black">
      <header className="flex flex-col md:flex-row justify-between items-end border-b-8 border-black pb-6 mb-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">KLIEN HUB</h1>
          <p className="text-lg font-bold text-gray-600 uppercase mt-2">RINGKASAN PROYEK & KONTRAK AKTIF</p>
        </div>
        <button 
          onClick={() => navigate('/client/marketplace')}
          className="mt-4 md:mt-0 bg-blue-600 text-white border-4 border-black px-6 py-3 font-black uppercase hover:bg-blue-700 transition shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
        >
          + BUAT PROYEK BARU
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
        
        <div className="space-y-6">
          <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-blue-50">
            <h2 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">SALDO DOMPET</h2>
            <p className="text-xs font-bold uppercase text-gray-500">BISA DITARIK / DIGUNAKAN</p>
            <p className="text-4xl font-black tracking-tighter mb-4">
              Rp {wallet.balance.toLocaleString('id-ID')}
            </p> 
            
            <button onClick={handleTopUp} className="w-full bg-green-500 text-black border-4 border-black py-3 font-black uppercase hover:bg-green-600 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mb-4">
              + TOP UP (ONLINE)
            </button>

            <div className="border-t-4 border-black pt-4">
              <p className="text-xs font-bold uppercase text-gray-500">TERTENTU / DANA ESCROW KONTRAK</p>
              
              <p className="text-2xl font-black tracking-tighter text-red-600">
                Rp {wallet.escrow_balance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h2 className="text-xl font-black uppercase mb-2 border-b-4 border-black pb-2">MANAJEMEN KEUANGAN</h2>
            <div className="mt-2 p-3 bg-white border-2 border-black border-dashed mb-4">
              <p className="text-xs font-bold text-gray-600 uppercase">
                *Sistem menahan dana hingga Anda menyetujui UAT (User Acceptance Testing) atau BAST diterbitkan.
              </p>
            </div>
            <button 
              onClick={() => navigate('/client/history')}
              className="w-full mt-2 bg-black text-white border-4 border-black py-3 font-black uppercase hover:bg-gray-800 transition"
            >
              LIHAT RIWAYAT DANA
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-4">
            <span className="bg-black text-white px-3 py-1">E-CONTRACT</span> AKTIF
          </h2>

          <div className="space-y-6">
            {contracts.length === 0 ? (
              <p className="font-bold uppercase text-gray-500 border-4 border-black p-6">TIDAK ADA KONTRAK AKTIF.</p>
            ) : contracts.map((contract) => (
              <div key={contract.id} className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-gray-50 transition">
                <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase">{contract.title}</h3>
                    <p className="text-sm font-bold mt-1 uppercase text-gray-600">MITRA: {contract.mitra}</p>
                  </div>
                  <span className={`px-4 py-2 text-sm font-black uppercase border-4 border-black ${
                    contract.status === 'COMPLETED' ? 'bg-green-400' : 
                    contract.status === 'MENUNGGU UAT' ? 'bg-yellow-400' : 'bg-white'
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
                    <p className="font-bold">{contract.milestone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500">Nilai Escrow</p>
                    <p className="font-bold font-sans tracking-tight">{contract.escrow}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {contract.status === 'MENUNGGU UAT' && (
                    <button 
                      onClick={() => handleApproveUAT(contract.id)}
                      className="flex-1 bg-black text-white border-4 border-black py-3 font-black uppercase hover:bg-gray-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      SETUJUI UAT (RELEASE DANA)
                    </button>
                  )}
                  <button 
                    onClick={() => handleViewPDF(contract.id)}
                    className="flex-1 bg-white text-black border-4 border-black py-3 font-black uppercase hover:bg-gray-100 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                  >
                    LIHAT PDF SPK
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}