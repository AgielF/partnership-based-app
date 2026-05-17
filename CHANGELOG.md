# 🚀 Dokumentasi Progres Pengembangan E-TechHub (Mei 2026)
**Fase:** Implementasi e-KYC, E-Contract (Click-Wrap), & Alur Otomatisasi Escrow.
**Status:** `SELESAI (100%)`

Dokumen ini merangkum penyelesaian modul-modul kritis terkait kepatuhan hukum, manajemen ruang kerja, dan pencairan dana otomatis antara Klien, Mitra, dan Admin.

---

## 1. Manajemen Profil & Kepatuhan Identitas (e-KYC)
Fokus pada keamanan platform dan validasi pekerja lepas (*remote* maupun fisik).

* ✅ **Pembaruan Profil Mitra Terkontrol:** Mitra kini dapat memperbarui informasi profil mereka (Spesialisasi, Tarif/Fee, dan pelacakan koordinat GPS otomatis). Atribut sensitif seperti *Rating* dan *Status KYC* dikunci keras pada level *backend* untuk mencegah manipulasi data.
* ✅ **Sistem Verifikasi KTP (e-KYC) Asinkron:** Mitra diwajibkan mengunggah foto KTP asli jika status akun masih `PENDING`. Sistem antarmuka unggah KTP akan mengunci tombol secara dinamis dan berubah wujud menjadi panel notifikasi setelah dokumen sukses terkirim ke *server*.
* ✅ **Audit KYC Manual oleh Admin:** Penambahan antarmuka *toggle* bagi Admin untuk membuka dan memeriksa foto KTP yang dikirimkan Mitra secara langsung dari *Dashboard* Admin. Admin memiliki tuas kendali penuh untuk menekan tombol **TERIMA (VERIFIED)** atau **TOLAK (REJECTED)** yang memicu permintaan unggah ulang.

## 2. Legalitas Dokumen & Click-Wrap Agreement
Otomatisasi pengikatan kontrak Surat Perintah Kerja (SPK) merujuk pada Pasal 1320 KUHPerdata dan UU ITE.

* ✅ **Tanda Tangan Digital Klien:** Klien diwajibkan melakukan validasi *Click-Wrap Agreement* setelah proyek diambil oleh Mitra. Tombol persetujuan dilengkapi dengan peringatan konsekuensi hukum.
* ✅ **Tanda Tangan Digital Mitra:** Ruang kerja Mitra tidak akan terbuka sebelum Mitra juga menyetujui SPK tersebut melalui mekanisme *Click-Wrap* di Dasbor mereka. Jejak waktu persetujuan dicatat permanen dalam *database*.

## 3. Ruang Kerja & Visibilitas Progres Pekerjaan
Memastikan transparansi penuh selama masa pengerjaan proyek (SPK Aktif).

* ✅ **Pelaporan Progres Berkala (Mitra):** Mitra kini memiliki *form* input teks di dalam Kartu Proyek mereka untuk memperbarui status pengerjaan secara mandiri.
* ✅ **Panel Pemantauan Progres (Klien):** Antarmuka Klien telah diperbarui dengan fitur *Expandable Row* (Baris Tersembunyi bergaya Terminal). Klien dapat mengklik tombol "CEK PROGRES" untuk melihat riwayat ketikan (*audit trail*) terbaru dari Mitra secara *real-time* tanpa memuat ulang halaman.

## 4. Penyerahan Akhir (UAT) & Pencairan Otomatis Escrow
Otomatisasi pemindahan aset finansial berdasarkan eksekusi BAST (Berita Acara Serah Terima).

* ✅ **Pengajuan UAT oleh Mitra:** Mitra memiliki tombol khusus untuk mengunci laporan mereka dan mengajukan peninjauan tahap akhir (UAT) kepada Klien. Status proyek otomatis berubah menjadi `MENUNGGU UAT`.
* ✅ **Persetujuan / Penolakan Klien (Accept/Reject):** Ketika Klien melihat status UAT, Klien diberikan kuasa untuk:
    * **Tolak (Reject):** Membekukan proyek dan mengubah status menjadi `DISPUTED` (Sengketa).
    * **Setuju 100% (Accept):** Menerbitkan BAST digital yang mengakhiri siklus proyek secara legal.
* ✅ **Otomatisasi Pencairan Escrow (Smart Settlement):** Segera setelah Klien menekan tombol persetujuan 100%, sistem *backend* bekerja secara atomik (*Database Transaction*):
    1. Mengurangi dana yang ditahan di `escrow_balance` Klien.
    2. Mentransfer penuh dana tersebut ke `balance` (Saldo Tersedia) Mitra.
    3. Mengubah status proyek menjadi `COMPLETED`.
    4. Mencatat log mutasi finansial untuk keperluan *invoice*.

---
**Catatan Keamanan (*Secure by Design*):**
Seluruh aksi mutasi data dan mutasi uang yang disebutkan di atas telah dilapisi validasi kepatuhan ganda (*Double Validation*) pada sisi *Frontend* (React) dan sisi *Backend* (FastAPI). Pembajakan status menggunakan *Inspect Element* akan diblokir mentah-mentah oleh server.