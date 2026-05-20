import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. Import Layouts
import MainLayout from '../layouts/MainLayout';
import ClientLayout from '../layouts/ClientLayout';
import MitraLayout from '../layouts/MitraLayout';

// 2. Import Pages
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

import VendorPerformance from '../pages/Admin/VendorPerformance';
import PosModule from '../pages/Admin/PosModule';
import AdminDropOff from '../pages/Admin/Dropoff';
import AdminSettings from '../pages/Admin/Settings';
import AdminLayout from '../layouts/AdminLayout';
import AdminEscrow from '../pages/Admin/Escrow';
import AdminMitraManagement from '../pages/Admin/MitraManagement';
import AdminArbitrase from '../pages/Admin/Arbitrase';

import ClientDashboard from '../pages/Client/Dashboard';
import ClientContracts from '../pages/Client/Contracts';
import ClientHistory from '../pages/Client/History';
import ClientMarketplace from '../pages/Client/Marketplace'


import MitraJobs from '../pages/Mitra/Jobs';
import MitraDashboard from '../pages/Mitra/Dashboard';
import MitraProjects from '../pages/Mitra/Projects';
import MitraWallet from '../pages/Mitra/Wallet';
import MitraInbox from '../pages/Mitra/Inbox'; 


import PublicMarketplace from '../pages/PublicMarketplace';
import About from '../pages/About';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            RUTE PUBLIK (Menggunakan MainLayout) 
        ========================================== */}
        
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public/marketplace" element={<PublicMarketplace />} />
          <Route path="/about" element={<About />} />
        
        {/* ==========================================
            RUTE ADMIN (Menggunakan AdminLayout) 
        ========================================== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/performance" replace />} />
          <Route path="performance" element={<VendorPerformance />} />
          <Route path="pos" element={<PosModule />} />
          <Route path="escrow" element={<AdminEscrow />} />
          <Route path="dropoff" element={<AdminDropOff />} />
          <Route path="mitra" element={<AdminMitraManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="arbitrase" element={<AdminArbitrase />} />
        </Route>

        {/* ==========================================
            RUTE KLIEN (Menggunakan ClientLayout) 
        ========================================== */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="marketplace" element={<ClientMarketplace/> }/>
          <Route path="contracts" element={<ClientContracts/>} />
          <Route path="history" element={<ClientHistory/>} />
        </Route>

        {/* ==========================================
            RUTE MITRA (Menggunakan MitraLayout) 
        ========================================== */}
        <Route path="/mitra" element={<MitraLayout />}>
          {/* Default diarahkan ke Jobs */}
          <Route index element={<Navigate to="/mitra/jobs" replace />} />
          <Route path="jobs" element={<MitraJobs />} />
          
          <Route path="dashboard" element={<MitraDashboard/>} />
          <Route path="projects" element={<MitraProjects/>} />
          <Route path="wallet" element={<MitraWallet/>} />
          <Route path="MitraInbox" element={<MitraInbox/>} />
        </Route>

        {/* ==========================================
            FALLBACK ROUTE (Jika URL tidak ditemukan) 
        ========================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}