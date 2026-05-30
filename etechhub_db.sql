-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 20, 2026 at 07:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `etechhub_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `room_id` varchar(100) NOT NULL,
  `sender_id` varchar(50) NOT NULL,
  `message_text` text NOT NULL,
  `is_system_message` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `room_id`, `sender_id`, `message_text`, `is_system_message`, `created_at`) VALUES
(1, 'NEGO-USER-4E2582C4-VND-AF4AAF20', 'USER-4E2582C4', 'hallo', 0, '2026-05-18 18:46:35'),
(2, 'NEGO-USER-4E2582C4-VND-AF4AAF20', 'USER-4E2582C4', 'halloo', 0, '2026-05-18 18:51:24'),
(3, 'NEGO-USER-4E2582C4-VND-AF4AAF20', 'VND-AF4AAF20', 'ya ', 0, '2026-05-18 19:48:38');

-- --------------------------------------------------------

--
-- Table structure for table `iot_dropoffs`
--

CREATE TABLE `iot_dropoffs` (
  `id` varchar(50) NOT NULL,
  `project_id` varchar(50) NOT NULL,
  `admin_id` varchar(50) NOT NULL,
  `device_type` varchar(100) NOT NULL,
  `physical_status` enum('MENUNGGU_DIANTAR','DITERIMA_LOKET','DIKERJAKAN_MITRA','SIAP_DIAMBIL','DIKEMBALIKAN_KE_KLIEN') DEFAULT 'MENUNGGU_DIANTAR',
  `condition_notes` text DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mitra_profiles`
--

CREATE TABLE `mitra_profiles` (
  `user_id` varchar(50) NOT NULL,
  `specialty_role` varchar(100) NOT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `hourly_rate_or_fee` varchar(50) DEFAULT NULL,
  `avg_speed_days` int(11) DEFAULT NULL,
  `projects_completed` int(11) DEFAULT NULL,
  `kyc_status` enum('PENDING','VERIFIED','REJECTED','BANNED') DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mitra_profiles`
--

INSERT INTO `mitra_profiles` (`user_id`, `specialty_role`, `rating`, `hourly_rate_or_fee`, `avg_speed_days`, `projects_completed`, `kyc_status`, `latitude`, `longitude`) VALUES
('VND-4EE93994', 'General IT Vendor', 0.00, NULL, 0, 1, 'VERIFIED', NULL, NULL),
('VND-AF4AAF20', 'IOT/EMBEDDED', 0.00, '50000', 0, 1, 'VERIFIED', -6.92020000, 107.60840000);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 'VND-4EE93994', '✅ KYC DIVERIFIKASI', 'Selamat! Identitas Anda telah diverifikasi oleh Admin. Anda kini bisa mengambil proyek.', 1, '2026-05-19 17:08:16'),
(2, 'USER-4E2582C4', '📈 MITRA MENYERAHKAN BUKTI KERJA', 'Mitra mengirimkan dokumen/tautan artefak untuk \'Tahap 2: Implementasi Sistem\'. Silakan periksa kembali halaman kontrak Anda.', 1, '2026-05-19 17:25:52'),
(3, 'VND-4EE93994', 'STATUS BUKTI KERJA: DITOLAK ❌ (BUTUH REVISI)', 'Klien telah mengevaluasi berkas \'Tahap 2: Implementasi Sistem\' untuk proyek: \'PEMBUATAN BACKEND DENGAN SPRING\'.', 1, '2026-05-19 17:27:19'),
(4, 'USER-4E2582C4', '📈 MITRA MENYERAHKAN BUKTI KERJA', 'Mitra mengirimkan dokumen/tautan artefak untuk \'Tahap 2: Implementasi Sistem\'. Silakan periksa kembali halaman kontrak Anda.', 1, '2026-05-19 17:28:42'),
(5, 'VND-4EE93994', 'STATUS BUKTI KERJA: DISETUJUI ✅', 'Klien telah mengevaluasi berkas \'Tahap 2: Implementasi Sistem\' untuk proyek: \'PEMBUATAN BACKEND DENGAN SPRING\'.', 0, '2026-05-19 17:29:13'),
(6, 'VND-4EE93994', '💰 DANA ESCROW CAIR / SPK SELESAI', 'Klien menyetujui UAT proyek \'PEMBUATAN BACKEND DENGAN SPRING\'. Dana Rp 1,000 telah masuk ke saldo utama Anda.', 0, '2026-05-19 17:30:29');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` varchar(50) NOT NULL,
  `client_id` varchar(50) DEFAULT NULL,
  `mitra_id` varchar(50) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `service_type` enum('SOFTWARE/WEB','IOT/EMBEDDED','SERVIS HARDWARE','PERENTALAN') NOT NULL,
  `status` enum('OPEN','SEDANG DIKERJAKAN','MENUNGGU UAT','COMPLETED','CANCELLED','DISPUTED') DEFAULT NULL,
  `current_milestone` varchar(255) DEFAULT NULL,
  `budget` decimal(15,2) NOT NULL,
  `deadline_days` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `client_id`, `mitra_id`, `title`, `description`, `service_type`, `status`, `current_milestone`, `budget`, `deadline_days`) VALUES
('JOB-2026-571F', 'USER-4E2582C4', NULL, 'PEMBUATAN FRONTEND ', 'Pembuatan VUE dengan dokumen yang diberikan', 'SOFTWARE/WEB', 'OPEN', NULL, 25000.00, 14),
('JOB-2026-B86E', 'USER-4E2582C4', 'VND-AF4AAF20', 'PEMBUATAN HIDROPONIK BERBASIS IOT', 'pembuatan hidroponik berbasis IOT', 'IOT/EMBEDDED', 'COMPLETED', '[19/05 05:46] BAST Diterbitkan. Proyek Selesai.', 50000.00, 14),
('JOB-2026-F61E', 'USER-4E2582C4', 'VND-4EE93994', 'PEMBUATAN BACKEND DENGAN SPRING', 'microservice java ', 'SOFTWARE/WEB', 'COMPLETED', '[20/05 07:30] BAST Diterbitkan. Proyek Selesai.', 1000.00, 14);

-- --------------------------------------------------------

--
-- Table structure for table `project_deliverables`
--

CREATE TABLE `project_deliverables` (
  `id` int(11) NOT NULL,
  `project_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `submission_link` text DEFAULT NULL,
  `status` enum('PENDING','SUBMITTED','REVISION_REQUESTED','APPROVED') DEFAULT 'PENDING',
  `feedback` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_deliverables`
--

INSERT INTO `project_deliverables` (`id`, `project_id`, `title`, `description`, `submission_link`, `status`, `feedback`, `updated_at`) VALUES
(1, 'JOB-2026-F61E', 'Tahap 1: Desain & Arsitektur', 'Penyerahan mock-up UI/UX atau skema rancangan IoT hardware.', NULL, 'PENDING', NULL, '2026-05-19 17:09:01'),
(2, 'JOB-2026-F61E', 'Tahap 2: Implementasi Sistem', 'Pengembangan fungsionalitas inti, integrasi API, atau perakitan hardware.', 'https://github.com/AgielF/app1', 'APPROVED', '', '2026-05-19 17:29:13'),
(3, 'JOB-2026-F61E', 'Tahap 3: Hasil Akhir & Dokumentasi', 'Penyelesaian source code akhir, pengujian sistem, atau drop-off perangkat fisik.', NULL, 'PENDING', NULL, '2026-05-19 17:09:01');

-- --------------------------------------------------------

--
-- Table structure for table `project_qna`
--

CREATE TABLE `project_qna` (
  `id` int(11) NOT NULL,
  `project_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_qna`
--

INSERT INTO `project_qna` (`id`, `project_id`, `user_id`, `message`, `created_at`) VALUES
(1, 'JOB-2026-571F', 'VND-AF4AAF20', 'apakah arsitekturnya microservice?', '2026-05-19 07:20:53'),
(2, 'JOB-2026-571F', 'USER-4E2582C4', 'iya ', '2026-05-19 17:03:18');

-- --------------------------------------------------------

--
-- Table structure for table `project_tags`
--

CREATE TABLE `project_tags` (
  `project_id` varchar(50) DEFAULT NULL,
  `tag_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_tags`
--

INSERT INTO `project_tags` (`project_id`, `tag_id`) VALUES
('JOB-2026-B86E', 1),
('JOB-2026-B86E', 2),
('JOB-2026-571F', 3),
('JOB-2026-F61E', 4);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('MAX_ESCROW_DAYS', '10', 'Added via API'),
('PLATFORM_FEE', '0.05', 'Added via API');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `tag_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `tag_name`) VALUES
(1, 'C++'),
(4, 'JAVA'),
(2, 'PYTHON'),
(3, 'VUE');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `project_id` varchar(50) DEFAULT NULL,
  `transaction_type` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED') DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `project_id`, `transaction_type`, `amount`, `status`, `created_at`) VALUES
('TRX-120E5F717A', 'USER-4E2582C4', NULL, 'TOP UP ONLINE (MIDTRANS)', 10000.00, 'PENDING', '2026-05-20 11:09:16'),
('TRX-94188C9FA1', 'USER-4E2582C4', NULL, 'TOP UP ONLINE (MIDTRANS)', 10000.00, 'SUCCESS', '2026-05-20 11:43:42'),
('TRX-ESC-5091', 'USER-4E2582C4', 'JOB-2026-B86E', 'PENAHANAN DANA (ESCROW)', -50000.00, 'SUCCESS', '2026-05-17 11:16:49'),
('TRX-ESC-B27C', 'USER-4E2582C4', 'JOB-2026-F61E', 'PENAHANAN DANA (ESCROW)', -1000.00, 'SUCCESS', '2026-05-20 07:05:16'),
('TRX-ESC-ED8A', 'USER-4E2582C4', 'JOB-2026-571F', 'PENAHANAN DANA (ESCROW)', -25000.00, 'SUCCESS', '2026-05-19 15:35:36'),
('TRX-IN-403B', 'VND-4EE93994', 'JOB-2026-F61E', 'PENERIMAAN DANA (SPK SELESAI)', 1000.00, 'SUCCESS', '2026-05-20 07:30:29'),
('TRX-IN-A6D2', 'VND-AF4AAF20', 'JOB-2026-B86E', 'PENERIMAAN DANA (SPK SELESAI)', 50000.00, 'SUCCESS', '2026-05-17 13:31:37'),
('TRX-IN-FF78', 'VND-AF4AAF20', 'JOB-2026-B86E', 'PENERIMAAN DANA (SPK SELESAI)', 50000.00, 'SUCCESS', '2026-05-19 05:46:13'),
('TRX-OUT-634C', 'USER-4E2582C4', 'JOB-2026-F61E', 'BAST TERBIT (ESCROW RELEASE)', -1000.00, 'SUCCESS', '2026-05-20 07:30:29'),
('TRX-OUT-B642', 'USER-4E2582C4', 'JOB-2026-B86E', 'BAST TERBIT (ESCROW RELEASE)', -50000.00, 'SUCCESS', '2026-05-17 13:31:37'),
('TRX-OUT-F0F9', 'USER-4E2582C4', 'JOB-2026-B86E', 'BAST TERBIT (ESCROW RELEASE)', -50000.00, 'SUCCESS', '2026-05-19 05:46:13'),
('TRX-PG-7B01', 'USER-4E2582C4', NULL, 'TOP UP ONLINE (PAYMENT GATEWAY)', 100000.00, 'SUCCESS', '2026-05-17 11:16:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('klien','mitra','admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
('ADM-47F0D9', 'SUPER ADMIN E-TECHHUB', 'admin@etechhub.com', '$2b$12$WWfqmjRmbB/U1hoWBn6ijO5sG/4RFFRA7rBq.TaHPxI6v8xWlZesW', 'admin'),
('SYSTEM', 'Sistem E-TechHub', 'system@etechhub.com', 'none', 'admin'),
('USER-4E2582C4', 'agiel', 'agiel@gmail.com', '$2b$12$yeEZ6BDUgatalSU1hQaGIOFLms.28mnA6/CO5sCz09jjLuKmgrI9a', 'klien'),
('VND-4EE93994', 'nanda', 'nanda@gmail.com', '$2b$12$7ytyuBU2ZA4axYY5wS5KLeItCsSxZ3XfiXaik7NO8X6b.6CvAio6W', 'mitra'),
('VND-AF4AAF20', 'putra', 'putra@gmail.com', '$2b$12$y58Nf9oqkO5DVvVRvq2CLupKErk23MpQdI3TITzCqXjurRjXyUZsq', 'mitra');

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `user_id` varchar(50) NOT NULL,
  `balance` decimal(15,2) DEFAULT NULL,
  `escrow_balance` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`user_id`, `balance`, `escrow_balance`) VALUES
('ADM-47F0D9', 0.00, 0.00),
('USER-4E2582C4', 34000.00, -25000.00),
('VND-4EE93994', 1000.00, 0.00),
('VND-AF4AAF20', 100000.00, 0.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_messages_ibfk_2` (`sender_id`);

--
-- Indexes for table `iot_dropoffs`
--
ALTER TABLE `iot_dropoffs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `iot_dropoffs_ibfk_1` (`project_id`),
  ADD KEY `iot_dropoffs_ibfk_2` (`admin_id`);

--
-- Indexes for table `mitra_profiles`
--
ALTER TABLE `mitra_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notifications_user` (`user_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `mitra_id` (`mitra_id`);

--
-- Indexes for table `project_deliverables`
--
ALTER TABLE `project_deliverables`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_deliverables_project` (`project_id`);

--
-- Indexes for table `project_qna`
--
ALTER TABLE `project_qna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_qna_project` (`project_id`),
  ADD KEY `fk_qna_user` (`user_id`);

--
-- Indexes for table `project_tags`
--
ALTER TABLE `project_tags`
  ADD KEY `project_id` (`project_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tag_name` (`tag_name`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `ix_users_id` (`id`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_deliverables`
--
ALTER TABLE `project_deliverables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_qna`
--
ALTER TABLE `project_qna`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `iot_dropoffs`
--
ALTER TABLE `iot_dropoffs`
  ADD CONSTRAINT `iot_dropoffs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `iot_dropoffs_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `mitra_profiles`
--
ALTER TABLE `mitra_profiles`
  ADD CONSTRAINT `mitra_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`mitra_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `project_deliverables`
--
ALTER TABLE `project_deliverables`
  ADD CONSTRAINT `fk_deliverables_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_qna`
--
ALTER TABLE `project_qna`
  ADD CONSTRAINT `fk_qna_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_qna_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_tags`
--
ALTER TABLE `project_tags`
  ADD CONSTRAINT `project_tags_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `project_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
