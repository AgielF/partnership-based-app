import React, { useState, useEffect } from 'react';
import { getChatInbox } from '../../services/api';
import ChatModal from '../../components/ChatModal'; // Gunakan ChatModal yang sudah ada

export default function MitraInbox() {
  const [inboxList, setInboxList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  
  const userId = localStorage.getItem('user_id');

  const fetchInbox = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getChatInbox(userId);
      setInboxList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [userId]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-mono text-black relative">
      
      {/* RENDER MODAL CHAT JIKA ADA ROOM YANG DIPILIH */}
      {activeChatRoom && (
        <ChatModal 
          roomId={activeChatRoom} 
          userId={userId} 
          onClose={() => {
            setActiveChatRoom(null);
            fetchInbox(); // Refresh list inbox saat modal ditutup untuk update pesan terakhir
          }} 
        />
      )}

      <div className="border-b-8 border-black pb-6 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">KOTAK MASUK</h1>
          <p className="text-sm font-bold text-gray-600 uppercase mt-2">PESAN NEGOSIASI DAN KOORDINASI PROYEK</p>
        </div>
        <button 
          onClick={fetchInbox}
          className="bg-yellow-300 text-black border-4 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          🔄 REFRESH
        </button>
      </div>

      {isLoading ? (
        <div className="border-4 border-black p-8 font-black uppercase text-center bg-gray-100">
          MEMUAT KOTAK MASUK...
        </div>
      ) : inboxList.length === 0 ? (
        <div className="border-4 border-black p-8 font-black uppercase text-center text-gray-500 border-dashed">
          KOTAK MASUK KOSONG. BELUM ADA PESAN MASUK.
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {inboxList.map((chat, index) => (
            <div 
              key={index} 
              className="border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-blue-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1 overflow-hidden">
                <h3 className="text-xl font-black uppercase truncate">{chat.title}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">ID RUANG: {chat.room_id}</p>
                <div className={`p-2 border-2 border-black font-bold text-sm truncate ${chat.is_system ? 'bg-red-200 text-red-800' : 'bg-gray-100'}`}>
                  {chat.last_message ? `"${chat.last_message}"` : "Belum ada pesan."}
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-2">Pesan terakhir: {chat.timestamp}</p>
              </div>
              
              <button 
                onClick={() => setActiveChatRoom(chat.room_id)}
                className="bg-black text-white px-6 py-3 font-black uppercase hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(255,204,0,1)] active:translate-y-1 active:shadow-none whitespace-nowrap"
              >
                💬 BUKA OBROLAN
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}