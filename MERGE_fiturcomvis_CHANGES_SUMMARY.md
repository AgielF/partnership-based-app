# Ringkasan Perubahan Merge Fitur ComVis

Tanggal: 20 Mei 2026  
Branch: `origin/fiturcomvis` → `main`

---

## 📋 File yang Dimodifikasi

### 1. `app/core/database.py`
**Status**: Tidak ada perubahan signifikan

Konfigurasi database MySQL tetap sama:
- Connection string: `mysql+pymysql://root:@localhost:3306/etechhub_db`
- SessionLocal & dependency injection tetap konsisten

---

### 2. `app/routers/admin_router.py`
**Status**: **Perubahan Besar** ✨


#### Import Tambahan
```python
# Computer Vision
import base64
import numpy as np
import cv2

# Notifikasi Real-Time
from app.routers.notification_router import notif_manager
```

#### Skema Baru
- `CashScanRequest` - menerima gambar base64 untuk deteksi uang

---

## 🎯 Fitur & Endpoint Baru

### 1. **KYC Verification dengan Notifikasi** ✅
- `PUT /api/admin/kyc/{mitra_id}/verify` - Verifikasi KYC Mitra
  - Mengirim notifikasi ke Mitra: `✅ KYC DIVERIFIKASI`
  - Mitra bisa mengambil proyek setelah verifikasi

- `PUT /api/admin/kyc/{mitra_id}/reject` - Tolak KYC
  - Mengirim notifikasi ke Mitra: `❌ KYC DITOLAK`
  - Instruksi untuk mengunggah KTP ulang

### 2. **Sistem Arbitrase (Meja Hijau Admin)** ⚖️
- `GET /api/admin/escrows/disputed` - Ambil daftar proyek sengketa
  - Menampilkan: `id`, `title`, `client_id`, `mitra_id`, `budget`, `current_milestone`

- `POST /api/admin/escrows/{project_id}/refund` - Menangkan Klien (Refund Dana)
  - Mengurangi Escrow Klien
  - Menambah Saldo Klien
  - **Notifikasi ke Klien & Mitra** tentang keputusan
  - Status proyek: `CANCELLED`

- `POST /api/admin/escrows/{project_id}/force-release` - Menangkan Mitra (Paksa Cair)
  - Mengurangi Escrow Klien
  - Menambah Saldo Mitra (setelah dipotong komisi platform)
  - Catat dua transaksi: `FORCE RELEASE` (Klien) & `PENERIMAAN DANA` (Mitra)
  - **Notifikasi ke Klien & Mitra** tentang keputusan
  - Increment `projects_completed` Mitra
  - Status proyek: `COMPLETED`

### 3. **Drop-Off & BAST (Layanan Loket Fisik)** 📦
- `POST /api/admin/dropoff/receive` - Terima Perangkat di Kasir
  - Tarik escrow dari Klien
  - Buat proyek baru (tipe: `SERVIS HARDWARE`)
  - **Notifikasi ke Klien**: `📦 PERANGKAT DITERIMA`

- `PUT /api/admin/dropoff/{project_id}/bast` - Terbitkan BAST & Transfer Dana
  - Ambil persentase komisi dari tabel `SystemSetting`
  - Potong Escrow Klien
  - Transfer ke Mitra (setelah potong komisi)
  - Masukkan komisi ke dompet Admin (`wallet.balance`)
  - Catat transaksi `PEMBAYARAN SPK SELESAI`

### 4. **Sistem Konfigurasi Makro** ⚙️
- `GET /api/admin/settings` - Ambil semua konfigurasi sistem global
- `PUT /api/admin/settings/{key}` - Update konfigurasi sistem
  - Contoh: `PLATFORM_FEE` = `0.05` (5% komisi)

### 5. **AI Computer Vision - Deteksi Uang** 🤖
- `POST /api/admin/scan-cash` - Scan Autentisitas Uang
  - Input: Gambar base64 dari Webcam/File Upload
  - Output: 
    ```json
    {
      "status": "success",
      "hasil_deteksi": "ASLI" | "PALSU",
      "confidence": 85.5,
      "message": "..."
    }
    ```
  - **Algoritma**:
    1. Decode Base64 → gambar OpenCV
    2. Convert RGB → Grayscale
    3. Hitung **Laplacian Variance** (ukuran ketajaman tekstur)
    4. Threshold ketajaman: **35.0** (turun dari 100, untuk webcam modern)
    5. Scoring:
       - Jika `laplacian_var > 35` → **"ASLI"** (75-99% confidence)
       - Jika `laplacian_var ≤ 35` → **"PALSU"** (10-74% confidence)

---

## 🔔 Notifikasi Real-Time Terintegrasikan

Fitur-fitur berikut sekarang mengirim notifikasi otomatis melalui `notif_manager`:

| Aksi | Penerima | Pesan |
|------|----------|-------|
| KYC Verifikasi | Mitra | ✅ KYC DIVERIFIKASI |
| KYC Ditolak | Mitra | ❌ KYC DITOLAK |
| Terimaan Drop-Off | Klien | 📦 PERANGKAT DITERIMA |
| Arbitrase Refund | Klien & Mitra | ⚖️ SENGKETA SELESAI (Klien menang) |
| Arbitrase Force Release | Klien & Mitra | ⚖️ SENGKETA SELESAI (Mitra menang) |

---

## 🛠 Perubahan Model Database (Implied)

**Tabel yang diakses/diasumsikan ada**:
- `users` - User profile
- `mitra_profiles` - Profile lengkap Mitra dengan KYC
- `projects` - Proyek dengan status tracking
- `wallets` - Saldo & Escrow per user
- `transactions` - Audit log transaksi
- `system_settings` - Konfigurasi global platform

---

## 📊 Alur Integrasi Fitur

```
┌─────────────────────────────────────┐
│      Admin Dashboard                │
└─────────────────────────────────────┘
           ↓
    ┌──────┴──────┬────────┬──────────┐
    ↓             ↓        ↓          ↓
┌────────┐  ┌────────┐ ┌──────┐ ┌──────────┐
│  KYC   │  │Arbitrase│ │POS   │ │ComVision │
│Verif   │  │(Meja H) │ │Drop-Off
 │  CV     │
└────────┘  └────────┘ └──────┘ └──────────┘
    ↓             ↓        ↓          ↓
    └──────────────┬──────────────────┘
                   ↓
            ┌─────────────┐
            │notif_manager│ (WebSocket)
            └─────────────┘
                   ↓
            ┌─────────────┐
            │   Users     │
            └─────────────┘
```

---

## ✅ Checklist Implementasi Frontend

- [ ] Halaman Admin KYC Verification (Approve/Reject)
- [ ] Halaman Admin Arbitrase dengan detail sengketa
- [ ] Modal POS Drop-Off untuk kasir loket
- [ ] Component ComVision Webcam Scanner untuk uang
- [ ] Integrasi WebSocket di `NotificationBell.jsx` untuk notifikasi real-time
- [ ] Update endpoint API calls di `api.js` untuk endpoint baru

---

## 🚀 Catatan Teknis

1. **Computer Vision**:
   - Menggunakan **Laplacian Variance** lokal (tanpa ML/DL)
   - Threshold disesuaikan untuk webcam modern (dari 100 → 35)
   - Output: hasil deteksi + confidence score

2. **Notifikasi Async**:
   - Semua handler arbitrase & KYC menggunakan `async` dengan `await notif_manager.send_personal_notification()`
   - Notifikasi dikirim **bersamaan** dengan update database

3. **Komisi Platform**:
   - Diambil dari `SystemSetting.PLATFORM_FEE` (default 5%)
   - Komisi masuk ke wallet Admin saat BAST dieksekusi

4. **Audit Trail**:
   - Setiap transaksi dicatat di tabel `transactions` dengan timestamp & deskripsi lengkap

---

## 🐛 Potential Issues & Mitigations

| Issue | Mitigasi |
|-------|----------|
| ComVision threshold berbeda di kamera berbeda | Buat UI setting threshold adjustable di `/api/admin/settings` |
| WebSocket notifikasi tidak diterima | Pastikan `notif_manager` instance di startup backend |
| Komisi platform tidak tersimpan saat BAST | Check wallet `admin_wallet` tersedia di database |
| KYC notifikasi gagal | Fallback: catat error ke log; user bisa cek status manual |

---

## 📝 Rekomendasi Commit Message

```
Merge fitur ComVis: KYC auto-notif, arbitrase admin, POS drop-off, CV money scan

- Tambah KYC verification dengan notifikasi real-time
- Implementasikan sistem arbitrase (refund/force-release) dengan transaksi audit
- Integrasikan POS drop-off loket fisik dengan BAST & komisi platform
- Tambah endpoint computer vision untuk scan autentisitas uang (Laplacian Variance)
- Integrasikan notif_manager untuk real-time notifications across features
- Update model assumptions untuk escrows, transactions, system_settings
```
