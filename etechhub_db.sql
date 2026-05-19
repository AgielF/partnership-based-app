-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 18, 2026 at 01:49 PM
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
('VND-AF4AAF20', 'IOT/EMBEDDED', 0.00, '50000', 0, 0, 'VERIFIED', -6.92020000, 107.60840000);

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
('JOB-2026-B86E', 'USER-4E2582C4', 'VND-AF4AAF20', 'PEMBUATAN HIDROPONIK BERBASIS IOT', 'pembuatan hidroponik berbasis IOT', 'IOT/EMBEDDED', 'COMPLETED', '[17/05 13:31] BAST Diterbitkan. Proyek Selesai.', 50000.00, 14);

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
('JOB-2026-B86E', 2);

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
(2, 'PYTHON');

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
('TRX-ESC-5091', 'USER-4E2582C4', 'JOB-2026-B86E', 'PENAHANAN DANA (ESCROW)', -50000.00, 'SUCCESS', '2026-05-17 11:16:49'),
('TRX-IN-A6D2', 'VND-AF4AAF20', 'JOB-2026-B86E', 'PENERIMAAN DANA (SPK SELESAI)', 50000.00, 'SUCCESS', '2026-05-17 13:31:37'),
('TRX-OUT-B642', 'USER-4E2582C4', 'JOB-2026-B86E', 'BAST TERBIT (ESCROW RELEASE)', -50000.00, 'SUCCESS', '2026-05-17 13:31:37'),
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
('USER-4E2582C4', 'agiel', 'agiel@gmail.com', '$2b$12$yeEZ6BDUgatalSU1hQaGIOFLms.28mnA6/CO5sCz09jjLuKmgrI9a', 'klien'),
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
('USER-4E2582C4', 50000.00, 0.00),
('VND-AF4AAF20', 50000.00, 0.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `mitra_profiles`
--
ALTER TABLE `mitra_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `mitra_id` (`mitra_id`);

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
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `mitra_profiles`
--
ALTER TABLE `mitra_profiles`
  ADD CONSTRAINT `mitra_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`mitra_id`) REFERENCES `users` (`id`);

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
