-- ==============================================================================
-- SKEMA BASIS DATA MYSQL: SISTEM ANTREAN BRIDGING BPJS & REKAM MEDIS
-- FASKES TINGKAT 1: TPMD DR MACHMUJUR (KODE FASKES: 019U901)
-- STANDAR: VCLAIM / PCARE TRUSTMARK BPJS KESEHATAN & UU PDP NO. 27/2022
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `antrean_bpjs_tpmd` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `antrean_bpjs_tpmd`;

-- ------------------------------------------------------------------------------
-- 1. TABEL PENGGUNA / PETUGAS FASKES (users)
-- Autentikasi multi-role: Dokter, Petugas Loket, Farmasi, Admin Bridging, Admin RME
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `role` ENUM('ADMIN_BRIDGING', 'ADMIN_RME', 'DOKTER', 'PETUGAS_LOKET', 'PETUGAS_FARMASI') NOT NULL DEFAULT 'PETUGAS_LOKET',
  `nip` VARCHAR(30) DEFAULT NULL,
  `kd_faskes` VARCHAR(20) NOT NULL DEFAULT '019U901',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABEL KONFIGURASI BRIDGING BPJS FASKES (faskes_config)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faskes_config` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `kd_faskes` VARCHAR(20) NOT NULL,
  `nama_faskes` VARCHAR(150) NOT NULL,
  `cons_id` VARCHAR(50) NOT NULL,
  `secret_key` VARCHAR(100) NOT NULL,
  `user_key` VARCHAR(100) NOT NULL,
  `dev_user` VARCHAR(50) DEFAULT NULL,
  `dev_pass` VARCHAR(50) DEFAULT NULL,
  `environment` ENUM('tester', 'production') DEFAULT 'tester',
  `base_url` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_kd_faskes` (`kd_faskes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABEL REKAM IDENTITAS PASIEN (patients)
-- Dilengkapi kolom data terenkripsi AES-256-GCM sesuai regulasi privasi PII
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nik` VARCHAR(16) NOT NULL,
  `no_bpjs` VARCHAR(20) DEFAULT NULL,
  `nama` VARCHAR(150) NOT NULL,
  `tgl_lahir` DATE DEFAULT NULL,
  `jenis_kelamin` ENUM('L', 'P') DEFAULT 'L',
  `no_hp` VARCHAR(25) DEFAULT NULL,
  `alamat` TEXT DEFAULT NULL,
  `status_bpjs` VARCHAR(50) DEFAULT 'AKTIF',
  `jenis_peserta` VARCHAR(100) DEFAULT 'PBI APBN',
  `faskes_tingkat_1` VARCHAR(150) DEFAULT '019U901 - TPMD DR MACHMUJUR',
  `kelas_rawat` VARCHAR(50) DEFAULT 'Kelas 3',
  `encrypted_data` TEXT DEFAULT NULL COMMENT 'Payload PII Terenkripsi AES-256-GCM',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nik` (`nik`),
  INDEX `idx_no_bpjs` (`no_bpjs`),
  INDEX `idx_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABEL ANTREAN POLI & FARMASI (queues)
-- Menyimpan Task ID 1-7 BPJS, kode booking, dan status waktu antrean
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `queues` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nomor_antrean` VARCHAR(20) NOT NULL,
  `prefix` VARCHAR(5) NOT NULL,
  `nomor_urut` INT NOT NULL,
  `tipe_pasien` ENUM('BPJS', 'UMUM') NOT NULL DEFAULT 'BPJS',
  `poli_kode` VARCHAR(20) NOT NULL,
  `poli_nama` VARCHAR(100) NOT NULL,
  `dokter_nama` VARCHAR(150) NOT NULL,
  `ruang_nama` VARCHAR(50) NOT NULL,
  `patient_id` VARCHAR(50) DEFAULT NULL,
  `nik` VARCHAR(16) NOT NULL,
  `no_bpjs` VARCHAR(20) DEFAULT NULL,
  `nama_pasien` VARCHAR(150) NOT NULL,
  `status` ENUM('MENUNGGU', 'DIPANGGIL', 'DILAYANI', 'SELESAI', 'DILEWATI', 'BATAL') NOT NULL DEFAULT 'MENUNGGU',
  `waktu_daftar` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `waktu_dipanggil` TIMESTAMP NULL DEFAULT NULL,
  `waktu_mulai_layanan` TIMESTAMP NULL DEFAULT NULL,
  `waktu_selesai` TIMESTAMP NULL DEFAULT NULL,
  `estimasi_waktu_tunggu_menit` INT DEFAULT 10,
  `estimasi_jam_panggil` VARCHAR(50) DEFAULT 'Menghitung...',
  `bpjs_task_id` INT DEFAULT 1 COMMENT '1=Kios, 2=Admisi, 3=Tunggu Poli, 4=Panggil, 5=Dokter, 6=Farmasi, 7=Selesai',
  `kode_booking` VARCHAR(50) NOT NULL,
  `keluhan` TEXT DEFAULT NULL,
  `is_synced_bpjs` TINYINT(1) DEFAULT 1,
  `panggilan_ke` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_poli_kode` (`poli_kode`),
  INDEX `idx_kode_booking` (`kode_booking`),
  INDEX `idx_nomor_antrean` (`nomor_antrean`),
  INDEX `idx_waktu_daftar` (`waktu_daftar`),
  INDEX `idx_patient_id` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABEL AUDIT KEAMANAN & KRIPTOGRAFI RME (security_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `actor` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `status` ENUM('SUCCESS', 'DENIED', 'ERROR') DEFAULT 'SUCCESS',
  `details` TEXT NOT NULL,
  INDEX `idx_log_timestamp` (`timestamp`),
  INDEX `idx_log_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABEL RIWAYAT LOG BRIDGING BPJS VCLAIM / PCARE (bridging_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bridging_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `endpoint` VARCHAR(255) NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `request_header` JSON DEFAULT NULL,
  `request_payload` JSON DEFAULT NULL,
  `response_status` INT NOT NULL,
  `response_payload` JSON DEFAULT NULL,
  `duration_ms` INT DEFAULT 0,
  INDEX `idx_br_timestamp` (`timestamp`),
  INDEX `idx_br_endpoint` (`endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: PETUGAS & PENGGUNA FASKES (users)
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `password_hash`, `nama_lengkap`, `role`, `nip`, `kd_faskes`, `is_active`)
VALUES
  ('usr-1', '0195U091-dev', '000000', 'Operator Bridging BPJS (VClaim)', 'ADMIN_BRIDGING', '198805122010011001', '019U901', 1),
  ('usr-2', 'admin', '000000', 'Administrator Rekam Medis (RME)', 'ADMIN_RME', '199003202015022002', '019U901', 1),
  ('usr-3', 'dr.machmujur', '000000', 'dr. Machmujur, M.Kes', 'DOKTER', '197508152002121003', '019U901', 1),
  ('usr-4', 'loket01', '000000', 'Petugas Pendaftaran Loket 01', 'PETUGAS_LOKET', '199511252019032004', '019U901', 1),
  ('usr-5', 'farmasi01', '000000', 'Apt. Farhan Maulana, S.Farm', 'PETUGAS_FARMASI', '199204102017011005', '019U901', 1)
ON DUPLICATE KEY UPDATE `nama_lengkap` = VALUES(`nama_lengkap`), `role` = VALUES(`role`), `password_hash` = VALUES(`password_hash`);

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: KONFIGURASI FASKES TPMD DR MACHMUJUR
-- ------------------------------------------------------------------------------
INSERT INTO `faskes_config` (`id`, `kd_faskes`, `nama_faskes`, `cons_id`, `secret_key`, `user_key`, `dev_user`, `dev_pass`, `environment`, `base_url`)
VALUES (
  'cfg-default',
  '019U901',
  'TPMD DR MACHMUJUR',
  '11495',
  '4xHABA0A84',
  '4a1a84234ffc19f0c77750cebfa2444e',
  '0195U091-dev',
  'Dev1234#',
  'tester',
  'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev'
) ON DUPLICATE KEY UPDATE `kd_faskes` = VALUES(`kd_faskes`);
