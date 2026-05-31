// Ganti 127.0.0.1 menjadi IP jaringan lokal Anda saat testing di HP
const BASE_URL = 'http://127.0.0.1:8000/api';

// === ADMIN ===
export const getVendorPerformance = async () => {
  const response = await fetch(`${BASE_URL}/admin/performance`);
  if (!response.ok) throw new Error('Gagal mengambil data performa vendor');
  return response.json();
};

// === AUTH ===
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mendaftar akun');
  return data;
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Kredensial tidak valid');
  return data;
};

// === KLIEN ===
export const getClientContracts = async (clientId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/contracts`);
  if (!response.ok) throw new Error('Gagal mengambil data kontrak klien');
  return response.json();
};

export const getClientHistory = async (clientId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/transactions`);
  if (!response.ok) throw new Error('Gagal mengambil riwayat transaksi');
  return response.json();
};

export const getMitraDirectory = async () => {
  const response = await fetch(`${BASE_URL}/client/mitras`);
  if (!response.ok) throw new Error('Gagal mengambil daftar mitra');
  return response.json();
};

export const createProject = async (clientId, projectData) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal membuat proyek');
  return data;
};

// === MITRA ===
export const getMitraJobs = async () => {
  const response = await fetch(`${BASE_URL}/mitra/jobs`);
  if (!response.ok) throw new Error('Gagal mengambil data bursa kerja');
  return response.json();
};

export const getMitraProjects = async (mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/projects`);
  if (!response.ok) throw new Error('Gagal mengambil data proyek mitra');
  return response.json();
};

export const getMitraWallet = async (mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/wallet`);
  if (!response.ok) throw new Error('Gagal mengambil data dompet');
  return response.json();
};

export const approveContractUAT = async (clientId, contractId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/contracts/${contractId}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menyetujui UAT');
  return data;
};

export const getContractPDF = async (clientId, contractId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/contracts/${contractId}/pdf`);
  if (!response.ok) throw new Error('Gagal mengunduh dokumen PDF');
  return response.blob(); 
};

export const topUpOnline = async (clientId, amount) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/topup/online`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error('Gagal memproses Payment Gateway');
  return response.json();
};


export const getClientWallet = async (clientId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/wallet`);
  if (!response.ok) throw new Error('Gagal mengambil data dompet klien');
  return response.json();
};


export const topUpPhysical = async (userId, amount) => {
  const response = await fetch(`${BASE_URL}/admin/pos/topup/physical`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, amount }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal memproses transaksi kasir');
  return data;
};
export const getVendorPerformanceData = async () => {
  const response = await fetch(`${BASE_URL}/admin/performance`);
  if (!response.ok) throw new Error('Gagal menarik data kinerja');
  return response.json();
};

export const getActiveEscrows = async () => {
  const response = await fetch(`${BASE_URL}/admin/escrows`);
  if (!response.ok) throw new Error('Gagal menarik data escrow');
  return response.json();
};

export const refundEscrowToClient = async (projectId) => {
  const response = await fetch(`${BASE_URL}/admin/escrows/${projectId}/refund`, {
    method: 'POST'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal melakukan refund');
  return data;
};


// === MODUL ADMIN DROP-OFF ===
export const getPhysicalProjects = async () => {
  const res = await fetch(`${BASE_URL}/admin/dropoff`);
  if (!res.ok) throw new Error('Gagal menarik data drop-off');
  return res.json();
};

export const receiveDropOffDevice = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/dropoff/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal menerima perangkat');
  return result;
};

export const setProjectToUAT = async (projectId) => {
  const res = await fetch(`${BASE_URL}/admin/dropoff/${projectId}/uat`, { method: 'PUT' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal mengubah ke UAT');
  return result;
};

export const executeBAST = async (projectId) => {
  const res = await fetch(`${BASE_URL}/admin/dropoff/${projectId}/bast`, { method: 'PUT' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal mengeksekusi BAST');
  return result;
};

// TAMBAHKAN FUNGSI INI
export const getMitras = async () => {
  const res = await fetch(`${BASE_URL}/admin/mitras`);
  if (!res.ok) throw new Error('Gagal menarik daftar mitra');
  return res.json();
};


// === PILAR 1: KYC & KEPATUHAN ===
export const verifyMitraKyc = async (mitraId) => {
  const res = await fetch(`${BASE_URL}/admin/kyc/${mitraId}/verify`, { method: 'PUT' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal memverifikasi KYC');
  return result;
};

export const banUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/ban`, { method: 'PUT' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal memblokir pengguna');
  return result;
};

// === PILAR 3: ARBITRASE (SENGKETA) ===
export const markProjectDisputed = async (projectId) => {
  const res = await fetch(`${BASE_URL}/admin/escrows/${projectId}/dispute`, { method: 'PUT' });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal menandai sengketa');
  return result;
};

// === PILAR 5: KONFIGURASI SISTEM ===
export const getSystemSettings = async () => {
  const res = await fetch(`${BASE_URL}/admin/settings`);
  if (!res.ok) throw new Error('Gagal menarik pengaturan sistem');
  return res.json();
};

export const updateSystemSetting = async (key, value) => {
  const res = await fetch(`${BASE_URL}/admin/settings/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Gagal memperbarui pengaturan');
  return result;
};

// === FUNGSI INQUIRY ADMIN ===
export const checkUserName = async (userId) => {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/name`);
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Pengguna tidak ditemukan');
  return result; // Mengembalikan objek { id, name, role }
};

// Menarik data profil (termasuk kyc_status dan projects_completed)
export const getMitraProfile = async (mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/profile`);
  if (!response.ok) throw new Error('Gagal mengambil profil mitra dari database');
  return response.json();
};
// Tambahkan di bawah fungsi getMitraProfile Anda yang sudah ada
export const updateMitraProfile = async (mitraId, profileData) => {
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengupdate profil');
  return data;
};
// Fungsi mengambil proyek (mengirim mitra_id lewat body)
export const takeMitraProject = async (projectId, mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/jobs/${projectId}/take`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mitra_id: mitraId }) 
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengambil proyek');
  return data;
};


// Menolak KTP (KYC)
export const rejectMitraKyc = async (mitraId) => {
  const response = await fetch(`${BASE_URL}/admin/kyc/${mitraId}/reject`, { method: 'PUT' });
  if (!response.ok) throw new Error('Gagal menolak KTP mitra');
  return response.json();
};

export const signClientContract = async (projectId, clientId) => {
  // Ingat, kita mengirim clientId lewat query parameter (sesuai contoh di backend)
  // atau Anda bisa merancang endpointnya memakai Pydantic body
  const response = await fetch(`${BASE_URL}/client/contracts/${projectId}/sign?client_id=${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menandatangani kontrak');
  return data;
};

// Tambahkan di dalam src/services/api.js
export const signMitraContract = async (projectId, mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/projects/${projectId}/sign?mitra_id=${mitraId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menandatangani kontrak');
  return data;
};

// Fungsi untuk melaporkan progres atau mengajukan UAT
export const updateMitraProgress = async (projectId, mitraId, milestoneText) => {
  const response = await fetch(`${BASE_URL}/mitra/projects/${projectId}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mitra_id: mitraId, milestone_text: milestoneText })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengirim progres');
  return data;
};



// Menolak UAT (Mengubah status menjadi Disputed/Sengketa)
export const rejectClientUat = async (clientId, contractId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/contracts/${contractId}/reject`, {
    method: 'PUT'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menolak UAT');
  return data;
};


export const getClientPublicProfile = async (clientId) => {
  // Pastikan menembak ke mitra_router
  const response = await fetch(`${BASE_URL}/mitra/clients/${clientId}/public`);
  if (!response.ok) throw new Error('Gagal memuat profil klien');
  return response.json();
};

// Mengambil data publik Mitra (Tanpa data pribadi)
export const getMitraPublicProfile = async (mitraId) => {
  // Pastikan menembak ke client_router (karena Klien yang butuh info ini)
  const response = await fetch(`${BASE_URL}/client/mitras/${mitraId}/public`);
  if (!response.ok) throw new Error('Gagal memuat profil mitra');
  return response.json();
};


// Membuat Base URL untuk WebSockets secara dinamis.
// Mengubah string 'http://127.0.0.1:8000/api' menjadi 'ws://127.0.0.1:8000/api'
export const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

// Endpoint REST API untuk mengambil riwayat chat
export const getChatHistory = async (projectId) => {
  const response = await fetch(`${BASE_URL}/chat/history/${projectId}`);
  if (!response.ok) {
    throw new Error('Gagal memuat riwayat obrolan dari server.');
  }
  return response.json();
};

// Endpoint untuk mengambil daftar Kotak Masuk (Inbox)
export const getChatInbox = async (userId) => {
  const response = await fetch(`${BASE_URL}/chat/inbox/${userId}`);
  if (!response.ok) {
    throw new Error('Gagal memuat kotak masuk dari server.');
  }
  return response.json();
};

// ==========================================
// API PELACAKAN PROGRES (DELIVERABLES)
// ==========================================

// Mengambil daftar milestone (Bisa diakses Klien maupun Mitra)
export const getProjectDeliverables = async (role, projectId) => {
  // role harus berisi string 'client' atau 'mitra'
  const response = await fetch(`${BASE_URL}/${role}/projects/${projectId}/deliverables`);
  if (!response.ok) throw new Error('Gagal memuat detail progres proyek.');
  return response.json();
};

// Mitra mengirimkan bukti kerja
export const submitDeliverable = async (projectId, deliverableId, payload) => {
  const response = await fetch(`${BASE_URL}/mitra/projects/${projectId}/deliverables/${deliverableId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengirim progres.');
  return data;
};

// Klien mereview (Approve / Reject) bukti kerja
export const reviewDeliverable = async (projectId, deliverableId, payload) => {
  const response = await fetch(`${BASE_URL}/client/projects/${projectId}/deliverables/${deliverableId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengirim evaluasi.');
  return data;
};


// ==========================================
// API Q&A BOARD (DISKUSI PUBLIK)
// ==========================================
export const getProjectQnA = async (projectId) => {
  const response = await fetch(`${BASE_URL}/mitra/projects/${projectId}/qna`);
  if (!response.ok) throw new Error('Gagal memuat papan diskusi.');
  return response.json();
};

export const submitProjectQnA = async (projectId, payload) => {
  const response = await fetch(`${BASE_URL}/mitra/projects/${projectId}/qna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengirim pesan.');
  return data;
};


export const getDisputedProjects = async () => {
  const response = await fetch(`${BASE_URL}/admin/escrows/disputed`);
  if (!response.ok) throw new Error('Gagal mengambil data sengketa');
  return response.json();
};

export const resolveDisputeRefund = async (projectId) => {
  const response = await fetch(`${BASE_URL}/admin/escrows/${projectId}/refund`, { method: 'POST' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal melakukan refund');
  return data;
};

export const resolveDisputeForceRelease = async (projectId) => {
  const response = await fetch(`${BASE_URL}/admin/escrows/${projectId}/force-release`, { method: 'POST' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mencairkan dana ke mitra');
  return data;
};

export const approveClientUat = async (clientId, contractId, ratingScore = 5.0) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/contracts/${contractId}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: ratingScore }) // Suntikkan Payload
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menyetujui UAT');
  return data;
};

export const getMitraHistory = async (mitraId) => {
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/history`);
  if (!response.ok) throw new Error('Gagal mengambil riwayat proyek selesai');
  return response.json();
};

export const getClientProjectsHistory = async (clientId) => {
  const response = await fetch(`${BASE_URL}/mitra/clients/${clientId}/projects`);
  if (!response.ok) throw new Error('Gagal memuat riwayat proyek klien');
  return response.json();
};


// ==========================================
// API SISTEM PENAWARAN (BIDDING)
// ==========================================

// Mitra mengirimkan proposal penawaran
export const submitProjectBid = async (projectId, payload) => {
  const response = await fetch(`${BASE_URL}/mitra/jobs/${projectId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengirim penawaran.');
  return data;
};

// Klien melihat daftar penawaran masuk
export const getProjectBids = async (clientId, projectId) => {
  const response = await fetch(`${BASE_URL}/client/projects/${projectId}/bids`);
  if (!response.ok) throw new Error('Gagal memuat daftar penawaran.');
  return response.json();
};

// Klien menerima penawaran
export const acceptProjectBid = async (clientId, bidId) => {
  const response = await fetch(`${BASE_URL}/client/bids/${bidId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal menerima penawaran.');
  return data;
};

// ==========================================
// ALIAS UNTUK KOMPONEN BARU
// ==========================================
export const getDeliverables = getProjectDeliverables;


// Tambahkan ini di bagian paling bawah api.js Anda
export const uploadMitraAvatar = async (mitraId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${BASE_URL}/mitra/${mitraId}/upload-avatar`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengunggah foto profil');
  return data;
};

// Mengupdate Profil Klien (Nama / Deskripsi / Avatar)
export const updateClientProfile = async (clientId, profileData) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal memperbarui profil klien');
  return data;
};

// Mengunggah Foto Profil Klien
export const uploadClientAvatar = async (clientId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${BASE_URL}/client/${clientId}/upload-avatar`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Gagal mengunggah foto');
  return data;
};

// Mengambil Profil Klien (Bukan Publik, melainkan Private untuk Dashboard)
export const getClientPrivateProfile = async (clientId) => {
  const response = await fetch(`${BASE_URL}/client/${clientId}/private-profile`);
  if (!response.ok) throw new Error('Gagal menarik profil klien');
  return response.json();
};