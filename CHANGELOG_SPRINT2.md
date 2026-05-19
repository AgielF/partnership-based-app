# Fitur Chat Realtime Klien - Mitra (Negosiasi Pra-Deal)

Dokumen ini menjelaskan perubahan kode untuk menambahkan fitur chat realtime antara klien dan mitra sebelum proses deal / kontrak final.

## Tujuan

- Menyediakan ruang obrolan realtime bagi klien dan mitra untuk bernegosiasi sebelum deal.
- Menyimpan riwayat chat ke database.
- Menyediakan inbox chat untuk menampilkan room yang pernah dibuka.
- Mencegah kebocoran data kontak pribadi di luar platform.

## File Utama yang Diubah

- `e-techhub-backend/app/routers/chat_router.py`
- `e-techhub-backend/app/models/domain_models.py`
- `e-techhub/src/components/ChatModal.jsx`
- `e-techhub/src/services/api.js`
- `e-techhub/src/pages/Client/Marketplace.jsx`
- `e-techhub/src/pages/Client/Contracts.jsx`
- `e-techhub/src/pages/Mitra/Inbox.jsx`

## 1. Backend: `chat_router.py`

### 1.1. ConnectionManager WebSocket

- Menyimpan koneksi per `room_id`.
- Menerima `WebSocket` baru dan menambahkan ke `active_connections`.
- Melepaskan koneksi pada disconnect.
- Broadcast pesan ke semua koneksi yang terdaftar di room yang sama.

### 1.2. Filter Konten Anti-Bypass

- Mendeteksi nomor telepon dan alamat email dalam pesan.
- Jika ditemukan, pesan diganti dengan pesan sistem:
  - `⚠️ [SISTEM MEMBLOKIR PESAN]: Dilarang mengirimkan informasi kontak pribadi di luar platform.`
- Pesan ini tetap disimpan sebagai pesan sistem.

### 1.3. Endpoint WebSocket

- Endpoint: `ws://<BASE_URL>/api/chat/ws/{room_id}/{user_id}`
- Parameter:
  - `room_id`: ID chat room, misalnya `NEGO-<clientId>-<mitraId>`.
  - `user_id`: ID pengguna yang mengirim pesan.
- Proses:
  1. Terima pesan teks JSON: `{ "text": "..." }`
  2. Validasi anti-bypass.
  3. Simpan `ChatMessage` ke database.
  4. Broadcast payload ke seluruh anggota room.

### 1.4. Endpoint REST untuk Riwayat Chat

- Endpoint: `GET /api/chat/history/{room_id}`
- Mengambil pesan berdasarkan `room_id` dan mengurutkan berdasarkan waktu.
- Respon:
  - `id`
  - `sender_id`
  - `text`
  - `is_system`
  - `timestamp`

### 1.5. Endpoint REST untuk Inbox Chat

- Endpoint: `GET /api/chat/inbox/{user_id}`
- Mengambil daftar `room_id` unik yang terkait user.
- Mengembalikan preview pesan terakhir dan judul room.
- Logika judul room mengekstrak peserta dari format `NEGO-CLIENTID-MITRAID`.

## 2. Model Database: `domain_models.py`

- Menambahkan model `ChatMessage` jika belum ada.
- Kolom penting:
  - `room_id`
  - `sender_id`
  - `message_text`
  - `is_system_message`
  - `created_at`

> Catatan: meski tidak ditampilkan langsung di dokumentasi ini, model harus menyediakan field `created_at` agar riwayat chat dapat diurutkan.

## 3. Frontend: `ChatModal.jsx`

### 3.1. Fungsionalitas

- Memanggil `getChatHistory(roomId)` untuk memuat pesan sebelumnya saat modal dibuka.
- Membuka koneksi WebSocket ke backend.
- Menyimpan reference WebSocket dengan `useRef`.
- Menangani event:
  - `onopen`: set status koneksi.
  - `onmessage`: terima pesan realtime dan tambahkan ke state.
  - `onclose`: update status.
  - `onerror`: log error.
- Mengirim pesan via WebSocket dalam format JSON.

### 3.2. Status Koneksi

- Menampilkan status di header chat:
  - `MENYAMBUNGKAN...`
  - `TERHUBUNG`
  - `TERPUTUS`
  - `ERROR`
- Disabled input dan tombol kirim saat belum `TERHUBUNG`.

### 3.3. Tampilan Pesan

- Pesan sendiri ditampilkan di sisi kanan dengan warna berbeda.
- Pesan lawan ditampilkan di kiri.
- Pesan sistem ditampilkan sebagai alert merah di tengah.

### 3.4. Scroll Otomatis

- Menggunakan `messagesEndRef` dan `scrollToBottom()` setiap kali `messages` berubah.

## 4. Frontend API Service: `services/api.js`

### 4.1. WebSocket Base URL

- `WS_BASE_URL` dibentuk dari `BASE_URL.replace(/^http/, 'ws')`.
- Contoh: `http://127.0.0.1:8000/api` → `ws://127.0.0.1:8000/api`.

### 4.2. Endpoint Riwayat Chat

- `getChatHistory(projectId)` → `GET ${BASE_URL}/chat/history/${projectId}`.

### 4.3. Endpoint Inbox Chat

- `getChatInbox(userId)` → `GET ${BASE_URL}/chat/inbox/${userId}`.

## 5. Integrasi Halaman Klien dan Mitra

### 5.1. Klien: `src/pages/Client/Marketplace.jsx`

- Menambahkan state `activeChatRoom`.
- Menggunakan `ChatModal` saat tombol chat/nego diklik.
- Room ID dibuat dengan pola `NEGO-${clientId}-${mitra.id}`.
- Ini memungkinkan negosiasi pra-deal langsung antara klien dan mitra.

### 5.2. Klien: `src/pages/Client/Contracts.jsx`

- Menambahkan state `activeChatProject`.
- Memanggil `ChatModal` menggunakan `projectId` sebagai room ID.
- Memungkinkan chat terkait kontrak yang sudah aktif.

### 5.3. Mitra: `src/pages/Mitra/Inbox.jsx`

- Menggunakan `getChatInbox(userId)` untuk menampilkan daftar room.
- Menampilkan judul negosiasi dan preview pesan terakhir.
- Menampilkan `ChatModal` saat room dipilih.

## 6. Alur Chat Realtime Pra-Deal

1. Klien klik tombol `Chat / Negosiasi` di halaman marketplace atau contracts.
2. Frontend membuka modal `ChatModal`.
3. `ChatModal` memuat riwayat chat dari backend.
4. `ChatModal` membuka WebSocket ke backend pada path `/api/chat/ws/{room_id}/{user_id}`.
5. Klien/mitra mengetik dan mengirim pesan.
6. Backend menyimpan pesan di database dan broadcast ke semua peserta room.
7. Pesan terbaru muncul realtime di kedua sisi.
8. Jika terdapat konten kontak pribadi, backend mengganti dengan pesan sistem dan tetap menolak kebocoran.

## 7. Rekomendasi Perbaikan / Pengembangan Selanjutnya

- Tambahkan autentikasi WebSocket agar hanya peserta room yang valid dapat terhubung.
- Simpan informasi `sender_name` dan `role` agar UI bisa menampilkan nama aktual.
- Tambahkan validasi `room_id` di backend agar hanya room `NEGO-*` dan room kontrak yang valid diterima.
- Buat endpoint REST khusus untuk membuat `room_id` negosiasi dari server, bukan membuat di frontend.
- Tambahkan notifikasi suara / badge pada pesan masuk di inbox.

## 8. Kesimpulan

Implementasi sudah menyediakan fitur chat realtime yang:

- Berbasis WebSocket untuk komunikasi instan.
- Menyimpan riwayat pesan untuk dilihat kembali.
- Memiliki inbox chat untuk mitra.
- Mengikat chat kepada room sebelum deal, khususnya negosiasi pra-deal.
- Menyaring pesan yang mengandung kontak pribadi.

> Perubahan utama difokuskan pada `chat_router.py` dan `ChatModal.jsx`, dengan dukungan API service dan integrasi halaman klien/mitra.
