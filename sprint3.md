# Sprint 3 — Ringkasan Perubahan
Tanggal: 19 Mei 2026

Ringkasan singkat:
- Fokus Sprint 3 adalah peningkatan komunikasi dan penyelesaian sengketa:
  - Papan Diskusi Publik (Q&A Board) pada Bursa Kerja.
  - Sistem Notifikasi Real-Time (WebSocket) dengan `notif_manager` global.
  - Pemicu notifikasi otomatik untuk milestone dan Q&A.
  - Meja Hijau Admin (Arbitrase) untuk resolusi sengketa + notifikasi ke pihak terkait.

## 1. Papan Diskusi Publik (Q&A Board)
- Tujuan: memberi ruang tanya-jawab terbuka pada setiap proyek di Bursa Kerja agar Mitra bisa bertanya secara publik dan Klien bisa menjawab. Mengurangi spam DM pribadi.
- Peran/Alur:
  - Mitra: mengajukan pertanyaan terkait proyek publik di Bursa Kerja.
  - Klien (pemilik proyek): menjawab pertanyaan; bisa menandai jawaban sebagai solusi.
  - Semua interaksi tersimpan sebagai thread (pertanyaan + balasan).
- Dampak teknis:
  - Tambah model/tabel `qna` (id, project_id, author_id, role, content, parent_id, created_at).
  - Endpoint API baru (contoh):
    - `POST /api/projects/:id/qna` — buat pertanyaan
    - `POST /api/qna/:id/reply` — balas pertanyaan
    - `GET /api/projects/:id/qna` — ambil thread Q&A
  - Frontend: gunakan komponen Q&A (mis. `QnABoardModal.jsx`) pada halaman proyek dan listing Bursa Kerja.

## 2. Sistem Notifikasi Real-Time (WebSocket)
- Tujuan: dorong pemberitahuan instan ke layar pengguna tanpa perlu refresh.
- Komponen inti: `notif_manager`
  - Singleton/global engine di backend yang mengelola koneksi WebSocket dan routing notifikasi ke user yang terhubung.
  - Menyimpan mapping `user_id -> websocket_connection` (in-memory atau via pub/sub jika skala horisontal).
  - API internal untuk "menembakkan" notifikasi: `notif_manager.send(user_id, payload)`.
- Implementasi (catatan teknis):
  - Backend: FastAPI/Starlette WebSocket endpoint atau alternatif (dependensi existing). Sediakan handshake auth (token).
  - Frontend: buka koneksi WebSocket saat pengguna autentikasi; daftarkan callback untuk event `notification` → tampilkan di `NotificationBell.jsx` dan toast.

## 3. Pemicu Notifikasi Otomatis
Contoh alur pemicu dan penerima:
- Mitra mengirim milestone → `NOTIF_TYPE: milestone_submitted` → penerima: Klien (pemilik kontrak/proyek).
- Klien setujui/tolak milestone → `NOTIF_TYPE: milestone_update` → penerima: Mitra.
- Ada pertanyaan atau balasan di Q&A → `NOTIF_TYPE: qna_new` → penerima: Pemilik proyek (jika yang mengirim bukan pemilik).

Contoh payload notifikasi (JSON):
```
{
  "type": "qna_new",
  "title": "Pertanyaan baru pada Proyek: Website Redesign",
  "body": "Mitra X menanyakan: Apakah desain harus responsif untuk mobile?",
  "meta": { "project_id": 123, "qna_id": 456 },
  "timestamp": "2026-05-19T10:23:00Z"
}
```

## 4. Meja Hijau Admin (Arbitrase)
- Tujuan: berikan alat bagi Admin untuk memutus sengketa antara Klien dan Mitra.
- Fitur utama:
  - Admin dapat memilih hasil: `Refund` (menangkan Klien) atau `Force Release` (menangkan Mitra).
  - Aksi menghasilkan perubahan status pada escrow/kontrak dan mengirim notifikasi ke kedua pihak.
  - Simpan audit log keputusan arbitrase: admin_id, dispute_id, keputusan, alasan, timestamp.
- Dampak teknis:
  - Tambah model/tabel `disputes` (id, contract_id, initiator_id, status, details, created_at, resolved_at).
  - Endpoint admin: `POST /api/admin/disputes/:id/resolve` dengan payload `{ action: "refund" | "force_release", note: "..." }`.
  - Notifikasi otomatis setelah resolusi:
    - Ke Klien: "Arbitrase: keputusan Refund — dana dikembalikan."
    - Ke Mitra: "Arbitrase: keputusan Force Release — dana dilepas."
  - UI: perbarui `Admin/Arbitrase.jsx` (sudah ada) untuk menampilkan detail sengketa, bukti, dan tombol tindakan.

## 5. Perubahan Database & Migrasi
- Tabel baru (minimal): `notifications`, `qna`, `disputes`.
- Kolom tambahan saran: `notifications.read` (boolean), `milestones.status` enum diperluas (`submitted`, `approved`, `rejected`).

## 6. API & Event Map (ringkas)
- `POST /api/projects/:id/qna` — buat pertanyaan (emit `qna_new` ke pemilik proyek)
- `POST /api/qna/:id/reply` — balasan (emit `qna_reply` ke pemilik proyek)
- `POST /api/contracts/:id/milestones/:mid/submit` — Mitra submit (emit `milestone_submitted` ke Klien)
- `POST /api/contracts/:id/milestones/:mid/decision` — Klien approve/reject (emit `milestone_update` ke Mitra)
- `WS /ws/notifications` — koneksi WebSocket untuk menerima event notifikasi realtime
- `POST /api/admin/disputes/:id/resolve` — Admin arbitrase (emit notifikasi ke Klien & Mitra)

## 7. Frontend — Perubahan & Komponen
- Komponen/halaman yang relevan:
  - `QnABoardModal.jsx` — tampilkan thread Q&A dan form tanya/jawab.
  - `NotificationBell.jsx` — terima & render notifikasi realtime.
  - `Admin/Arbitrase.jsx` — form keputusan arbitrase (sudah ada; lengkapi aksi API & notifikasi).
  - Update halaman proyek publik (`PublicMarketplace.jsx` / project detail) untuk menampilkan Q&A.

## 8. Testing & Rollout
- Testing unit/integration untuk:
  - Alur notifikasi (emit → diterima oleh user yang tepat).
  - Q&A CRUD dan permission rules.
  - Arbitrase: status perubahan kontrak + audit log + notifikasi.
- Rollout:
  - Deploy backend with `notif_manager` behind feature flag terlebih dahulu di staging.
  - Putuskan strategi skala WebSocket (single instance vs pub/sub) sebelum produksi.

## 9. Catatan Operasional
- Jika menggunakan banyak backend instance, pindahkan `notif_manager` ke broker pub/sub (Redis pub/sub atau message broker) agar notifikasi tersampaikan ke semua instance.
- Audit dan log harus immutably menyimpan keputusan arbitrase untuk kepatuhan.

---
Dokumentasi ini berfungsi sebagai ringkasan teknis dan panduan implementasi cepat untuk tim developer. Jika ingin, saya bisa: (a) buatkan skema tabel SQL untuk migrasi, (b) contoh handler WebSocket di backend, atau (c) contoh client WebSocket di frontend.
