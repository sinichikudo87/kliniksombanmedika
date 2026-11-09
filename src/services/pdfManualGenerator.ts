import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ClinicManualData {
  namaKlinik: string;
  alamat: string;
  telepon: string;
  versi: string;
  tanggalCetak: string;
}

export function generatePanduanPengoperasianPDF(
  customData?: Partial<ClinicManualData>
): jsPDF {
  const data: ClinicManualData = {
    namaKlinik: 'Klinik Somban Medika Sidoarjo',
    alamat: 'Kampung Bebek dan Telur Asin, Kebonsari RT.05 RW.03, Kec. Candi, Kabupaten Sidoarjo, Jawa Timur 61271',
    telepon: '0812-3456-7890 / (031) 895-1234',
    versi: 'v1.0 - Edisi Resmi Operasional 2026',
    tanggalCetak: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    ...customData,
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald-600
  const secondaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentTeal: [number, number, number] = [13, 148, 136]; // Teal-600
  const neutralDark: [number, number, number] = [33, 41, 52]; // Dark Slate #212934
  const lightBg: [number, number, number] = [244, 246, 249];

  // Helper untuk menambahkan footer seragam di setiap halaman
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 284, 196, 284);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${pageNum} dari ${totalPages} — Standar Operasional Prosedur (SOP) Resmi Klinik Somban Medika Sidoarjo`,
      14,
      289
    );
    doc.text(data.tanggalCetak, 175, 289);
  };

  // Helper untuk header halaman 2 & 3
  const addPageHeader = (subtitle: string) => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setFillColor(...accentTeal);
    doc.rect(0, 15, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KLINIK SOMBAN MEDIKA SIDOARJO — BUKU PANDUAN PENGOPERASIAN SISTEM (SOP)', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(subtitle, 155, 10);
  };

  // =========================================================================
  // HALAMAN 1: IDENTITAS FASKES, STRUKTUR MEDIS, POLIKLINIK BPJS & KIOSK
  // =========================================================================

  // Header Banner Top
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 42, 'F');

  // Decorative Accent bar
  doc.setFillColor(...accentTeal);
  doc.rect(0, 42, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('KLINIK SOMBAN MEDIKA SIDOARJO', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    'Faskes Tingkat Pertama (FKTP) Terakreditasi — Terintegrasi Antrean BPJS Kesehatan & SatuSehat',
    14,
    26
  );
  doc.setFontSize(8.5);
  doc.text(
    `${data.alamat} | Telp: ${data.telepon} | Kode PPK: 0192B014`,
    14,
    34
  );

  // Judul Dokumen
  doc.setTextColor(...neutralDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('BUKU STANDAR OPERASIONAL PROSEDUR (SOP) RESMI', 14, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Petunjuk Teknis Lengkap Pengoperasian Loket, Dokter Poliklinik, Kiosk Mandiri, Farmasi & Bridging BPJS (${data.versi})`,
    14,
    62
  );

  // Garis Pemisah
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 66, 196, 66);

  // SECTION 1: PROFIL DOKTER PRAKTIK & POLIKLINIK RESMI BPJS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('1. DAFTAR POLIKLINIK STANDAR BPJS & PETUGAS KLINIK RESMI', 14, 73);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Pelayanan di Klinik Somban Medika diselenggarakan sesuai standar bridging BPJS Kesehatan (Antrean RS v2 / PCare FKTP):',
    14,
    78
  );

  autoTable(doc, {
    startY: 81,
    head: [['Kode', 'Nama Poliklinik BPJS', 'Dokter DPJP / Petugas', 'Ruang Praktik', 'Akun Sistem']],
    body: [
      ['001', 'Poli Umum (Ruang 1)', 'dr. Machmujur', 'Ruang 1 (Lantai 1)', 'dr_machmujur / dokter123'],
      ['001', 'Poli Umum (Ruang 2)', 'dr. Diana', 'Ruang 2 (Lantai 1)', 'dr_diana / dokter123'],
      ['002', 'Poli Gigi & Mulut', 'dr. Diana (Dokter Umum)', 'Ruang 2 (Lantai 1)', 'dr_diana / dokter123'],
      ['003', 'Poli KIA & Kebidanan / KB', 'Bidan', 'Ruang 3 (Lantai 1)', 'bidan1 / bidan123'],
      ['004', 'Poli Lansia & Prolanis', 'dr. Diana (Dokter Umum)', 'Ruang 2 (Lantai 1)', 'dr_diana / dokter123'],
      ['005', 'Farmasi & Penyerahan Resep', 'Wandi (Petugas Farmasi)', 'Depo Farmasi Depan', 'wandi / farmasi123'],
      ['006', 'Laboratorium & Cek Darah', 'Analis Medis Somban', 'Laboratorium Medis', 'analis / analis123'],
      ['ADM', 'Loket 1 Admisi & BPJS', 'Ifa (Petugas Pendaftaran)', 'Loket 1 (Lobby Depan)', 'loket1 / loket123'],
      ['SYS', 'Administrator SIM-RS & IT', 'Dedy (Admin Faskes)', 'Kantor Server SIM-RS', 'dedy / admin123'],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // SECTION 2: ALUR KIOSK MANDIRI & KATEGORI TIKET
  const yKioskSection = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('2. ALUR PENDAFTARAN PASIEN & CETAK TIKET DI KIOSK MANDIRI', 14, yKioskSection);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Pasien yang tiba di faskes langsung menuju layar sentuh Kiosk Mandiri di lobby depan untuk mencetak tiket:',
    14,
    yKioskSection + 5
  );

  autoTable(doc, {
    startY: yKioskSection + 8,
    head: [['Huruf', 'Kategori Layanan', 'Tujuan Poli & Dokter', 'Prosedur Registrasi di Layar Kiosk']],
    body: [
      [
        'A',
        'Pasien BPJS Kesehatan',
        'Poli Umum 1 (dr. Machmujur) /\nPoli Umum 2 (dr. Diana)',
        '1. Sentuh tombol hijau "Pasien BPJS Kesehatan".\n2. Masukkan 13 digit No. Kartu BPJS atau 16 digit NIK KTP.\n3. Masukkan Nama Pasien, No. WhatsApp/HP, dan pilih Poli Tujuan.\n4. Sistem memverifikasi status aktif peserta faskes primer Sidoarjo.\n5. Tiket dicetak otomatis lengkap dengan barcode dan estimasi jam layan.',
      ],
      [
        'B',
        'Pasien Umum & Mandiri',
        'Poli Umum & Gigi Mandiri',
        '1. Sentuh tombol biru "Pasien Umum & Mandiri".\n2. Masukkan Nama Pasien & No. HP aktif.\n3. Pilih Poli Tujuan. Tiket tercetak langsung dan diarahkan ke Loket Admisi.',
      ],
      [
        'P',
        'Prioritas Khusus',
        'Lansia (>60 thn), Ibu Hamil,\nDisabilitas / Balita',
        '1. Sentuh tombol ungu "Antrean Prioritas Ramah Disabilitas".\n2. Masukkan Nama Pasien. Tiket prioritas tercetak dan dipanggil lebih dahulu di Loket 3.',
      ],
      [
        'F',
        'Farmasi & Depo Obat',
        'Penyerahan Resep Obat\n(Petugas: Wandi)',
        '1. Diterbitkan otomatis dari ruang dokter saat pemeriksaan medis selesai.\n2. Pasien dipanggil oleh Wandi saat racikan obat siap diambil di Depo Farmasi.',
      ],
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(1, 3);

  // =========================================================================
  // HALAMAN 2: SOP PEMANGGIL LOKET, PEMERIKSAAN DOKTER, FARMASI & DISPLAY TV
  // =========================================================================
  doc.addPage();
  addPageHeader('BAGIAN 2: SOP OPERASIONAL PETUGAS & DOKTER');

  // SECTION 3: PANDUAN PETUGAS LOKET & PEMANGGIL MULTIMEDIA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('3. STANDAR OPERASIONAL PROSEDUR (SOP) PETUGAS LOKET & ADMISI', 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Petugas Loket (Ifa / Petugas Jaga) mengoperasikan konsol pemanggil antrean pada menu "Loket":',
    14,
    30
  );

  autoTable(doc, {
    startY: 33,
    head: [['Aksi / Fitur', 'Fungsi Utama', 'Standar Prosedur Petugas Loket']],
    body: [
      [
        'Panggil Selanjutnya',
        'Memanggil nomor urut berikutnya',
        'Klik tombol besar hijau "Panggil Selanjutnya". Speaker otomatis membunyikan bel 3-nada resmi dilanjutkan suara bahasa Indonesia menyebut nomor antrean dan nomor loket.',
      ],
      [
        'Panggil Ulang (Re-call)',
        'Mengulang panggilan jika pasien belum hadir',
        'Bila pasien belum maju ke meja loket dalam 30 detik, tekan tombol "Panggil Ulang" (maksimal 3 kali panggilan sebelum dialihkan ke daftar Lewati).',
      ],
      [
        '+ Form Pendaftaran BPJS',
        'Registrasi langsung pasien BPJS di loket',
        'Klik tombol "+ Form Pendaftaran BPJS" untuk mendaftarkan pasien manual yang belum mengambil tiket di kiosk. Verifikasi NIK/No. Kartu dan terbitkan tiket langsung.',
      ],
      [
        'Selesai Layani',
        'Menyelesaikan tiket admisi',
        'Setelah data admisi dan klaim BPJS terverifikasi, klik "Selesai Layani". Pasien langsung otomatis masuk ke daftar tunggu poli dokter tujuan (dr. Machmujur / dr. Diana / Bidan).',
      ],
      [
        'Lewati (Skip) & Panggil Lewati',
        'Mengelola pasien yang terlambat hadir',
        'Pasien yang tidak hadir dipindahkan ke antrean lewati. Jika pasien kemudian tiba, petugas dapat langsung memanggil kembali nomor tersebut tanpa memotong antrean lain.',
      ],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // SECTION 4: SOP DOKTER POLIKLINIK & PENERBITAN E-RESEP
  const yDokterSection = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('4. SOP PELAYANAN DOKTER POLIKLINIK & PENERBITAN E-RESEP', 14, yDokterSection);

  autoTable(doc, {
    startY: yDokterSection + 4,
    head: [['Ruang & Dokter DPJP', 'Alur Pemeriksaan Medis, Diagnosa ICD-10 & Terusan Farmasi']],
    body: [
      [
        'Ruang 1: Poli Umum\n(dr. Machmujur)\nPenanggung Jawab Medis',
        '1. Login akun dokter: Masuk via akun dr_machmujur (PIN: dokter123).\n2. Memeriksa antrean poli: Pasien yang diselesaikan oleh Loket Admisi langsung muncul di daftar tunggu Ruang 1.\n3. Tekan "Panggil ke Ruang Periksa": Suara memanggil pasien untuk masuk ke ruang konsultasi.\n4. Anamnesis & Pemeriksaan: Periksa tanda vital, fisik, input diagnosa ICD-10 pada rekam medis elektronik faskes.\n5. Terbitkan e-Resep ke Farmasi: Masukkan instruksi dosis obat, klik "Kirim Resep ke Farmasi & Selesaikan Pasien".',
      ],
      [
        'Ruang 2: Poli Umum, Gigi & Lansia\n(dr. Diana)\nDokter Pelayanan & Prolanis',
        '1. Login akun dokter: Masuk via akun dr_diana (PIN: dokter123).\n2. Melayani Poli Umum 2, Poli Gigi & Mulut, serta Poli Lansia/Prolanis secara terpadu.\n3. Penanganan komprehensif lansia prolanis: Cek gula darah puasa, tensi rutin, dan konsultasi gaya hidup sehat.\n4. Konfirmasi resume medis terintegrasi bridging BPJS SatuSehat dan penerbitan resep obat kronis.',
      ],
      [
        'Ruang 3: Poli KIA & KB\n(Bidan Pelayanan)',
        '1. Login akun Bidan: Masuk via akun bidan1 (PIN: bidan123).\n2. Melayani pemeriksaan antenatal care (ANC), imunisasi bayi/balita, suntik KB, pil KB, dan edukasi gizi ibu menyusui.\n3. Catat buku KIA elektronik faskes dan koordinasikan rujukan medis berisiko tinggi kepada dr. Machmujur.',
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // SECTION 5: SOP FARMASI (WANDI) & LAYAR DISPLAY TV
  const yFarmasiSection = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('5. SOP DEPO FARMASI (OBAT) & LAYAR DISPLAY TV RUANG TUNGGU', 14, yFarmasiSection);

  autoTable(doc, {
    startY: yFarmasiSection + 4,
    head: [['Unit Pelayanan', 'Petugas', 'Standar Prosedur Pengoperasian']],
    body: [
      [
        'Depo Farmasi & Obat',
        'Wandi\n(Petugas Farmasi)',
        '1. Login akun wandi (PIN: farmasi123).\n2. Terima e-Resep masuk dari dokter Ruang 1 & 2 secara realtime.\n3. Racik obat, siapkan etiket aturan pakai (3x1, 2x1 dsb).\n4. Tekan "Panggil Pasien Farmasi": Speaker memanggil nomor tiket F-xxx ke Depo Farmasi.\n5. Berikan edukasi konsumsi obat kepada pasien dan klik "Selesai Penyerahan Obat".',
      ],
      [
        'Display TV Ruang Tunggu',
        'Layar Multimedia\n(Audio & Video)',
        '1. Nyalakan TV monitor ruang tunggu, buka menu "Layar TV" pada peramban.\n2. Tekan tombol "Layar Penuh (Fullscreen)" atau shortcut tombol keyboard F.\n3. Sistem otomatis menampilkan nomor antrean besar, loket aktif, dan memutar suara bel lonceng.\n4. Menayangkan slideshow foto resmi faskes & pengumuman running text jadwal dokter.',
      ],
    ],
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(2, 3);

  // =========================================================================
  // HALAMAN 3: BRIDGING BPJS TEKNIS, 5 TITIK GOOGLE MAPS & PENGESAHAN RESMI
  // =========================================================================
  doc.addPage();
  addPageHeader('BAGIAN 3: BRIDGING BPJS, PETA LOKASI & PENGESAHAN');

  // SECTION 6: BRIDGING BPJS KESEHATAN TEKNIS & KREDENSIAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('6. SPESIFIKASI TEKNIS BRIDGING BPJS KESEHATAN (ANTREAN RS V2 & PCARE)', 14, 25);

  autoTable(doc, {
    startY: 28,
    head: [['Komponen API', 'Nilai / Parameter Faskes', 'Keterangan & Prosedur Validasi']],
    body: [
      ['Nama Faskes & KD', 'TPMD DR MACHMUJUR · KD Faskes: 019U901', 'Terdaftar resmi pada BPJS Kesehatan KC Sidoarjo'],
      ['Jenis Bridging & Status CID', 'Pcare (Eclaim) · Status: Tester (Pengembangan sendiri)', 'Bridging FKTP Primer (Eclaim & Antrean Terpadu)'],
      ['Kredensial ConsID & Keys', 'ConsumerID: 11495 · SecretKey: 4xHABA0A84', 'User Key: 4a1a84234ffc19f0c77750cebfa2444e'],
      ['Akun PCare Dev (Auth)', 'User: 0195U091-dev · Pass: Dev1234# · App: 095', 'Email: praktekdokter91@gmail.com (Header X-Authorization Basic Base64)'],
      ['Metode Autentikasi', 'HMAC-SHA256 Base64 Signature & Basic Auth', 'Header: X-Cons-ID, X-Timestamp, X-Signature, user_key, X-Authorization'],
      ['Poli Default Bridging', '001 - Poli Umum (dr. Machmujur)', 'Standar dasar pendaftaran antrean faskes tingkat pertama'],
      ['Poli Sekunder BPJS', '002 (Gigi), 003 (KIA/Bidan), 004 (Lansia)', 'Tersedia pemetaan poliklinik sub-spesialis FKTP lengkap'],
      ['Prosedur Darurat Offline', 'Local Offline Buffer Storage', 'Jika koneksi internet drop, antrean tetap tercatat lokal dan disinkronkan otomatis saat online kembali.'],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.9,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // SECTION 7: 5 TITIK RESMI GOOGLE MAPS KLINIK SOMBAN MEDIKA
  const yMapsSection = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('7. TAUTAN 5 TITIK LOKASI RESMI GOOGLE MAPS KLINIK SOMBAN MEDIKA', 14, yMapsSection);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Seluruh foto fasilitas klinik pada mode TV dan modal peta terverifikasi dengan tautan Google Maps berikut:',
    14,
    yMapsSection + 5
  );

  autoTable(doc, {
    startY: yMapsSection + 7,
    head: [['No', 'Fasilitas / Bagian Klinik', 'Deskripsi Lokasi & Akses', 'Tautan Resmi Google Maps']],
    body: [
      [
        '1',
        'Gedung & Plang Faskes Resmi',
        'Tampak depan klinik, plang faskes resmi, dan akses jalan Kebonsari Candi',
        'https://maps.app.goo.gl/NX7nyKLxtx7rGx6j7',
      ],
      [
        '2',
        'Area Depan & Parkir Pasien',
        'Halaman parkir tertata rapi bagi kendaraan roda 2 dan roda 4 pasien rawat jalan',
        'https://maps.app.goo.gl/uHrybrxspgEcp1y18',
      ],
      [
        '3',
        'Pintu Pelayanan & Admisi',
        'Pintu masuk utama ber-AC, meja pendaftaran Loket Admisi & Kiosk Mandiri',
        'https://maps.app.goo.gl/QXjJ8D3GxnB8ZAnPA',
      ],
      [
        '4',
        'Ruang Pemeriksaan Poli Medis',
        'Ruang praktik Poli Umum (dr. Machmujur & dr. Diana), KIA (Bidan), & tindakan',
        'https://maps.app.goo.gl/N4vAU5jERNLj48G68',
      ],
      [
        '5',
        'Lingkungan Kebonsari Candi',
        'Kampung Bebek Kebonsari RT.05 RW.03, Kec. Candi, Kabupaten Sidoarjo',
        'https://maps.app.goo.gl/uAmruwLvrU1tkzTR6',
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // SECTION 8: PROSEDUR DATABASE, BACKUP & PEMULIHAN
  const yDbSection = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('8. PROSEDUR PEMELIHARAAN SISTEM, DATABASE SQL & BACKUP RUTIN', 14, yDbSection);

  // Box Informasi Database
  doc.setFillColor(...lightBg);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yDbSection + 3, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    '• Backup Harian: Administrator SIM-RS (Dedy) melakukan unduh salinan database JSON & SQL setiap selesai shift sore (pk. 21.00 WIB).',
    18,
    yDbSection + 8
  );
  doc.text(
    '• Reset Antrean Harian: Sistem secara otomatis mereset nomor urut antrean harian menjadi nomor 001 pada pergantian hari (pk. 00:00:01 WIB).',
    18,
    yDbSection + 13
  );
  doc.text(
    '• Audit Trail: Setiap panggilan loket, resep obat, dan log bridging tercatat permanen dengan timestamp akurat untuk audit BPJS Kesehatan.',
    18,
    yDbSection + 18
  );

  // SECTION 9: LEMBAR PENGESAHAN DOKUMEN RESMI
  const yTtd = yDbSection + 30;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, yTtd, 196, yTtd);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dokumen Standar Operasional Prosedur (SOP) ini disahkan secara resmi untuk diberlakukan pada faskes:', 14, yTtd + 5);
  doc.text(`Ditetapkan di Sidoarjo, ${data.tanggalCetak}`, 135, yTtd + 5);

  // TTD 1: Penanggung Jawab Medis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('dr. Machmujur', 14, yTtd + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Dokter Penanggung Jawab Medis Faskes', 14, yTtd + 24);
  doc.text('SIP: 503/446/SIP.D/438.5.2/2024', 14, yTtd + 28);

  // TTD 2: Dokter Pelayanan & Prolanis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('dr. Diana', 78, yTtd + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Dokter Pelayanan Medis & Prolanis', 78, yTtd + 24);
  doc.text('SIP: 503/447/SIP.D/438.5.2/2024', 78, yTtd + 28);

  // TTD 3: Administrator SIM-RS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dedy', 145, yTtd + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Administrator SIM-RS & Sistem Antrean', 145, yTtd + 24);
  doc.text('NIP: 19880512 201503 1 002', 145, yTtd + 28);

  addFooter(3, 3);

  return doc;
}

export function downloadPanduanPengoperasianPDF(filename = 'Buku_SOP_Panduan_Klinik_Somban_Medika.pdf') {
  const doc = generatePanduanPengoperasianPDF();
  doc.save(filename);
}
