import React from 'react';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    // Tidak perlu sidebar atau header khusus jika LandingPage sudah menyediakannya,
    // Layout ini hanya meneruskan (pass-through) render dari anak komponennya.
    <div className="w-full min-h-screen bg-white">
      <Outlet />
    </div>
  );
}