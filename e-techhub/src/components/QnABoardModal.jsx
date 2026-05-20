import React, { useState, useEffect, useRef } from 'react';
import { getProjectQnA, submitProjectQnA } from '../services/api';

export default function QnABoardModal({ projectId, userId, onClose }) {
  const [qnaList, setQnaList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchQnA = async () => {
    setIsLoading(true);
    try {
      const data = await getProjectQnA(projectId);
      setQnaList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchQnA();
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await submitProjectQnA(projectId, { user_id: userId, message: inputText });
      setInputText('');
      fetchQnA(); // Refresh diskusi
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,204,0,1)] w-full max-w-3xl h-[80vh] flex flex-col relative">
        
        {/* HEADER MODAL */}
        <div className="bg-blue-300 border-b-8 border-black p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">PAPAN DISKUSI TERBUKA (Q&A)</h2>
            <p className="text-xs font-bold uppercase">ID PROYEK: {projectId} | PUBLIK</p>
          </div>
          <button onClick={onClose} className="bg-black text-white px-4 py-2 font-black text-xl hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            X TUTUP
          </button>
        </div>

        {/* AREA DISKUSI */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center font-black uppercase">MEMUAT DISKUSI...</div>
          ) : qnaList.length === 0 ? (
            <div className="text-center font-bold text-gray-500 border-4 border-dashed border-gray-400 p-8">
              BELUM ADA PERTANYAAN. JADILAH YANG PERTAMA BERTANYA!
            </div>
          ) : (
            qnaList.map((qna) => (
              <div key={qna.id} className={`border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${qna.is_client ? 'bg-yellow-100 ml-8' : 'bg-white mr-8'}`}>
                <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
                  <span className={`font-black text-sm uppercase ${qna.is_client ? 'text-blue-700' : 'text-black'}`}>
                    {qna.is_client ? '👑 ' : '💬 '}{qna.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">{qna.timestamp}</span>
                </div>
                <p className="text-sm font-bold leading-relaxed">{qna.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT PESAN PUBLIK */}
        <form onSubmit={handleSubmit} className="bg-white border-t-8 border-black p-4 flex gap-4">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="TULIS PERTANYAAN ATAU JAWABAN PUBLIK..."
            className="flex-1 border-4 border-black p-3 font-bold text-sm focus:outline-none focus:bg-blue-50"
          />
          <button type="submit" className="bg-black text-white px-8 font-black uppercase hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(100,150,255,1)] active:translate-y-1 active:shadow-none">
            KIRIM
          </button>
        </form>

      </div>
    </div>
  );
}