import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  
  // State untuk menangkap input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const data = await loginUser({ email, password });
      
      // Simpan token sesi, role, ID, dan NAMA ke LocalStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('name', data.name); // Baris ini penting untuk integrasi Layout
      
      // Arahkan ke dashboard sesuai role dari database
      if (data.role === 'admin') navigate('/admin/performance');
      else if (data.role === 'klien') navigate('/client/dashboard');
      else navigate('/mitra/jobs');
      
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-mono border-[16px] border-black">
      <div className="max-w-md w-full border-4 border-black bg-white p-8 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-blue-600 underline-offset-8">
            E-TECHHUB
          </h2>
          <p className="mt-4 text-sm font-bold uppercase text-gray-500 tracking-widest">
            Akses Platform O2O
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div className="mb-4 bg-red-600 text-white font-bold p-3 border-4 border-black uppercase text-xs">
            ERROR: {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="AGIEL@ETECHHUB.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-4 border-black p-3 focus:bg-blue-50 focus:outline-none font-bold placeholder:text-gray-300 transition-colors"
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
              className="w-full border-4 border-black p-3 focus:bg-blue-50 focus:outline-none font-bold  placeholder:text-gray-300 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white border-4 border-black py-4 font-black uppercase text-lg hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              MASUK SISTEM
            </button>
          </div>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t-4 border-black"></span>
          </div>
          <div className="relative flex justify-center text-xs font-black uppercase">
            <span className="px-4 bg-white text-black">ATAU MASUK SEBAGAI</span>
          </div>
        </div>

       

        <div className="mt-8 text-center border-t-4 border-black pt-6">
          <p className="text-sm font-bold uppercase">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-800 transition-colors">
              DAFTAR DISINI
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}