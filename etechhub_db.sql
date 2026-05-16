-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 16, 2026 at 09:37 AM
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
  `projects_completed` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mitra_profiles`
--

INSERT INTO `mitra_profiles` (`user_id`, `specialty_role`, `rating`, `hourly_rate_or_fee`, `avg_speed_days`, `projects_completed`) VALUES
('VND-B420881E', 'General IT Vendor', 0.00, NULL, 0, 0);

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
  `service_type` enum('REMOTE','HIBRIDA','DROP-OFF','ONLINE','OFFLINE') NOT NULL,
  `status` enum('OPEN','SEDANG DIKERJAKAN','MENUNGGU UAT','COMPLETED','CANCELLED') DEFAULT NULL,
  `current_milestone` varchar(255) DEFAULT NULL,
  `budget` decimal(15,2) NOT NULL,
  `deadline_days` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `client_id`, `mitra_id`, `title`, `description`, `service_type`, `status`, `current_milestone`, `budget`, `deadline_days`) VALUES
('JOB-2026-0BCA', 'USER-9D184CCE', NULL, 'PEMBUATAN API', 'lebih jelas di brief', 'ONLINE', 'OPEN', NULL, 100000.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_tags`
--

CREATE TABLE `project_tags` (
  `project_id` varchar(50) DEFAULT NULL,
  `tag_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `tag_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
('TRX-ESC-BD1A', 'USER-9D184CCE', 'JOB-2026-0BCA', 'PENAHANAN DANA (ESCROW)', -100000.00, 'SUCCESS', '2026-05-15 20:53:44'),
('TRX-PG-6F2C', 'USER-9D184CCE', NULL, 'TOP UP ONLINE (PAYMENT GATEWAY)', 100000.00, 'SUCCESS', '2026-05-15 19:57:29'),
('TRX-PG-B4EC', 'USER-9D184CCE', NULL, 'TOP UP ONLINE (PAYMENT GATEWAY)', 10000.00, 'SUCCESS', '2026-05-15 20:00:55');

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
('USER-9D184CCE', 'agielf', 'agiel@gmail.com', '$2b$12$bV96yOB9UMDuEL1elVjPM.5gDiUpCzDgBWnM5NcQUIB1JHYj1gto6', 'klien'),
('VND-B420881E', 'putra', 'putra@gmail.com', '$2b$12$nsAkcNjG1oGJfV0WG5GQXufKwnfTfTGYpTAm.c/w9epeYGxeQsKyq', 'mitra');

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
('USER-9D184CCE', 10000.00, 100000.00);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
