import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory, WS_BASE_URL } from '../services/api';

export default function ChatModal({ roomId, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('MENYAMBUNGKAN...');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    let socket = null;

    const fetchHistory = async () => {
      try {
        const data = await getChatHistory(roomId);
        if (isMounted) setMessages(data);
      } catch (error) {
        console.error("Gagal mengambil riwayat chat:", error);
      }
    };

    fetchHistory();

    socket = new WebSocket(`${WS_BASE_URL}/chat/ws/${roomId}/${userId}`);

    socket.onopen = () => {
      if (!isMounted) {
        socket.close();
        return;
      }
      setStatus('TERHUBUNG');
      ws.current = socket;
    };

    socket.onmessage = (event) => {
      if (isMounted) {
        const incomingMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, incomingMessage]);
      }
    };

    socket.onclose = () => {
      if (isMounted) {
        setStatus('TERPUTUS');
        ws.current = null;
      }
    };

    socket.onerror = (err) => {
      if (isMounted) {
        console.error("WS Error:", err);
        setStatus('ERROR');
      }
    };

    return () => {
      isMounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId, userId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ text: inputText }));
      setInputText('');
    } else {
      alert("Koneksi belum siap atau terputus dari server.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,204,0,1)] w-full max-w-2xl h-[80vh] flex flex-col font-mono text-black relative">
        
        {/* HEADER CHAT */}
        <div className="bg-yellow-300 border-b-8 border-black p-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">RUANG KOORDINASI</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs font-bold uppercase">ROOM ID: {roomId}</p>
              <span className={`text-[10px] px-2 py-0.5 font-black text-white ${status === 'TERHUBUNG' ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
                {status}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-black text-white px-4 py-2 font-black text-xl hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          >
            X TUTUP
          </button>
        </div>

        {/* AREA PESAN */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="m-auto text-center font-bold text-gray-400 uppercase">
              BELUM ADA PESAN. MULAI PERCAKAPAN.
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === userId;
              const isSystem = msg.is_system || msg.is_system_message;

              if (isSystem) {
                return (
                  <div key={index} className="mx-auto bg-red-600 text-white border-4 border-black p-2 max-w-md text-center text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse w-full">
                    {msg.text}
                  </div>
                );
              }

              // PERBAIKAN: Layout flex untuk mengatur letak gelembung Kiri/Kanan
              return (
                <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <span className="text-[10px] font-bold text-gray-500 mb-1">
                      {isMe ? 'ANDA' : 'REKAN KERJA'} • {msg.timestamp}
                    </span>
                    <div className={`border-4 border-black p-3 font-bold text-sm ${isMe ? 'bg-blue-300 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] text-right' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT PESAN */}
        <form onSubmit={handleSendMessage} className="bg-white border-t-8 border-black p-4 flex gap-4 shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={status !== 'TERHUBUNG'}
            placeholder={status === 'TERHUBUNG' ? "KETIK PESAN ANDA..." : "TUNGGU KONEKSI..."}
            className="flex-1 border-4 border-black p-3 font-bold text-sm focus:outline-none focus:bg-yellow-50 disabled:bg-gray-200"
          />
          <button 
            type="submit"
            disabled={status !== 'TERHUBUNG'}
            className="bg-black text-white px-8 font-black uppercase hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(255,204,0,1)] active:translate-y-1 active:shadow-none disabled:bg-gray-500 disabled:shadow-none"
          >
            KIRIM
          </button>
        </form>

      </div>
    </div>
  );
}