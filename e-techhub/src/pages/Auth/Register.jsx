import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  
  // State untuk menangkap input form
  const [role, setRole] = useState('klien'); // sesuaikan dengan backend enum
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    
    try {
      await registerUser({ name, email, password, role });
      setStatusMsg({ type: 'success', text: 'Registrasi berhasil! Mengalihkan ke login...' });
      
      // Jeda sebentar agar user bisa membaca pesan sukses
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      setStatusMsg({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-mono border-[16px] border-black">
      <div className="max-w-xl w-full border-4 border-black bg-white p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-blue-600 underline-offset-8">
            JOIN THE HUB
          </h2>
          <p className="mt-4 text-sm font-bold uppercase text-gray-500 tracking-widest">
            Mulai karir atau cari solusi IT sekarang.
          </p>
        </div>

        {/* Notifikasi Status */}
        {statusMsg.text && (
          <div className={`mb-6 font-bold p-4 border-4 border-black uppercase text-sm ${statusMsg.type === 'success' ? 'bg-green-400 text-black' : 'bg-red-600 text-white'}`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 border-4 border-black overflow-hidden">
            <button
              type="button"
              onClick={() => setRole('klien')}
              className={`py-3 font-black uppercase text-sm transition-colors ${
                role === 'klien' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              SAYA KLIEN
            </button>
            <button
              type="button"
              onClick={() => setRole('mitra')}
              className={`py-3 font-black uppercase text-sm border-l-4 border-black transition-colors ${
                role === 'mitra' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              SAYA MITRA
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                placeholder="NAMA ANDA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-4 border-black p-3 focus:bg-blue-50 focus:outline-none font-bold placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Email Aktif</label>
              <input
                type="email"
                required
                placeholder="USER@ETECHHUB.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-4 border-black p-3 focus:bg-blue-50 focus:outline-none font-bold  placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-4 border-black p-3 focus:bg-blue-50 focus:outline-none font-bold  placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white border-4 border-black py-4 font-black uppercase text-lg hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              BUAT AKUN SEKARANG
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t-4 border-black pt-6">
          <p className="text-sm font-bold uppercase">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 underline hover:text-blue-800">
              MASUK DISINI
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}