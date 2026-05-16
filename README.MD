# E-TechHub: Platform On-Demand Layanan IT Terintegrasi Sistem POS & Kontrak Elektronik

> **Arsitektur Ekosistem:** Online-to-Offline (O2O) | B2B2C Platform Kemitraan (Gig Economy)
> **Prinsip Dasar:** Secure by Design & ACID Compliance
> **Penyusun:** Agiel Fernanda Putra (NRP: 152022032) - Informatika, Institut Teknologi Nasional (ITENAS) Bandung

---

## 📌 Deskripsi Proyek
E-TechHub memecah batasan tradisional antara platform freelance online murni (software/web) dengan bengkel reparasi hardware fisik. Sistem ini mengintegrasikan keduanya ke dalam satu ekosistem hibrida **Online-to-Offline (O2O)**. Platform ini dilengkapi dengan sistem pembuatan kontrak elektronik (Click-Wrap Contract) yang sah secara hukum perikatan digital, sistem Kasir Fisik (Point of Sale) untuk transaksi loket, serta tata kelola escrow terpusat guna menjamin keamanan finansial Klien dan Mitra Pekerja Lepas.

Sistem dikembangkan menggunakan arsitektur **Monorepo** demi menyelaraskan siklus hidup integrasi data *fullstack* secara konsisten.

---

## 📂 Struktur Repositori (Monorepo)
```text
e-techhub/                     # Repositori Utama Induk
├── .gitignore                 # Konfigurasi Git Global (Abaikan node_modules, venv, cache)
├── e-techhub-backend/         # Subsistem Core Backend (FastAPI, Python)
│   ├── app/
│   │   ├── core/              # Security, Database Engine, & Middleware Configuration
│   │   ├── models/            # SQLAlchemy Domain Models (MySQL)
│   │   ├── routers/           # REST API Endpoints Router (admin_router, etc.)
│   │   └── schemas/           # Pydantic Input/Response Schemas
│   ├── requirements.txt       # Python Dependency Manifest
│   └── venv/                  # Python Virtual Environment (Lokal)
└── e-techhub-frontend/        # Subsistem Client-Side Interface (React JS, Vite)
    ├── package.json           # Node.js Dependency Manifest
    ├── node_modules/          # Javascript Packages (Lokal)
    └── src/
        ├── layouts/           # Role-Based Master Layouts (AdminLayout, ClientLayout, etc.)
        ├── pages/             # Interface Pages (Admin, Client, Mitra, Public)
        └── services/          # API Services Client (Fetch Bridge)


## 📊 Matriks Progres & Fitur Sistem

### 1. Modul Admin (Otoritas Tata Kelola / Governance Authority)
Admin bertindak sebagai *gatekeeper* netral, mediator sengketa, dan pengendali regulasi makro finansial di dalam platform E-TechHub.

| Pilar Tata Kelola | Fitur Operasional & Standar Industri | Status | Komponen Frontend | Endpoint API & Dampak Database |
| :--- | :--- | :---: | :--- | :--- |
| **Pilar 1: KYC & Kepatuhan** | **Validasi Anti-Fraud Tiga Lapis:** Verifikasi identitas Mitra wajib melalui pencocokan **QR Code Scanner** menggunakan kamera (via `html5-qrcode`). Mengeliminasi pendaftaran teknisi fiktif secara instan. | `[x] DONE` | `AdminMitraManagement.jsx` | `PUT /api/admin/kyc/{mitra_id}/verify`<br>Mengubah `kyc_status` menjadi `'VERIFIED'`. |
| | **Sajian Terpisah (SOP Antrean):** Memisahkan baris data Mitra secara kaku ke dalam 3 kompartemen visual (*⏳ Antrean Baru, ✅ Vendor Aktif, 🚫 Riwayat Blokir*) untuk akurasi fokus kerja Admin. | `[x] DONE` | `AdminMitraManagement.jsx` | `GET /api/admin/mitras`<br>Menarik seluruh profil dengan metode *lazy loading* aman. |
| | **Otoritas Pemblokiran (Banning):** Penangguhan hak akses seketika terhadap akun Mitra yang melanggar SLA (*Service Level Agreement*) atau terindikasi melakukan kecurangan lapangan. | `[x] DONE` | `AdminMitraManagement.jsx` | `PUT /api/admin/users/{user_id}/ban`<br>Mengubah status menjadi `'BANNED'` dan mengunci akses bursa kerja. |
| **Pilar 2: Finansial & POS** | **4-Step Settlement Top-Up Fisik:** Proses kasir loket aman lewat fase *Inquiry Database* untuk menarik nama asli penerima guna mencegah salah ketik ID, diikuti verifikasi verbal, validasi uang tunai lewat mesin UV, dan cetak struk. | `[x] DONE` | `PosModule.jsx` | `GET /api/admin/users/{user_id}/name`<br>Membaca relasi nama dan role.<br>`POST /api/admin/pos/topup/physical`<br>Menambah `balance` di tabel `wallets`. |
| **Pilar 3: Arbitrase Sengketa** | **Pembekuan Escrow (Freeze):** Penguncian sepihak oleh Admin pada proyek yang mengalami sengketa kerja di lapangan untuk mengamankan uang Klien agar tidak bisa dicairkan oleh Mitra selama masa investigasi. | `[x] DONE` | `AdminEscrow.jsx` | `PUT /api/admin/escrows/{project_id}/dispute`<br>Mengubah status proyek menjadi `'DISPUTED'` secara paksa. |
| | **Forced Refund (Arbitrase Mutlak):** Pembalikan dana jaminan secara utuh dari brankas escrow platform kembali ke saldo utama Klien pasca proses mediasi fisik selesai dilaksanakan. | `[x] DONE` | `AdminEscrow.jsx` | `POST /api/admin/escrows/{project_id}/refund`<br>Mengurangi `escrow_balance` Klien, menambah `balance` Klien, status `CANCELLED`. |
| **Pilar 4: Drop-Off Center** | **Intake & Escrow Locking:** Penerimaan fisik perangkat keras di loket, penerbitan SPK digital otomatis ke bursa kerja, bersamaan dengan penahanan saldo *pre-funding* Klien ke akun penampung bersama. | `[x] DONE` | `AdminDropOff.jsx` | `POST /api/admin/dropoff/receive`<br>Membuat baris `projects` baru (`status='OPEN'`), memindahkan dana ke `escrow_balance`. |
| | **Quality Control & Physical UAT:** Mengubah status proyek menjadi peninjauan akhir setelah Mitra mendemokan keberhasilan perbaikan di depan Admin dan Klien di meja loket Drop-Off. | `[x] DONE` | `AdminDropOff.jsx` | `PUT /api/admin/dropoff/{project_id}/uats`<br>Mengubah status proyek fisik menjadi `'MENUNGGU UAT'`. |
| | **Zero-Sum Payout & Platform Fee:** Pelepasan dana komitmen dengan memotong komisi platform secara dinamis. Escrow Klien berkurang, dompet Mitra bertambah (Upah Bersih), dompet Admin bertambah (Pendapatan Komisi). | `[x] DONE` | `AdminDropOff.jsx` | `PUT /api/admin/dropoff/{project_id}/bast`<br>Mengubah status menjadi `'COMPLETED'`, membagi dana riil secara simultan ke 3 dompet. |
| **Pilar 5: Konfigurasi Makro** | **Parameter Regulasi Dinamis:** Panel kendali bagi manajemen untuk merubah konstanta nilai potongan komisi platform (`PLATFORM_FEE`) atau batas hari auto-refund tanpa menyentuh *source code* backend. | `[x] DONE` | `AdminSettings.jsx` | `GET /api/admin/settings`<br>`PUT /api/admin/settings/{key}`<br>Merubah nilai konfigurasi pada tabel `system_settings`. |

---

### 2. Modul Klien (Aktor Permintaan / Demand)
Fasilitas antarmuka bagi pengguna pemilik modal/perangkat untuk mengajukan kebutuhan solusi teknologi.

| Cakupan Fitur | Deskripsi Fungsi Finansial & Operasional | Status | Komponen Terkait |
| :--- | :--- | :---: | :--- |
| **Dasbor Finansial** | Pemantauan grafik transparan mengenai total aset, jumlah saldo yang sedang membeku di sistem escrow, serta pelacakan milestone proyek berjalan. | `[x] DONE` | `ClientDashboard.jsx` |
| **Bursa Marketplace** | Formulir penerbitan spesifikasi kebutuhan proyek baru, baik tender perangkat lunak (Software) maupun penitipan unit perbaikan fisik (Hardware). | `[x] DONE` | `ClientMarketplace.jsx` |
| **Click-Wrap Contract** | Sistem penandatanganan dokumen perjanjian elektronik satu kali klik yang sah secara hukum perikatan digital saat menyetujui Mitra pelaksana. | `[x] DONE` | `ClientContracts.jsx` |
| **Buku Besar Pengeluaran** | Akses transparansi berkas mutasi keluar-masuk dana virtual ledger secara *real-time* pasca transaksi POS maupun rilis BAST. | `[x] DONE` | `ClientHistory.jsx` |

---

### 3. Modul Mitra (Aktor Penyedia / Supply)
Fasilitas antarmuka bagi teknisi independen maupun vendor laboratorium untuk mengeksekusi SPK kerja.

| Cakupan Fitur | Deskripsi Fungsi Finansial & Operasional | Status | Komponen Terkait |
| :--- | :--- | :---: | :--- |
| **Bursa Kerja O2O** | Portal pengambilalihan tugas perbaikan fisik yang bersumber dari Drop-Off Center loket kasir atau pengajuan proposal kode aplikasi. | `[x] DONE` | `MitraJobs.jsx` |
| **Identitas QR Unik** | Penyajian **QR Code Profil Tunggal berbasis ID (`VND-XXXX`)** pada dasbor utama untuk dipindai oleh kamera hardware Admin saat verifikasi KYC fisik di loket. | `[x] DONE` | `MitraDashboard.jsx` |
| **Milestone Tracker** | Fitur pengkinian tahapan progres pengerjaan harian demi memberikan jaminan transparansi laporan performa kepada Klien dan Admin. | `[x] DONE` | `MitraProjects.jsx` |
| **Ledger Pendapatan** | Dompet kemitraan penampung upah bersih hasil rilis escrow yang telah terpotong komisi aplikasi secara otomatis (Prinsip perlindungan arus kas). | `[x] DONE` | `MitraWallet.jsx` |



## 🛠️ Arsitektur Spesifikasi REST API (FastAPI Router)

Seluruh gerbang komunikasi data dan mutasi kritikal diatur secara terpusat melalui berkas pengontrol `app/routers/admin_router.py`. Router ini dikembangkan dengan prinsip *ACID Compliance* menggunakan repositori ORM SQLAlchemy untuk mencegah inkonsistensi saldo.

### 1. Manajemen Autentikasi Dasar
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **POST** | `/api/admin/register-superadmin` | `AdminCreate`<br>`{ name, email, password }` | **Seeder Akun:** Memeriksa keunikan email $\rightarrow$ Enkripsi password menggunakan `bcrypt` $\rightarrow$ Membuat entitas baru di tabel `users` dengan `role='admin'` $\rightarrow$ Menginisialisasi baris baru pada tabel `wallets` dengan saldo `0.00`. |

### 2. Pilar 1: Manajemen Identitas & Kepatuhan (KYC)
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/admin/mitras` | *None* | **Data Retrieval:** Mengambil seluruh daftar profil Mitra dari tabel `mitra_profiles`. Menggunakan mekanisme pengamanan *lazy loading* untuk mengantisipasi data relasi `users` yang tidak lengkap di layar kasir. |
| **PUT** | `/api/admin/kyc/{mitra_id}/verify` | *None* | **QR Code Validation Gateway:** Mengubah kolom `kyc_status` menjadi `'VERIFIED'` pada tabel `mitra_profiles`. Mengecek validasi state: menolak eksekusi jika ID tidak diawali token `VND-` atau jika akun telah berstatus `'BANNED'`. |
| **PUT** | `/api/admin/users/{user_id}/ban` | *None* | **Platform Suspension:** Mengubah kolom `kyc_status` menjadi `'BANNED'` pada entitas terkait. Memutus hak akses pencarian akun di bursa kerja dan membekukan hak penarikan dana dompet secara sepihak. |

### 3. Pilar 2: Finansial & Kasir POS
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/admin/users/{user_id}/name` | *None* | **POS Inquiry Phase:** Mencari ID pada tabel `users`. Menghasilkan data `name` dan `role` untuk konfirmasi verbal kasir loket guna mencegah *Business Logic Flaw* salah transfer dana akibat salah ketik (*typo*). |
| **POST** | `/api/admin/pos/topup/physical` | `dict`<br>`{ user_id, amount }` | **Cash Vault Sync:** Konversi nominal ke tipe data aman `Decimal`. Memperbarui tabel `wallets` dengan kalkulasi `balance += amount`. Menyisipkan log audit permanen ke tabel `transactions` dengan tipe `'TOP UP FISIK (LOKET KASIR)'`. |

### 4. Pilar 3: Arbitrase & Manajemen Escrow
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/admin/escrows` | *None* | **Audit Likuiditas:** Menampilkan kompilasi data proyek dari tabel `projects` yang memiliki dana mengendap di platform (Status kontrak: `'OPEN'`, `'SEDANG DIKERJAKAN'`, `'MENUNGGU UAT'`, `'DISPUTED'`). |
| **PUT** | `/api/admin/escrows/{project_id}/dispute` | *None* | **Freeze Mechanism:** Mengunci status kolom `status` pada tabel `projects` menjadi `'DISPUTED'`. Memperbarui rekaman kolom `current_milestone` menjadi peringatan penangguhan sengketa perikatan. |
| **POST** | `/api/admin/escrows/{project_id}/refund` | *None* | **Forced Refund Resolution:** Membaca nilai pagu proyek pada tabel `projects`. Mengurangi kolom `escrow_balance` Klien dan mengembalikannya ke kolom `balance` Klien pada tabel `wallets`. Status proyek digeser menjadi `'CANCELLED'`. Mencatat riwayat riil sukses di tabel `transactions`. |

### 5. Pilar 4: Operasional Drop-Off Center
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/admin/dropoff` | *None* | **Queue Monitoring:** Mengambil data antrean unit perbaikan dari tabel `projects` dengan filter pengkondisian tipe layanan khusus perangkat keras (`service_type` IN `'SERVIS HARDWARE'`, `'PERENTALAN'`). |
| **POST** | `/api/admin/dropoff/receive` | `DropOffCreate`<br>`{ client_id, title, description, budget }` | **Intake & Lock Stage:** Memastikan saldo `balance` Klien mencukupi nilai taksiran servis. Membuat baris kontrak baru di tabel `projects` (`status='OPEN'`). Memindahkan harta Klien di tabel `wallets` dari `balance -= budget` menuju `escrow_balance += budget`. Mencatat transaksi penahanan dana. |
| **PUT** | `/api/admin/dropoff/{project_id}/uat` | *None* | **QA Phase Shift:** Validasi apakah proyek sedang berstatus `'SEDANG DIKERJAKAN'`. Mengubah status baris data proyek menjadi `'MENUNGGU UAT'` dan memperbarui milestone pelacakan guna memicu panggilan kehadiran Klien ke loket. |
| **PUT** | `/api/admin/dropoff/{project_id}/bast` | *Query Param*<br>`?admin_id=str` | **Split Payment & Payout Session (Zero-Sum Game):**<br>1. Membaca nilai persentase biaya platform dari tabel `system_settings` (Default: 5%).<br>2. Mengurangi kolom `escrow_balance` Klien sebesar 100% total pagu dana.<br>3. Menambahkan saldo bersih (95%) ke kolom `balance` Mitra pada tabel `wallets`.<br>4. Menambahkan saldo potongan komisi (5%) ke kolom `balance` dompet akun Admin/Platform.<br>5. Mengubah status proyek menjadi `'COMPLETED'` dan mencetak log sukses transaksi pemotongan fee resmi. |

### 6. Pilar 5: Konfigurasi Sistem Makro
| Method | Endpoint Path | Payload / Schema | Deskripsi Operasional & Dampak Database MySQL |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/admin/settings` | *None* | **Global Parameters Reading:** Menarik seluruh berkas konfigurasi *key-value pair* dari tabel `system_settings` untuk merender besaran konstanta keuangan aktif aplikasi ke UI. |
| **PUT** | `/api/admin/settings/{key}` | `SettingUpdate`<br>`{ value }` | **No-Code System Tuning:** Menyimpan atau memperbarui nilai operasional makro pada tabel `system_settings` (Contoh kunci data: `'PLATFORM_FEE'`, `'MAX_ESCROW_DAYS'`). Menjamin fleksibilitas bisnis tanpa merusak struktur kompilasi ulang kode sumber. |



## 🗃️ Skema Hubungan Entitas Basis Data (SQLAlchemy Domain Models)

Sistem menggunakan mesin ORM SQLAlchemy yang dipetakan secara relasional ke MySQL Server. Desain skema ini menerapkan tipe data yang presisi untuk data keuangan (`DECIMAL`) guna menghindari *floating-point error*, serta memanfaatkan batasan kaku (`Enum`) untuk menjaga konsistensi *state machine* sistem.

### 1. Kamus Data & Struktur Tabel

#### a. Tabel: `users` (Entitas Pengguna Dasar)
Menyimpan data kredensial dan peran otentikasi dasar bagi seluruh aktor sistem.
* **`id`** (`String(50)`): **[PK]** Identifier unik (Format: `ADM-XXXX`, `USER-XXXX`, `VND-XXXX`).
* **`name`** (`String(100)`): Nama lengkap pengguna (Disimpan dalam huruf kapital).
* **`email`** (`String(100)`): **[Unique]** Alamat surat elektronik aktif untuk login.
* **`password_hash`** (`String(255)`): Password yang telah di-amankan menggunakan algoritma `bcrypt`.
* **`role`** (`Enum('klien', 'mitra', 'admin')`): Peran kaku penentu hak akses rute (*Role-Based Access Control*).

#### b. Tabel: `mitra_profiles` (Profil Performa & Kepatuhan Vendor)
Ekstensi data khusus untuk pengguna dengan peran (`role`) 'mitra'. Terikat 1:1 dengan tabel `users`.
* **`user_id`** (`String(50)`): **[PK] [FK -> users.id]** Terintegrasi dengan aturan `ondelete="CASCADE"`.
* **`specialty_role`** (`String(100)`): Keahlian spesifik (Contoh: 'SOFTWARE/WEB', 'SERVIS HARDWARE').
* **`rating`** (`DECIMAL(3, 2)`): Nilai reputasi kerja Mitra, default `0.00` (Skala 0.00 s.d 5.00).
* **`hourly_rate_or_fee`** (`String(50)`): Tarif dasar jasa yang ditawarkan oleh Mitra.
* **`avg_speed_days`** (`Integer`): Metrik performa rata-rata durasi penyelesaian proyek (Satuan: Hari).
* **`projects_completed`** (`Integer`): Total akumulasi proyek yang berhasil diselesaikan dengan status `COMPLETED`.
* **`kyc_status`** (`Enum('PENDING', 'VERIFIED', 'REJECTED', 'BANNED')`): State kepatuhan hukum identitas.
* **`latitude`** (`DECIMAL(10, 8)`): Koordinat lintang posisi GPS Mitra untuk pemetaan jarak O2O.
* **`longitude`** (`DECIMAL(11, 8)`): Koordinat bujur posisi GPS Mitra untuk pemetaan jarak O2O.

#### c. Tabel: `wallets` (Virtual Ledger Keuangan)
Buku besar virtual pencatat saldo finansial riil. Terikat 1:1 dengan tabel `users`.
* **`user_id`** (`String(50)`): **[PK] [FK -> users.id]** Terintegrasi dengan aturan `ondelete="CASCADE"`.
* **`balance`** (`DECIMAL(15, 2)`): Saldo bebas/likuid yang dapat ditarik (*withdraw*) atau dibelanjakan, default `0.00`.
* **`escrow_balance`** (`DECIMAL(15, 2)`): Saldo komitmen yang sedang dibekukan oleh sistem platform, default `0.00`.

#### d. Tabel: `projects` (Kontrak Kerja & Perikatan Hibrida)
Menampung data transaksi pemesanan jasa IT online maupun perbaikan fisik di loket Drop-Off Center.
* **`id`** (`String(50)`): **[PK]** Identifier unik kontrak (Format: `JOB-HW-XXXX`, dsb).
* **`client_id`** (`String(50)`): **[FK -> users.id]** Pemilik modal / perangkat (Klien).
* **`mitra_id`** (`String(50), Nullable=True`): **[FK -> users.id]** Pelaksana pekerjaan (Mitra/Vendor).
* **`title`** (`String(200)`): Nama proyek atau judul perangkat keras yang diserahkan.
* **`description`** (`Text`): Uraian keluhan teknis, diagnosa, atau spesifikasi modul aplikasi.
* **`service_type`** (`Enum('SOFTWARE/WEB', 'IOT/EMBEDDED', 'SERVIS HARDWARE', 'PERENTALAN')`): Kategori kerja.
* **`status`** (`Enum('OPEN', 'SEDANG DIKERJAKAN', 'MENUNGGU UAT', 'COMPLETED', 'CANCELLED', 'DISPUTED')`): *State machine* proyek.
* **`current_milestone`** (`String(255)`): Status teks pelacakan progres terkini untuk transparansi Klien.
* **`budget`** (`DECIMAL(15, 2)`): Nilai pagu total proyek / nilai jaminan taksiran servis hardware.
* **`deadline_days`** (`Integer`): Batas waktu pengerjaan proyek (Satuan: Hari).

#### e. Tabel: `transactions` (Immutable Financial Audit Logs)
Log permanen pencatat riwayat mutasi keuangan. Bersifat *Append-Only* (Tidak boleh ada operasi `UPDATE`).
* **`id`** (`String(50)`): **[PK]** Kode unik transaksi resmi (Format: `TRX-POS-XXXX`, `TRX-ESC-XXXX`, dsb).
* **`user_id`** (`String(50)`): **[FK -> users.id]** Aktor pemilik dompet yang mengalami mutasi dana.
* **`project_id`** (`String(50), Nullable=True`): **[FK -> projects.id]** Referensi kontrak perikatan yang memicu transaksi.
* **`transaction_type`** (`String(100)`): Jenis aktivitas (Contoh: `'TOP UP FISIK'`, `'PENAHANAN ESCROW'`, `'PEMBAYARAN SPK'`).
* **`amount`** (`DECIMAL(15, 2)`): Nilai nominal mutasi uang (Bernilai negatif untuk uang keluar, positif untuk uang masuk).
* **`status`** (`Enum('PENDING', 'SUCCESS', 'FAILED')`): Status akhir validitas transaksi.
* **`created_at`** (`DateTime`): Stempel waktu otomatis pencatatan transaksi (`func.now()`).

#### f. Tabel: `tags` & `project_tags` (Sistem Labeling Kompetensi)
* **`tags`**: Tabel master penyimpan label kompetensi (`id`, `tag_name`).
* **`project_tags`**: Tabel asosiasi pembentuk jembatan relasi *Many-to-Many* antara `projects` dan `tags` (`project_id`, `tag_id`).

#### g. Tabel: `system_settings` (Konstanta Regulasi Bisnis)
* **`setting_key`** (`String(50)`): **[PK]** Kode parameter global (Contoh: `'PLATFORM_FEE'`, `'MAX_ESCROW_DAYS'`).
* **`setting_value`** (`String(255)`): Nilai parameter aktif yang dibaca oleh sistem backend.
* **`description`** (`Text`): Penjelasan fungsi parameter operasional.

---

### 2. Arsitektur Hubungan Kardinalitas Antar-Entitas

Pemetaan relasi antar-objek domain models dikonfigurasi menggunakan fungsi `relationship()` secara ketat guna mendukung integritas data penuh:

```text
  [ Users ] 1 ─── 1 [ MitraProfile ] (Cascaded Profile Extension)
     │
     │ 1 ─── 1 [ Wallet ] (Virtual Ledger Balance Mapping)
     │
     ├─── N [ Project ] (Sebagai 'client' lewat client_id)
     ├─── N [ Project ] (Sebagai 'mitra' lewat mitra_id)
     │
     └─── N [ Transaction ] (Pemilik akun pencatatan log finansial)

  [ Project ] 1 ─── N [ Transaction ] (Pelacakan riwayat sengketa/aliran dana kontrak)
  [ Project ] M ─── N [ Tag ] (Dihubungkan via tabel asosiasi 'project_tags')


  ## 🔒 Prinsip Proteksi Keamanan (Secure by Design) & Mitigasi Kerentanan

Mekanisme pertahanan keamanan pada platform E-TechHub tidak dirancang sebagai lapisan tambahan di akhir pengembangan (*add-on*), melainkan diintegrasikan secara struktural ke dalam arsitektur sistem sejak awal pemodelan (*Secure by Design*). Implementasi ini ditujukan untuk memitigasi skenario eksploitasi kritikal pada ekosistem hibrida digital-fisik:

### 1. Mitigasi Race Condition pada Mutasi Saldo & Checkout
* **Skenario Ancaman (Proposal Pentest #1):** Penyerang melakukan serangan kompetitif berupa pengiriman permintaan bersamaan (*concurrent requests*) dalam hitungan milidetik yang memanfaatkan jeda waktu pemrosesan data (*race condition*). Contohnya, melakukan klik ganda saat penarikan saldo (*withdrawal*) atau rilis dana proyek, dengan tujuan menduplikasi nominal pencairan sebelum baris data saldo basis data sempat diperbarui.
* **Solusi & Implementasi Teknis:** Sistem menerapkan pengamanan *transaction rollback* yang ketat di level basis data melalui Session ORM SQLAlchemy. Setiap alur mutasi dana dibungkus ke dalam blok operasi atomik kaku (`db.begin()`, `db.commit()`, `db.rollback()`) untuk menjamin kepatuhan sifat *ACID (Atomicity, Consistency, Isolation, Durability)*. Pada operasi pembaruan saldo dompet, mesin backend memanfaatkan penguncian baris eksplisit (`with_for_update()`) pada MySQL Server, sehingga permintaan kedua akan dipaksa mengantre hingga proses pembaruan saldo dari permintaan pertama selesai dieksekusi secara utuh.

### 2. Mitigasi Insecure Direct Object Reference (IDOR) pada Akses Kontrak Kerja
* **Skenario Ancaman (Proposal Pentest #2):** Penyerang (misalnya Mitra atau aktor luar) mencoba mengeksploitasi parameter URL atau memanipulasi isi *payload* JSON (contoh: mengubah parameter ID proyek dari `JOB-HW-A001` menjadi `JOB-HW-B002` milik pengguna lain) untuk membaca isi kontrak rahasia, memanipulasi tahapan *milestone*, atau merilis dana escrow secara ilegal tanpa hak otorisasi.
* **Solusi & Implementasi Teknis:** Sistem menerapkan kebijakan kontrol akses berbasis kepemilikan baris (*Row-Level Ownership Verification*) yang di-injeksi langsung ke dalam *Dependency Injection* FastAPI. Sebelum endpoint mengeksekusi permintaan (seperti mengubah status proyek menjadi `MENUNGGU UAT` atau merilis BAST), sistem akan melakukan validasi silang di latar belakang untuk memastikan bahwa ID pengguna yang sedang aktif (`current_user.id`) benar-benar terdaftar sebagai `client_id` atau `mitra_id` pada baris objek proyek yang dituju di MySQL. Jika parameter tidak selaras, sistem seketika melempar respon `HTTPException(status_code=403, detail="Akses Ditolak: Anda bukan pemilik sah perikatan ini")`.

### 3. Mitigasi Business Logic Flaw pada Refund & Top-Up Kasir POS
* **Skenario Ancaman (Proposal Pentest #3):** Penyerang memanfaatkan kelemahan logika bisnis di area operasional loket fisik, misalnya menggunakan satu ID proyek yang sama berulang kali di mesin kasir POS untuk menarik uang jaminan (*security deposit*) atau dana DP Klien berkali-kali (*Double Refund*) secara ilegal pasca proyek dibatalkan.
* **Solusi & Implementasi Teknis:** Mitigasi ini diselesaikan melalui dua mekanisme pengamanan kaku:
  * *Rigid State Machine Validation:* Fungsi pengembalian dana (`refund_escrow`) di backend dilengkapi dengan pengkondisian logika intervensi awal yang memeriksa nilai Enum status proyek saat ini. Jika proyek terdeteksi sudah berada dalam status `COMPLETED` atau `CANCELLED`, sistem akan langsung memblokir eksekusi di baris pertama dan menolak pengiriman dana.
  * *Append-Only Financial Ledger:* Nilai saldo pada tabel `wallets` tidak pernah dapat dimodifikasi secara langsung tanpa memicu kewajiban pencatatan baris rekaman baru secara simultan pada tabel `transactions`. Fungsi `UPDATE` dan `DELETE` ditiadakan sepenuhnya dari seluruh antarmuka admin untuk menjamin sifat data yang tidak dapat diubah (*immutability*) demi kebutuhan audit finansial.

### 4. Pencegahan Kejahatan Internal (Internal Fraud & Floating Currency Mitigation)
* **Solusi & Implementasi Teknis:** Untuk mengantisipasi manipulasi angka saldo secara acak oleh oknum internal administrator platform, backend E-TechHub mengunci seluruh fungsi pemindahan dana escrow dengan formula perhitungan matematika *Zero-Sum Game Accounting*. Dana tidak pernah diizinkan tercipta atau hilang menguap di udara kosong. Saat Berita Acara Serah Terima (BAST) dieksekusi, nilai pengurangan dana pada `escrow_balance` Klien harus bernilai seimbang persis dengan akumulasi penambahan saldo bersih pada `balance` Mitra setelah dipotong persentase komisi platform (`PLATFORM_FEE`) secara riil, yang kemudian langsung dialirkan ke saldo dompet Admin. Formula ini menutup total celah kebocoran dana mengambang (*floating currency leaks*).

### 5. Validasi Otorisasi Anti-Bypass (QR-Code Physical Enforcer)
* **Solusi & Implementasi Teknis:** Sistem memutus total potensi penyalahgunaan wewenang admin jarak jauh dengan cara menghapus tombol persetujuan manual (*manual override/bypass*) untuk pengaktifan akun Mitra baru pada antarmuka `AdminMitraManagement.jsx`. Status pendaftaran Mitra baru dipaksa tertahan pada kondisi *state* `⚠️ MENUNGGU SCAN QR`. Satu-satunya gerbang pembuka status aktivasi tersebut adalah melalui kehadiran fisik Mitra di meja loket Drop-Off Center untuk memindai token unik QR Code (`VND-XXXX`) mereka langsung ke sistem kamera kasir admin. Menghindari celah pemalsuan identitas atau pembuatan akun fiktif massal di bursa kerja.