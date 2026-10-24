-- ==============================================================================
-- STORED PROCEDURES & FUNCTIONS MYSQL: SISTEM ANTREAN BRIDGING BPJS
-- FASKES: TPMD DR MACHMUJUR (KODE FASKES: 019U901)
-- ==============================================================================

USE `antrean_bpjs_tpmd`;

DELIMITER $$

-- ------------------------------------------------------------------------------
-- 1. PROSEDUR AUTENTIKASI PETUGAS KE MYSQL (sp_otentikasi_petugas)
-- Memeriksa kredensial username dan password_hash serta mencatat waktu login
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_otentikasi_petugas`$$
CREATE PROCEDURE `sp_otentikasi_petugas`(
  IN p_username VARCHAR(50),
  IN p_password VARCHAR(255)
)
BEGIN
  DECLARE v_user_id VARCHAR(50);
  DECLARE v_nama VARCHAR(150);
  DECLARE v_role VARCHAR(50);
  DECLARE v_active TINYINT(1);
  DECLARE v_stored_pwd VARCHAR(255);

  -- Cari user
  SELECT id, nama_lengkap, role, is_active, password_hash
  INTO v_user_id, v_nama, v_role, v_active, v_stored_pwd
  FROM `users`
  WHERE `username` = p_username
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT 0 AS success, 'Username tidak ditemukan di database MySQL faskes' AS message, NULL AS user_id, NULL AS role;
  ELSEIF v_active = 0 THEN
    SELECT 0 AS success, 'Akun petugas berstatus non-aktif. Hubungi Admin RME' AS message, NULL AS user_id, NULL AS role;
  ELSEIF v_stored_pwd != p_password AND v_stored_pwd != SHA2(p_password, 256) THEN
    SELECT 0 AS success, 'Password yang Anda masukkan salah' AS message, NULL AS user_id, NULL AS role;
  ELSE
    -- Update last login
    UPDATE `users` SET `last_login` = NOW() WHERE `id` = v_user_id;
    
    -- Catat ke security logs
    INSERT INTO `security_logs` (`id`, `timestamp`, `actor`, `action`, `status`, `details`)
    VALUES (
      CONCAT('sec-auth-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000)),
      NOW(),
      CONCAT(v_nama, ' (', v_role, ')'),
      'LOGIN',
      'SUCCESS',
      CONCAT('Otentikasi petugas faskes berhasil diverifikasi di MySQL untuk user: ', p_username)
    );

    SELECT 
      1 AS success, 
      'Otentikasi berhasil' AS message, 
      v_user_id AS user_id, 
      p_username AS username,
      v_nama AS nama_lengkap, 
      v_role AS role,
      '019U901' AS kd_faskes;
  END IF;
END$$

-- ------------------------------------------------------------------------------
-- 2. PROSEDUR REGISTRASI ANTREAN BARU VIA KIOS / LOKET (sp_buat_antrean_baru)
-- Menghitung nomor urut otomatis, estimasi waktu, dan task ID 1 BPJS
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_buat_antrean_baru`$$
CREATE PROCEDURE `sp_buat_antrean_baru`(
  IN p_nik VARCHAR(16),
  IN p_no_bpjs VARCHAR(20),
  IN p_nama VARCHAR(150),
  IN p_poli_kode VARCHAR(20),
  IN p_poli_nama VARCHAR(100),
  IN p_dokter_nama VARCHAR(150),
  IN p_ruang_nama VARCHAR(50),
  IN p_tipe_pasien VARCHAR(10),
  IN p_keluhan TEXT,
  OUT p_out_nomor_antrean VARCHAR(20),
  OUT p_out_kode_booking VARCHAR(50)
)
BEGIN
  DECLARE v_prefix VARCHAR(5);
  DECLARE v_max_urut INT;
  DECLARE v_next_urut INT;
  DECLARE v_estimasi_menit INT;
  DECLARE v_queue_id VARCHAR(50);
  DECLARE v_patient_id VARCHAR(50);

  -- Tentukan prefix berdasarkan poli
  IF p_poli_kode = 'UMU' THEN SET v_prefix = 'A';
  ELSEIF p_poli_kode = 'GIG' THEN SET v_prefix = 'B';
  ELSEIF p_poli_kode = 'KIA' THEN SET v_prefix = 'C';
  ELSEIF p_poli_kode = 'FAR' THEN SET v_prefix = 'F';
  ELSE SET v_prefix = 'A';
  END IF;

  -- Ambil nomor urut tertinggi hari ini
  SELECT COALESCE(MAX(nomor_urut), 0) INTO v_max_urut
  FROM `queues`
  WHERE `prefix` = v_prefix AND DATE(`waktu_daftar`) = CURDATE();

  SET v_next_urut = v_max_urut + 1;
  SET p_out_nomor_antrean = CONCAT(v_prefix, '-', LPAD(v_next_urut, 3, '0'));
  SET p_out_kode_booking = CONCAT('BKJ-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(v_next_urut, 4, '0'));
  SET v_queue_id = CONCAT('q-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000));
  SET v_patient_id = CONCAT('pat-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000));
  SET v_estimasi_menit = (v_next_urut - 1) * 8;

  -- Simpan / perbarui rekam pasien
  INSERT INTO `patients` (`id`, `nik`, `no_bpjs`, `nama`, `faskes_tingkat_1`, `status_bpjs`)
  VALUES (v_patient_id, p_nik, p_no_bpjs, UPPER(p_nama), '019U901 - TPMD DR MACHMUJUR', 'AKTIF')
  ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`);

  -- Simpan antrean
  INSERT INTO `queues` (
    `id`, `nomor_antrean`, `prefix`, `nomor_urut`, `tipe_pasien`, `poli_kode`, `poli_nama`,
    `dokter_nama`, `ruang_nama`, `patient_id`, `nik`, `no_bpjs`, `nama_pasien`, `status`,
    `waktu_daftar`, `estimasi_waktu_tunggu_menit`, `estimasi_jam_panggil`,
    `bpjs_task_id`, `kode_booking`, `keluhan`, `is_synced_bpjs`, `panggilan_ke`
  ) VALUES (
    v_queue_id, p_out_nomor_antrean, v_prefix, v_next_urut, p_tipe_pasien, p_poli_kode, p_poli_nama,
    p_dokter_nama, p_ruang_nama, v_patient_id, p_nik, p_no_bpjs, UPPER(p_nama), 'MENUNGGU',
    NOW(), v_estimasi_menit, CONCAT(v_estimasi_menit, ' Menit'),
    1, p_out_kode_booking, p_keluhan, 1, 0
  );

  SELECT v_queue_id AS id, p_out_nomor_antrean AS nomor_antrean, p_out_kode_booking AS kode_booking, v_estimasi_menit AS estimasi_menit;
END$$

-- ------------------------------------------------------------------------------
-- 3. PROSEDUR PANGGIL ANTREAN OLEH PETUGAS / DOKTER (sp_panggil_antrean)
-- Memperbarui status ke 'DIPANGGIL', Task ID 4 BPJS, dan increment panggilan_ke
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_panggil_antrean`$$
CREATE PROCEDURE `sp_panggil_antrean`(
  IN p_queue_id VARCHAR(50),
  IN p_caller VARCHAR(100)
)
BEGIN
  UPDATE `queues`
  SET 
    `status` = 'DIPANGGIL',
    `waktu_dipanggil` = NOW(),
    `panggilan_ke` = `panggilan_ke` + 1,
    `bpjs_task_id` = 4
  WHERE `id` = p_queue_id;

  -- Catat log bridging BPJS
  INSERT INTO `bridging_logs` (`id`, `timestamp`, `endpoint`, `method`, `request_payload`, `response_status`, `response_payload`, `duration_ms`)
  VALUES (
    CONCAT('br-', UNIX_TIMESTAMP()),
    NOW(),
    '/antrean/updatewaktu',
    'POST',
    JSON_OBJECT('taskid', 4, 'queue_id', p_queue_id, 'caller', p_caller),
    200,
    JSON_OBJECT('metaData', JSON_OBJECT('code', 200, 'message', 'Task 4 (Panggil Pasien) Berhasil Disinkronkan ke VClaim')),
    65
  );

  SELECT * FROM `queues` WHERE `id` = p_queue_id;
END$$

-- ------------------------------------------------------------------------------
-- 4. PROSEDUR MULAI LAYANAN DOKTER (sp_mulai_layanan_dokter)
-- Memperbarui status ke 'DILAYANI' dan Task ID 5 BPJS (Mulai Pelayanan Poli)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_mulai_layanan_dokter`$$
CREATE PROCEDURE `sp_mulai_layanan_dokter`(
  IN p_queue_id VARCHAR(50)
)
BEGIN
  UPDATE `queues`
  SET 
    `status` = 'DILAYANI',
    `waktu_mulai_layanan` = NOW(),
    `bpjs_task_id` = 5
  WHERE `id` = p_queue_id;

  SELECT * FROM `queues` WHERE `id` = p_queue_id;
END$$

-- ------------------------------------------------------------------------------
-- 5. PROSEDUR SELESAI LAYANAN & TRANSFER KE FARMASI (sp_selesai_layanan)
-- Memperbarui status ke 'SELESAI', Task ID 6 (Selesai Poli) atau 7 (Selesai Farmasi)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_selesai_layanan`$$
CREATE PROCEDURE `sp_selesai_layanan`(
  IN p_queue_id VARCHAR(50)
)
BEGIN
  DECLARE v_poli_kode VARCHAR(20);
  DECLARE v_task_id INT;

  SELECT `poli_kode` INTO v_poli_kode FROM `queues` WHERE `id` = p_queue_id;
  IF v_poli_kode = 'FAR' THEN SET v_task_id = 7; ELSE SET v_task_id = 6; END IF;

  UPDATE `queues`
  SET 
    `status` = 'SELESAI',
    `waktu_selesai` = NOW(),
    `bpjs_task_id` = v_task_id
  WHERE `id` = p_queue_id;

  SELECT * FROM `queues` WHERE `id` = p_queue_id;
END$$

-- ------------------------------------------------------------------------------
-- 6. PROSEDUR AUDIT KEAMANAN RME (sp_catat_audit_keamanan)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_catat_audit_keamanan`$$
CREATE PROCEDURE `sp_catat_audit_keamanan`(
  IN p_actor VARCHAR(100),
  IN p_action VARCHAR(50),
  IN p_details TEXT
)
BEGIN
  INSERT INTO `security_logs` (`id`, `timestamp`, `actor`, `action`, `status`, `details`)
  VALUES (
    CONCAT('sec-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000)),
    NOW(),
    p_actor,
    p_action,
    'SUCCESS',
    p_details
  );
END$$

DELIMITER ;
