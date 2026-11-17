import { jsPDF } from 'jspdf';

export interface OperatingManualOptions {
  namaFaskes?: string;
  kdFaskes?: string;
  environment?: 'tester' | 'production';
}

interface ManualSection {
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: Array<{ label: string; text: string }>;
  callout?: { title: string; text: string; tone?: 'emerald' | 'amber' };
}

export function buildOperatingManualPdfDoc(options?: OperatingManualOptions): jsPDF {
  const namaFaskes = (options?.namaFaskes || 'KLINIK SOMBAN MEDIKA').trim();
  const kdFaskes = (options?.kdFaskes || '019U901').trim();
  const envLabel = options?.environment === 'production' ? 'Production (Live)' : 'Development / Tester';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const topStartY = 24;
  const bottomLimitY = pageHeight - 20;

  let y = topStartY;

  const drawPageChrome = (isCover: boolean) => {
    if (!isCover) {
      // Subtle top running header
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 0, pageWidth, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text(`PANDUAN PENGOPERASIAN SISTEM — ${namaFaskes}`, marginX, 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Kode Faskes: ${kdFaskes}`, pageWidth - marginX, 9, { align: 'right' });
    }
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimitY) {
      doc.addPage();
      drawPageChrome(false);
      y = topStartY;
    }
  };

  // --- COVER / HEADER BANNER (Page 1) ---
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.rect(0, 0, pageWidth, 58, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500 accent bar
  doc.rect(0, 58, pageWidth, 2.2, 'F');

  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('BUKU PANDUAN PENGOPERASIAN RESMI (SOP APLIKASI)', marginX, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Sistem Antrean Online & Bridging BPJS FKTP', marginX, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(236, 253, 245);
  doc.text('Integrasi Mobile JKN (7 Task ID), PCare Pelayanan & Rujukan, TV Display, Laporan & Auto-Upload', marginX, 36);

  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(`Faskes: ${namaFaskes}   |   Kode Faskes: ${kdFaskes}   |   Mode Konfigurasi: ${envLabel}`, marginX, 48);

  y = 70;

  // Quick Info Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, y, contentWidth, 26, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Ringkasan Modul & Hak Akses Pengguna', marginX + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const overviewLines = doc.splitTextToSize(
    'Aplikasi ini mencakup 6 modul utama: (1) Kios Mandiri Pasien, (2) Loket Antrean & Panggilan Suara, (3) PCare BPJS (Pelayanan, Pendaftaran, Rujukan & Riwayat), (4) Laporan Bulanan/Tahunan, (5) TV Display Ruang Tunggu, dan (6) Pengaturan Bridging BPJS + RME & Keamanan untuk Administrator.',
    contentWidth - 8
  );
  doc.text(overviewLines, marginX + 4, y + 12.5);
  y += 34;

  const sections: ManualSection[] = [
    {
      title: '1. Login Petugas, Keamanan Akun & Akses Kios',
      subtitle: 'Langkah awal masuk ke sistem bagi petugas maupun mode anjungan pasien',
      bullets: [
        {
          label: 'Login Petugas Faskes',
          text: 'Buka aplikasi, masukkan Username dan Password pada layar login awal, lalu tekan tombol Masuk. Sistem mengenali hak akses peran secara otomatis (Admin, Admin Bridging, Admin RME, Dokter, Petugas Loket, Pendaftaran, Farmasi).',
        },
        {
          label: 'Wajib Ganti Password Awal',
          text: 'Jika akun baru menggunakan kata sandi bawaan (000000), sistem otomatis memunculkan formulir Ubah Kata Sandi sebelum dasbor utama dibuka. Gunakan minimal 6 karakter kombinasi yang aman.',
        },
        {
          label: 'Mode Kios Pasien (Tanpa Login)',
          text: 'Pada layar login awal tersedia tombol Akses Kios Pasien Mandiri bagi perangkat tablet/anjungan di ruang tunggu agar pasien dapat mengambil antrean tanpa mengakses data petugas.',
        },
        {
          label: 'Ganti Password & Keluar',
          text: 'Klik nama/menu akun di pojok kanan atas bilah navigasi untuk mengganti kata sandi atau keluar (Logout) saat pergantian shift.',
        },
      ],
    },
    {
      title: '2. Pengoperasian Kios Mandiri Pasien',
      subtitle: 'Menu: Kios Mandiri — Pendaftaran anjungan ruang tunggu',
      bullets: [
        {
          label: 'Pasien BPJS Baru/Lama',
          text: 'Pilih tombol "Pasien BPJS", ketik 16 digit NIK atau 13 digit No. Kartu BPJS (bisa menggunakan keypad sentuh di layar), tekan Verifikasi Peserta, pilih Poliklinik tujuan, lalu ambil tiket cetak termal.',
        },
        {
          label: 'Check-In Mobile JKN',
          text: 'Pilih menu "Check-In Mobile JKN", masukkan Kode Booking dari aplikasi Mobile JKN atau NIK/No. Kartu BPJS, lalu sistem menerbitkan nomor antrean dan mencatat Task 1 secara otomatis.',
        },
        {
          label: 'Pasien Umum (Non-BPJS)',
          text: 'Pilih tombol "Pasien Umum", isi Nama Lengkap, NIK/No. HP, dan keluhan singkat, pilih Poliklinik yang dituju, lalu cetak tiket antrean.',
        },
      ],
    },
    {
      title: '3. Pengoperasian Loket Antrean (Petugas Pendaftaran & Poli)',
      subtitle: 'Menu: Loket Antrean — Konsol panggilan pasien dan sinkronisasi Task ID BPJS',
      bullets: [
        {
          label: 'Filter Poliklinik & Pencarian',
          text: 'Pilih tab "Semua Poli" atau pilih poli spesifik di bagian atas. Gunakan kolom pencarian serta filter Status, Bulan, dan Tahun untuk menemukan riwayat antrean pasien.',
        },
        {
          label: 'Pendaftaran Langsung dari Loket',
          text: 'Tekan tombol "Pendaftaran Loket" di kanan atas konsol untuk mendaftarkan pasien secara manual tanpa harus melalui Kios Mandiri.',
        },
        {
          label: 'Alur Panggilan & Task ID BPJS',
          text: 'Gunakan tombol "Panggil Berikutnya" atau "Panggil Ulang" untuk memanggil pasien dengan suara bel dan TTS Bahasa Indonesia (mengirim Task 4), tekan "Mulai Layanan" saat pemeriksaan berlangsung (Task 5), dan "Selesai Layanan" atau "Kirim ke Farmasi" setelah selesai (Task 6/7).',
        },
        {
          label: 'Privasi Data & Unggah Tertunda',
          text: 'Gunakan ikon mata untuk membuka atau menyamarkan digit NIK dan No. Kartu BPJS di layar publik. Jika muncul tombol "Upload BPJS (N)", klik untuk mengirim antrean yang belum terkirim ke server BPJS.',
        },
      ],
    },
    {
      title: '4. Modul PCare BPJS (Pemeriksaan Dokter & Rujukan RS)',
      subtitle: 'Menu: PCare BPJS — Pencatatan medis FKTP dan surat rujukan peserta',
      bullets: [
        {
          label: 'Tab 1 — Pelayanan & Diagnosa',
          text: 'Pilih antrean pasien aktif, lengkapi Tanda Vital (TD Sistole/Diastole, Nadi, Napas, Suhu, BB, TB, Kesadaran), ketik anamnesa, pilih Diagnosa ICD-10, terapi obat, dan Status Pulang (Berobat Jalan / Rujuk Vertikal / Rujuk Horizontal), lalu klik Simpan & Kirim PCare.',
        },
        {
          label: 'Tab 2 — Pendaftaran PCare',
          text: 'Cari data peserta BPJS melalui NIK atau No. Kartu, pastikan status kepesertaan aktif, lalu daftarkan kunjungan ke poliklinik faskes.',
        },
        {
          label: 'Tab 3 — Rujukan ke Rumah Sakit',
          text: 'Pilih pasien dan cari Rumah Sakit Rujukan tujuan berdasarkan nama RS, kota/kabupaten (termasuk wilayah Sidoarjo dan seluruh Indonesia). Jika RS belum ada di daftar, gunakan opsi tambah RS rujukan pada kolom pencarian RS. Lengkapi Poli Spesialis, tanggal rencana berkunjung, diagnosa ICD-10, lalu klik Simpan & Terbitkan Rujukan BPJS atau Cetak Rujukan.',
        },
        {
          label: 'Tab 4 — Riwayat Kunjungan',
          text: 'Menampilkan daftar kunjungan dan status pengiriman BPJS. Gunakan filter Bulan, Tahun, dan kolom teks pencarian. Bila ada kunjungan berstatus tertunda, tekan tombol "Upload Tertunda ke BPJS".',
        },
      ],
    },
    {
      title: '5. TV Display Ruang Tunggu & Pengaturan Audio',
      subtitle: 'Menu: TV Display & Ikon Audio di bilah atas',
      bullets: [
        {
          label: 'Layar Monitor Ruang Tunggu',
          text: 'Buka tab "TV Display" untuk menampilkan nomor antrean aktif yang sedang dipanggil, ruang poli tujuan, antrean berikutnya per poli, serta jam & tanggal berjalan. Gunakan tombol Fullscreen agar tampil penuh di televisi ruang tunggu.',
        },
        {
          label: 'Kontrol Suara & Test Bel',
          text: 'Aktifkan atau bisukan suara panggilan TTS melalui ikon speaker di pojok kanan atas. Petugas dapat menguji bunyi bel melalui Menu -> Test Bel Antrean.',
        },
      ],
    },
    {
      title: '6. Laporan Kunjungan & Antrean',
      subtitle: 'Menu: Laporan — Rekapitulasi dan ekspor berkas',
      bullets: [
        {
          label: 'Jenis Laporan & Filter Waktu',
          text: 'Pilih tab "Laporan Kunjungan PCare" atau "Laporan Antrean". Saring data secara cepat menggunakan dropdown Bulan, dropdown Tahun, serta input teks pencarian (nama pasien, No. BPJS, NIK, diagnosa, atau nama RS rujukan).',
        },
        {
          label: 'Ekspor Laporan',
          text: 'Tekan tombol Ekspor / Unduh untuk mengunduh data hasil filter menjadi berkas spreadsheet yang siap dicetak atau dilaporkan ke manajemen klinik.',
        },
      ],
    },
    {
      title: '7. Bridging API BPJS, Mode DEV/PROD & Auto-Upload Data Tertunda',
      subtitle: 'Menu: Switch DEV/PROD & Menu -> Pengaturan Bridging BPJS (Khusus Admin)',
      bullets: [
        {
          label: 'Pengisian Kredensial & Base URL',
          text: 'Masukkan Kode Faskes, Nama Faskes, Consumer ID, Secret Key, User Key, serta User/Password PCare. Pilih Base URL sesuai modul (Antrean FKTP / PCare / VClaim / Aplicare) dan mode server (DEV/Tester atau Production).',
        },
        {
          label: 'Uji Koneksi (Test Ping Bridging)',
          text: 'Tekan tombol "Test Ping Bridging" atau ubah switch DEV / PROD di bilah navigasi. Pastikan server faskes memiliki IP yang sudah di-whitelist BPJS dan jam server tersinkronisasi NTP.',
        },
        {
          label: 'Fitur Auto-Upload Data Tertunda',
          text: 'Setiap antrean pasien maupun kunjungan/rujukan PCare yang disimpan saat Bridging API BPJS terputus akan ditandai sebagai Data Tertunda. Begitu API BPJS kembali terhubung (saat aplikasi dibuka, setelah Test Ping sukses, atau saat beralih mode DEV/PROD), sistem otomatis mengunggah seluruh data tertunda apabila toggle "Auto-Upload Saat Terkoneksi" aktif.',
        },
        {
          label: 'Unggah Manual & Unduh 9 WS FKTP (.xlsx)',
          text: 'Administrator dapat memantau jumlah data tertunda dan menekan tombol "Upload Data Tertunda Sekarang" kapan saja. Tersedia pula tab "9 WS FKTP Excel (.xlsx)" untuk mengunduh format resmi pengajuan endpoint ke BPJS Kesehatan.',
        },
      ],
      callout: {
        title: 'Catatan Penting Sinkronisasi Data Tertunda',
        text: 'Pastikan data yang tersimpan saat koneksi terputus tidak diinput ulang dua kali. Pantau status "TERKIRIM" atau nomor kunjungan/rujukan setelah proses auto-upload maupun unggah manual selesai dijalankan.',
        tone: 'emerald',
      },
    },
    {
      title: '8. RME & Keamanan (Khusus Administrator RME)',
      subtitle: 'Menu: RME & Keamanan — Manajemen pengguna, poli & audit privasi',
      bullets: [
        {
          label: 'Kelola Pengguna & Poliklinik',
          text: 'Administrator RME dapat memperbarui nama petugas, peran akses, mereset kata sandi ke default (000000), serta menyunting data dokter penanggung jawab, SIP, dan ruangan poliklinik.',
        },
        {
          label: 'Rekam Medis Terenkripsi & Audit Log',
          text: 'Data sensitif pasien dilindungi enkripsi AES-256-GCM dan setiap aktivitas login, dekripsi, perubahan konfigurasi, maupun ekspor tercatat di log audit keamanan.',
        },
      ],
    },
  ];

  for (const sec of sections) {
    ensureSpace(26);

    // Section heading bar
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(marginX, y, contentWidth, sec.subtitle ? 13.5 : 9.5, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 78, 59);
    doc.text(sec.title, marginX + 3.5, y + 6);

    if (sec.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text(sec.subtitle, marginX + 3.5, y + 10.8);
      y += 16.5;
    } else {
      y += 12.5;
    }

    if (sec.paragraphs) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const p of sec.paragraphs) {
        const lines = doc.splitTextToSize(p, contentWidth - 2);
        ensureSpace(lines.length * 4.5 + 3);
        doc.text(lines, marginX + 1, y);
        y += lines.length * 4.5 + 2.5;
      }
    }

    if (sec.bullets) {
      for (const b of sec.bullets) {
        const bulletText = `${b.label}: ${b.text}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 9);
        const blockH = lines.length * 4.4 + 2.5;
        ensureSpace(blockH);

        // Bullet dot
        doc.setFillColor(16, 185, 129);
        doc.circle(marginX + 3, y - 1.2, 1, 'F');

        // Render label bold on first line portion cleanly by writing plain wrapped lines with bold lead-in
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        const labelPrefix = `${b.label}: `;
        const firstLineLabelWidth = doc.getTextWidth(labelPrefix);

        if (firstLineLabelWidth < contentWidth - 24) {
          doc.text(labelPrefix, marginX + 6.5, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const remainingFirstWidth = contentWidth - 9 - firstLineLabelWidth;
          const words = b.text.split(' ');
          let firstLineRest = '';
          let idx = 0;
          while (idx < words.length) {
            const candidate = firstLineRest ? `${firstLineRest} ${words[idx]}` : words[idx];
            if (doc.getTextWidth(candidate) <= remainingFirstWidth) {
              firstLineRest = candidate;
              idx += 1;
            } else {
              break;
            }
          }
          if (firstLineRest) {
            doc.text(firstLineRest, marginX + 6.5 + firstLineLabelWidth, y);
          }
          const restText = words.slice(idx).join(' ');
          if (restText) {
            const restLines = doc.splitTextToSize(restText, contentWidth - 9);
            const totalRestH = (restLines.length + 1) * 4.4 + 2.5;
            if (y + totalRestH > bottomLimitY) {
              // Move remaining lines cleanly if near bottom
              y += 4.4;
              for (const rl of restLines) {
                ensureSpace(5.5);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.8);
                doc.setTextColor(51, 65, 85);
                doc.text(rl, marginX + 6.5, y);
                y += 4.4;
              }
              y += 2;
            } else {
              y += 4.4;
              doc.text(restLines, marginX + 6.5, y);
              y += restLines.length * 4.4 + 2;
            }
          } else {
            y += 6.2;
          }
        } else {
          doc.text(lines, marginX + 6.5, y);
          y += blockH;
        }
      }
    }

    if (sec.callout) {
      const callLines = doc.splitTextToSize(sec.callout.text, contentWidth - 10);
      const boxH = 10 + callLines.length * 4.3;
      ensureSpace(boxH + 4);
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(52, 211, 153);
      doc.roundedRect(marginX, y, contentWidth, boxH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text(sec.callout.title, marginX + 4, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(30, 41, 59);
      doc.text(callLines, marginX + 4, y + 10);
      y += boxH + 4;
    }

    y += 3;
  }

  // Add page numbers & footer across all pages
  const totalPages = doc.getNumberOfPages();
  const datePrinted = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Panduan Pengoperasian Sistem Antrean & Bridging BPJS — ${namaFaskes} (${datePrinted})`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  return doc;
}

export function exportOperatingManualPdf(options?: OperatingManualOptions): boolean {
  try {
    const doc = buildOperatingManualPdfDoc(options);
    const cleanName = (options?.namaFaskes || 'Klinik_Somban_Medika')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    doc.save(`Panduan_Pengoperasian_${cleanName}.pdf`);
    return true;
  } catch (err) {
    console.error('Gagal membuat PDF panduan pengoperasian:', err);
    return false;
  }
}
