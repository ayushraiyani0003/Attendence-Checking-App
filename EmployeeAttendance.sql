-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 03, 2025 at 05:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `EmployeeAttendance`
--

-- --------------------------------------------------------

--
-- Table structure for table `Attendance`
--

CREATE TABLE `Attendance` (
  `attendance_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `attendance_date` date DEFAULT NULL,
  `shift_type_id` int(11) DEFAULT NULL,
  `network_hours` int(11) DEFAULT NULL,
  `overtime_hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Audit`
--

CREATE TABLE `Audit` (
  `audit_id` int(11) NOT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`) VALUES
(1, 'HR'),
(2, 'IT'),
(3, 'Sales');

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` int(11) NOT NULL,
  `designation_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Employees`
--

CREATE TABLE `Employees` (
  `employee_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `punch_code` varchar(50) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Metrics`
--

CREATE TABLE `Metrics` (
  `metric_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `month_year` varchar(7) DEFAULT NULL,
  `network_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`network_hours`)),
  `overtime_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`overtime_hours`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ShiftTypes`
--

CREATE TABLE `ShiftTypes` (
  `shift_type_id` int(11) NOT NULL,
  `shift_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `user_role` enum('admin','user') NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `password` varchar(255) NOT NULL,
  `assigned_departments` longtext DEFAULT '[]',
  `phone_no` varchar(15) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `designation_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `name`, `department`, `user_role`, `last_login`, `is_active`, `password`, `assigned_departments`, `phone_no`, `createdAt`, `updatedAt`, `designation_id`) VALUES
(1, 'john_doe', 'John Doe', 'HR', 'admin', '2025-03-03 04:29:56', 1, '$2b$10$so3jBj/jX.owXCohiv.AxOuKuV7olTUXRXx0rZ3cXqdtELfOa2TSS', '[\"HR\", \"IT\", \"Sales\"]', '', '0000-00-00 00:00:00', '2025-03-03 04:29:56', NULL),
(2, 'jane_smith', 'Jane Smith', 'IT', 'user', '2025-03-02 10:06:49', 1, '$2b$10$XQJXwm0yf2ZZStTpZ91ldu4cZgMYNEuJfw3yV7uAfgXz1KKy7mt72', '[\"IT\"]', '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', NULL),
(3, 'samuel_jones', 'Samuel Jones', 'Sales', 'user', '2025-03-02 10:06:56', 1, '$2b$10$XQJXwm0yf2ZZStTpZ91ldu4cZgMYNEuJfw3yV7uAfgXz1KKy7mt72', '[\"Sales\"]', '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Attendance`
--
ALTER TABLE `Attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `shift_type_id` (`shift_type_id`);

--
-- Indexes for table `Audit`
--
ALTER TABLE `Audit`
  ADD PRIMARY KEY (`audit_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Employees`
--
ALTER TABLE `Employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `punch_code` (`punch_code`),
  ADD KEY `fk_employees_designation` (`designation_id`);

--
-- Indexes for table `Metrics`
--
ALTER TABLE `Metrics`
  ADD PRIMARY KEY (`metric_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `ShiftTypes`
--
ALTER TABLE `ShiftTypes`
  ADD PRIMARY KEY (`shift_type_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `username_2` (`username`),
  ADD UNIQUE KEY `username_3` (`username`),
  ADD UNIQUE KEY `username_4` (`username`),
  ADD UNIQUE KEY `username_5` (`username`),
  ADD UNIQUE KEY `username_6` (`username`),
  ADD UNIQUE KEY `username_7` (`username`),
  ADD UNIQUE KEY `username_8` (`username`),
  ADD UNIQUE KEY `username_9` (`username`),
  ADD UNIQUE KEY `username_10` (`username`),
  ADD UNIQUE KEY `username_11` (`username`),
  ADD UNIQUE KEY `username_12` (`username`),
  ADD UNIQUE KEY `username_13` (`username`),
  ADD UNIQUE KEY `username_14` (`username`),
  ADD UNIQUE KEY `username_15` (`username`),
  ADD UNIQUE KEY `username_16` (`username`),
  ADD UNIQUE KEY `username_17` (`username`),
  ADD UNIQUE KEY `username_18` (`username`),
  ADD UNIQUE KEY `username_19` (`username`),
  ADD UNIQUE KEY `username_20` (`username`),
  ADD UNIQUE KEY `username_21` (`username`),
  ADD UNIQUE KEY `username_22` (`username`),
  ADD UNIQUE KEY `username_23` (`username`),
  ADD UNIQUE KEY `username_24` (`username`),
  ADD UNIQUE KEY `username_25` (`username`),
  ADD UNIQUE KEY `username_26` (`username`),
  ADD UNIQUE KEY `username_27` (`username`),
  ADD UNIQUE KEY `username_28` (`username`),
  ADD KEY `fk_users_designation` (`designation_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Attendance`
--
ALTER TABLE `Attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Audit`
--
ALTER TABLE `Audit`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Metrics`
--
ALTER TABLE `Metrics`
  MODIFY `metric_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Attendance`
--
ALTER TABLE `Attendance`
  ADD CONSTRAINT `Attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employees` (`employee_id`),
  ADD CONSTRAINT `Attendance_ibfk_2` FOREIGN KEY (`shift_type_id`) REFERENCES `ShiftTypes` (`shift_type_id`);

--
-- Constraints for table `Employees`
--
ALTER TABLE `Employees`
  ADD CONSTRAINT `fk_employees_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `Metrics`
--
ALTER TABLE `Metrics`
  ADD CONSTRAINT `Metrics_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employees` (`employee_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
