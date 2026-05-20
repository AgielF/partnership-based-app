# Changelog Sprint 3

Tanggal: 20 Mei 2026

## Ringkasan Perubahan

Sprint 3 difokuskan pada peningkatan komunikasi pengguna dan penyelesaian sengketa di platform E-TechHub.

### Fitur yang Ditambahkan

- Notifikasi real-time WebSocket
- Papan diskusi publik Q&A untuk setiap proyek
- Modal pelacakan progres milestone
- Halaman arbitrase admin untuk resolusi sengketa
- Dokumen ringkasan Sprint 3

## File Utama yang Ditambahkan

- `e-techhub/src/components/NotificationBell.jsx`
  - Komponen badge notifikasi
  - API / WebSocket fetch notifikasi
  - Dropdown daftar notifikasi

- `e-techhub/src/components/ProgressModal.jsx`
  - Modal pelacakan progres milestone
  - Aksi unggah bukti kerja untuk Mitra
  - Aksi review / revisi untuk Klien

- `e-techhub/src/components/QnABoardModal.jsx`
  - Modal diskusi publik Q&A
  - Form pertanyaan / jawaban proyek
  - Tampilan thread diskusi

- `e-techhub/src/pages/Admin/Arbitrase.jsx`
  - Halaman admin arbitrase sengketa
  - Tombol keputusan `Refund` atau `Force Release`
  - Detail kasus dan jejak audit

- `sprint3.md`
  - Dokumentasi ringkasan teknis Sprint 3
  - Catatan API, event, dan arsitektur notifikasi

## Catatan Teknis

- Implementasi frontend menyiapkan dasar untuk notifikasi realtime dan kolaborasi proyek.
- Kebanyakan perubahan ada di folder `e-techhub/src/components` dan `e-techhub/src/pages/Admin`.
- Dokumen `sprint3.md` digunakan sebagai referensi tugas Sprint 3.

## Rekomendasi Commit / PR

- `Tambah fitur notifikasi realtime, Q&A publik, pelacakan progres milestone, dan arbitrase admin`
- `Menambahkan dokumentasi Sprint 3 dan komponen frontend terkait`