-- ==============================================================================
-- SKEMA BASIS DATA MYSQL: SISTEM ANTREAN BRIDGING BPJS & REKAM MEDIS
-- FASKES TINGKAT 1: TPMD DR MACHMUJUR (KODE FASKES: 019U901)
-- STANDAR: ANTREAN ONLINE FKTP (MOBILE JKN) & PCARE TRUSTMARK BPJS KESEHATAN & UU PDP NO. 27/2022
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `klinik_somban_medika_xx26` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `klinik_somban_medika_xx26`;

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
  `is_online` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_kd_faskes` (`kd_faskes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABEL MASTER POLIKLINIK & DOKTER (poliklinik)
-- Menyimpan daftar poli, dokter penanggung jawab, jadwal, dan kuota antrean
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `poliklinik` (
  `kode` VARCHAR(20) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `prefix` VARCHAR(5) NOT NULL,
  `dokter_nama` VARCHAR(150) NOT NULL,
  `sip` VARCHAR(100) DEFAULT NULL,
  `ruang` VARCHAR(100) NOT NULL,
  `durasi_rata_rata_menit` INT DEFAULT 10,
  `kuota_total` INT DEFAULT 50,
  `kuota_terpakai` INT DEFAULT 0,
  `badge_color` VARCHAR(50) DEFAULT 'emerald',
  `icon_name` VARCHAR(50) DEFAULT 'Stethoscope',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_prefix` (`prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABEL REKAM IDENTITAS PASIEN (patients)
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
-- 6. TABEL RIWAYAT LOG BRIDGING BPJS ANTREAN ONLINE / PCARE (bridging_logs)
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
  ('usr-1', '0195U091-dev', '000000', 'Operator Bridging Antrean BPJS (Mobile JKN)', 'ADMIN_BRIDGING', '198805122010011001', '019U901', 1),
  ('usr-2', 'admin', '000000', 'Administrator Rekam Medis (RME)', 'ADMIN_RME', '199003202015022002', '019U901', 1),
  ('usr-3', 'dr.machmujur', '000000', 'Dokter Pemeriksa', 'DOKTER', '197508152002121003', '019U901', 1),
  ('usr-4', 'loket01', '000000', 'Petugas Pendaftaran Loket 01', 'PETUGAS_LOKET', '199511252019032004', '019U901', 1),
  ('usr-5', 'farmasi01', '000000', 'Petugas Farmasi & Apotek', 'PETUGAS_FARMASI', '199204102017011005', '019U901', 1)
ON DUPLICATE KEY UPDATE `nama_lengkap` = VALUES(`nama_lengkap`), `role` = VALUES(`role`), `password_hash` = VALUES(`password_hash`);

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: KONFIGURASI FASKES TPMD DR MACHMUJUR
-- ------------------------------------------------------------------------------
INSERT INTO `faskes_config` (`id`, `kd_faskes`, `nama_faskes`, `cons_id`, `secret_key`, `user_key`, `dev_user`, `dev_pass`, `environment`, `base_url`, `is_online`)
VALUES (
  'cfg-default',
  '019U901',
  'KLINIK SOMBAN MEDIKA',
  '11495',
  '4xHABA0A84',
  '4a1a84234ffc19f0c77750cebfa2444e',
  '0195U091-dev',
  'Dev1234#',
  'tester',
  'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev',
  0
) ON DUPLICATE KEY UPDATE `kd_faskes` = VALUES(`kd_faskes`), `base_url` = IF(`base_url` LIKE '%vclaim%', 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev', `base_url`);

-- ------------------------------------------------------------------------------
-- 7. TABEL MASTER RS RUJUKAN SELURUH INDONESIA (rs_rujukan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rs_rujukan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `kode_faskes` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(200) NOT NULL,
  `kelas` ENUM('A', 'B', 'C', 'D', 'Khusus') NOT NULL DEFAULT 'B',
  `jenis` VARCHAR(80) NOT NULL DEFAULT 'RSUD',
  `kota` VARCHAR(120) NOT NULL,
  `provinsi` VARCHAR(120) NOT NULL,
  `alamat` TEXT DEFAULT NULL,
  `telepon` VARCHAR(50) DEFAULT NULL,
  `is_bpjs` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rs_provinsi` (`provinsi`),
  INDEX `idx_rs_kota` (`kota`),
  INDEX `idx_rs_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABEL RIWAYAT KUNJUNGAN & RUJUKAN PCARE (pcare_visits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pcare_visits` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `no_kunjungan` VARCHAR(50) DEFAULT NULL,
  `no_rujukan` VARCHAR(50) DEFAULT NULL,
  `queue_id` VARCHAR(50) DEFAULT NULL,
  `no_kartu` VARCHAR(20) NOT NULL,
  `nik` VARCHAR(16) DEFAULT NULL,
  `nama_pasien` VARCHAR(150) NOT NULL,
  `poli_kode` VARCHAR(20) NOT NULL,
  `poli_nama` VARCHAR(100) NOT NULL,
  `sistole` INT DEFAULT 120,
  `diastole` INT DEFAULT 80,
  `heart_rate` INT DEFAULT 78,
  `resp_rate` INT DEFAULT 18,
  `suhu` VARCHAR(10) DEFAULT '36.5',
  `berat_badan` DECIMAL(5,2) DEFAULT NULL,
  `tinggi_badan` DECIMAL(5,2) DEFAULT NULL,
  `kesadaran` VARCHAR(10) DEFAULT '01',
  `anamnesa` TEXT DEFAULT NULL,
  `diagnosa_kode` VARCHAR(20) NOT NULL,
  `diagnosa_nama` VARCHAR(255) NOT NULL,
  `terapi_obat` TEXT DEFAULT NULL,
  `status_pulang` VARCHAR(80) NOT NULL,
  `ppk_rujuk` VARCHAR(20) DEFAULT NULL,
  `nama_ppk_rujuk` VARCHAR(200) DEFAULT NULL,
  `poli_rujuk` VARCHAR(20) DEFAULT NULL,
  `tgl_rencana_rujuk` VARCHAR(20) DEFAULT NULL,
  `catatan_rujukan` TEXT DEFAULT NULL,
  `is_bridged` TINYINT(1) NOT NULL DEFAULT 0,
  `bridging_status` VARCHAR(60) NOT NULL DEFAULT 'SAVED_MYSQL_PENDING_BRIDGING',
  `bpjs_response` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pcare_nokunjungan` (`no_kunjungan`),
  INDEX `idx_pcare_nokartu` (`no_kartu`),
  INDEX `idx_pcare_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: MASTER POLIKLINIK & DOKTER (poliklinik)
-- ------------------------------------------------------------------------------
INSERT INTO `poliklinik` (`kode`, `nama`, `prefix`, `dokter_nama`, `sip`, `ruang`, `durasi_rata_rata_menit`, `kuota_total`, `kuota_terpakai`, `badge_color`, `icon_name`)
VALUES
  ('UMU', 'Poli Umum', 'A', '', '', 'Ruang 01 (Lantai 1)', 10, 60, 0, 'emerald', 'Stethoscope'),
  ('GIG', 'Poli Gigi & Mulut', 'B', '', '', 'Ruang 02 (Lantai 1)', 15, 30, 0, 'blue', 'Smile'),
  ('KIA', 'Poli KIA & KB', 'C', '', '', 'Ruang 03 (Lantai 1)', 12, 40, 0, 'purple', 'HeartPulse'),
  ('FAR', 'Apotek & Farmasi', 'F', '', '', 'Loket Farmasi Utama', 6, 100, 0, 'amber', 'Pill')
ON DUPLICATE KEY UPDATE 
  `dokter_nama` = VALUES(`dokter_nama`), 
  `nama` = VALUES(`nama`), 
  `sip` = VALUES(`sip`), 
  `ruang` = VALUES(`ruang`);

-- ------------------------------------------------------------------------------
-- SEED DATA PRIORITAS: RS RUJUKAN DAERAH SIDOARJO & SEKITARNYA (rs_rujukan)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `rs_rujukan` (`id`, `kode_faskes`, `nama`, `kelas`, `jenis`, `kota`, `provinsi`, `alamat`, `is_bpjs`)
VALUES
  ('rs-0195r001', '0195R001', 'RSUD Sidoarjo (R.T. Notopuro)', 'A', 'RSUD', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Mojopahit No. 667, Celep, Sidoarjo', 1),
  ('rs-0195r002', '0195R002', 'RSI Siti Hajar Sidoarjo', 'B', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raden Patah No. 70-72, Sidoarjo', 1),
  ('rs-0195r003', '0195R003', 'RS Delta Surya Sidoarjo', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Pahlawan No. 9, Sidoarjo', 1),
  ('rs-0195r004', '0195R004', 'RS Mitra Keluarga Waru', 'B', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Jend. S. Parman No. 8, Waru, Sidoarjo', 1),
  ('rs-0195r005', '0195R005', 'RSU Anwar Medika Krian', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Bypass Krian KM 33, Balongbendo, Sidoarjo', 1),
  ('rs-0195r006', '0195R006', 'RS Jasem Sidoarjo', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Samanhudi No. 85a, Sidoarjo', 1),
  ('rs-0195r007', '0195R007', 'RSUD Sidoarjo Barat', 'C', 'RSUD', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Bibis Bunder, Tambak Kemerakan, Krian, Sidoarjo', 1),
  ('rs-0195r008', '0195R008', 'RS Bhayangkara Pusdik Sabhara Porong', 'C', 'RS Polri', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Porong No. 1, Porong, Sidoarjo', 1),
  ('rs-0195r009', '0195R009', 'RS Rahman Rahim Sukodono', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Saimbang, Kebonagung, Sukodono, Sidoarjo', 1),
  ('rs-0195r010', '0195R010', 'RS Citra Medika Tarik', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Surabaya-Mojokerto KM 44, Tarik, Sidoarjo', 1),
  ('rs-0195r011', '0195R011', 'RS Pusura Candi Sidoarjo', 'D', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Gelam No. 39, Gelam, Candi, Sidoarjo', 1),
  ('rs-0195r012', '0195R012', 'RSI Siti Khodijah Muhammadiyah Sepanjang', 'B', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Bebekan, Sepanjang, Taman, Sidoarjo', 1),
  ('rs-0195r013', '0195R013', 'RSU Al-Islam H.M. Mawardi Krian', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Kyai Mojo No. 12A, Jerukgamping, Krian, Sidoarjo', 1),
  ('rs-0195r014', '0195R014', 'RSU Aisyiyah Siti Fatimah Tulangan', 'D', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Kenongo No. 14, Tulangan, Sidoarjo', 1),
  ('rs-0195r015', '0195R015', 'RSU Bunda Waru', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Kundi No. 70, Kepuhkiriman, Waru, Sidoarjo', 1),
  ('rs-0195r016', '0195R016', 'RSU Prima Husada Waru', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Letjen Suprapto No. 3, Kepuhkiriman, Waru, Sidoarjo', 1),
  ('rs-0195r017', '0195R017', 'RS Mitra Keluarga Pondok Tjandra', 'C', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Taman Asri, Tambaksumur, Waru, Sidoarjo', 1),
  ('rs-0195r018', '0195R018', 'RSU Aminah Prambon', 'D', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Untung Suropati, Watutulis, Prambon, Sidoarjo', 1),
  ('rs-0195r019', '0195R019', 'RSU Assakinah Medika Sukodono', 'D', 'RSU Swasta', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Kebon Agung No. 65, Sukodono, Sidoarjo', 1),
  ('rs-0195r020', '0195R020', 'RSIA Soerya Sepanjang', 'C', 'RS Khusus Ibu & Anak', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Kalijaten No. 11-15, Taman, Sidoarjo', 1),
  ('rs-0195r021', '0195R021', 'RSIA Kirana Taman', 'C', 'RS Khusus Ibu & Anak', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Ngelom No. 87, Taman, Sidoarjo', 1),
  ('rs-0195r022', '0195R022', 'RSIA Pondok Tjandra', 'C', 'RS Khusus Ibu & Anak', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Mangga I E No. 225, Waru, Sidoarjo', 1),
  ('rs-0195r023', '0195R023', 'RSIA Buah Delima Sidoarjo', 'C', 'RS Khusus Ibu & Anak', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Sunandar Priyo Sudarmo No. 154, Sidoarjo', 1),
  ('rs-0195r024', '0195R024', 'RS Mata Fatma Sepanjang', 'C', 'RS Khusus Mata', 'Kab. Sidoarjo', 'Jawa Timur', 'Jl. Raya Kalijaten No. 40, Taman, Sidoarjo', 1),
  ('rs-0201r008', '0201R008', 'RSI Surabaya Jemursari', 'B', 'RSU Swasta', 'Kota Surabaya', 'Jawa Timur', 'Jl. Raya Jemursari No. 51-57, Wonocolo, Surabaya', 1),
  ('rs-0201r009', '0201R009', 'RS Bhayangkara Tk. II H.S. Samsoeri Mertojoso', 'B', 'RS Polri', 'Kota Surabaya', 'Jawa Timur', 'Jl. Jend. Ahmad Yani No. 116, Gayungan, Surabaya', 1),
  ('rs-0201r010', '0201R010', 'RS Royal Surabaya', 'B', 'RSU Swasta', 'Kota Surabaya', 'Jawa Timur', 'Jl. Rungkut Industri I No. 1, Tenggilis Mejoyo, Surabaya', 1),
  ('rs-0201r011', '0201R011', 'RSUD Eka Candrarini Surabaya', 'C', 'RSUD', 'Kota Surabaya', 'Jawa Timur', 'Jl. Medokan Asri Tengah No. 2, Rungkut, Surabaya', 1),
  ('rs-0201r012', '0201R012', 'RS Mata Masyarakat Jawa Timur', 'B', 'RS Khusus Mata', 'Kota Surabaya', 'Jawa Timur', 'Jl. Ketintang Baru Selatan I No. 1, Gayungan, Surabaya', 1),
  ('rs-0201r013', '0201R013', 'RS Marinir Ewa Pangalila', 'D', 'RS TNI AL', 'Kota Surabaya', 'Jawa Timur', 'Jl. Golf No. 1, Gunungsari, Dukuh Pakis, Surabaya', 1),
  ('rs-0201r014', '0201R014', 'RS Bhakti Rahayu Surabaya', 'D', 'RSU Swasta', 'Kota Surabaya', 'Jawa Timur', 'Jl. Ketintang Madya I No. 16, Jambangan, Surabaya', 1),
  ('rs-0208r002', '0208R002', 'RSUD Prof. Dr. Soekandar Mojosari', 'B', 'RSUD', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Hayam Wuruk No. 25, Mojosari, Kab. Mojokerto', 1),
  ('rs-0208r003', '0208R003', 'RSI Sakinah Mojokerto', 'C', 'RSU Swasta', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. R.A. Basuni KM 12, Sooko, Kab. Mojokerto', 1),
  ('rs-0208r004', '0208R004', 'RS Mawaddah Medika Ngoro', 'C', 'RSU Swasta', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Raya Ngoro KM 5, Ngoro, Kab. Mojokerto', 1),
  ('rs-0208r005', '0208R005', 'RS Sido Waras Bangsal', 'C', 'RSU Swasta', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Raya Pasar Sawahan KM 10, Bangsal, Kab. Mojokerto', 1),
  ('rs-0208r006', '0208R006', 'RSUD Dr. R. Achmad Basoeni Gedek', 'C', 'RSUD', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Raya Gedek No. 17, Gedek, Kab. Mojokerto', 1),
  ('rs-0208r007', '0208R007', 'IHC RS Gatoel Mojokerto', 'C', 'RSU Swasta', 'Kota Mojokerto', 'Jawa Timur', 'Jl. Raden Wijaya No. 56, Kranggan, Kota Mojokerto', 1),
  ('rs-0208r008', '0208R008', 'RS Reksa Waluya Mojokerto', 'C', 'RSU Swasta', 'Kota Mojokerto', 'Jawa Timur', 'Jl. Mojopahit No. 422, Kranggan, Kota Mojokerto', 1),
  ('rs-0208r009', '0208R009', 'RSI Arofah Mojosari', 'D', 'RSU Swasta', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Gajah Mada No. 1, Mojosari, Kab. Mojokerto', 1),
  ('rs-0208r010', '0208R010', 'RSU Kartini Mojosari', 'D', 'RSU Swasta', 'Kab. Mojokerto', 'Jawa Timur', 'Jl. Airlangga No. 137, Mojosari, Kab. Mojokerto', 1),
  ('rs-0209r002', '0209R002', 'RSUD Dr. R. Soedarsono Kota Pasuruan', 'C', 'RSUD', 'Kota Pasuruan', 'Jawa Timur', 'Jl. Dokter Wahidin Sudiro Husodo No. 1-4, Kota Pasuruan', 1),
  ('rs-0209r003', '0209R003', 'RSI Masyithoh Bangil', 'C', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. A. Yani No. 6-7, Bangil, Kab. Pasuruan', 1),
  ('rs-0209r004', '0209R004', 'RS Prima Husada Sukorejo', 'C', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya Surabaya-Malang KM 54, Sukorejo, Kab. Pasuruan', 1),
  ('rs-0209r005', '0209R005', 'RS Bhayangkara Pusdik Brimob Watukosek', 'D', 'RS Polri', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya Watukosek, Gempol, Kab. Pasuruan', 1),
  ('rs-0209r006', '0209R006', 'RS Asih Abyakta Gempol', 'D', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya Kepulungan KM 37, Gempol, Kab. Pasuruan', 1),
  ('rs-0209r007', '0209R007', 'RS Mitra Sehat Medika Pandaan', 'D', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya By Pass KM 42, Pandaan, Kab. Pasuruan', 1),
  ('rs-0209r008', '0209R008', 'RS Hermina Pasuruan', 'C', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya Sambirejo, Rejoso, Kab. Pasuruan', 1),
  ('rs-0209r009', '0209R009', 'RS Sahabat Sukorejo', 'D', 'RSU Swasta', 'Kab. Pasuruan', 'Jawa Timur', 'Jl. Raya Surabaya-Malang KM 50, Sukorejo, Kab. Pasuruan', 1),
  ('rs-0207r002', '0207R002', 'RSUD Gresik Sehati', 'C', 'RSUD', 'Kab. Gresik', 'Jawa Timur', 'Jl. Raya Slempit, Kedamean, Kab. Gresik', 1),
  ('rs-0207r003', '0207R003', 'RS Semen Gresik', 'B', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. R.A. Kartini No. 280, Kebomas, Kab. Gresik', 1),
  ('rs-0207r004', '0207R004', 'RS Petrokimia Gresik', 'C', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. Jend. Ahmad Yani No. 69, Gresik', 1),
  ('rs-0207r005', '0207R005', 'RS Petrokimia Gresik Driyorejo', 'C', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. Raya Legundi KM 0.5, Driyorejo, Kab. Gresik', 1),
  ('rs-0207r006', '0207R006', 'RS Muhammadiyah Gresik', 'C', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. KH. Kholil No. 88, Kab. Gresik', 1),
  ('rs-0207r007', '0207R007', 'RS Eka Husada Menganti', 'C', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. Raya Menganti No. 22, Menganti, Kab. Gresik', 1),
  ('rs-0207r008', '0207R008', 'RSU Randegansari Husada Driyorejo', 'D', 'RSU Swasta', 'Kab. Gresik', 'Jawa Timur', 'Jl. Raya Randegansari, Driyorejo, Kab. Gresik', 1);
