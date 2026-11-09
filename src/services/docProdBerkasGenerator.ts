/**
 * Layanan Pembuatan & Unduh Berkas Pengajuan Bridging Production (PROD) BPJS Kesehatan
 * Format File: Microsoft Word (.doc)
 * 
 * Dokumen yang digenerate:
 * 1. Surat Permohonan Akses & Bridging Production Antrean Online (Antrol)
 * 2. Berita Acara User Acceptance Testing (BA UAT) Integrasi Antrol
 * 3. Pakta Integritas 2 Dokumen (Faskes & Vendor Pengembang)
 * 4. Dokumen Teknis Pemetaan WS URL (Khusus Antrol)
 * 5. Paket Lengkap Berkas PROD (Semua dalam 1 file .doc rapi)
 */

export interface BerkasProdMetadata {
  nomorSurat: string;
  nomorBaUat: string;
  tanggalSurat: string;
  namaFaskes: string;
  kodePPK: string;
  alamatFaskes: string;
  kotaFaskes: string;
  teleponFaskes: string;
  emailFaskes: string;
  kantorCabangBPJS: string;
  namaPimpinan: string;
  jabatanPimpinan: string;
  nikPimpinan: string;
  namaVendor: string;
  namaPicVendor: string;
  jabatanPicVendor: string;
  teleponVendor: string;
  emailVendor: string;
  urlBaseDev: string;
  urlBaseProd: string;
  urlServerFaskes: string;
  ipPublicServer: string;
  consId: string;
  userKey: string;
}

export const DEFAULT_BERKAS_PROD_METADATA: BerkasProdMetadata = {
  nomorSurat: '084/TPMD-EXT/X/2026',
  nomorBaUat: 'BA-UAT/019U901/ANTROL/2026',
  tanggalSurat: '16 Oktober 2026',
  namaFaskes: 'TPMD DR. MACHMUJUR',
  kodePPK: '019U901',
  alamatFaskes: 'Jl. Raya Somban No. 45, Kecamatan Candi',
  kotaFaskes: 'Kabupaten Sidoarjo',
  teleponFaskes: '(031) 895-1234 / 0812-3456-7890',
  emailFaskes: 'praktekdokter91@gmail.com',
  kantorCabangBPJS: 'BPJS Kesehatan Kantor Cabang Sidoarjo',
  namaPimpinan: 'dr. Machmujur',
  jabatanPimpinan: 'Pimpinan & Penanggung Jawab Faskes',
  nikPimpinan: '3515081205780002',
  namaVendor: 'Pengembang Sistem SIM & Bridging Antrean',
  namaPicVendor: 'Dedy Angga Kurniawan, S.Kom',
  jabatanPicVendor: 'Lead Developer & Verifikator Teknis Sistem IT',
  teleponVendor: '0813-9876-5432',
  emailVendor: 'dedyfabregas@gmail.com',
  urlBaseDev: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev',
  urlBaseProd: 'https://apijkn.bpjs-kesehatan.go.id/antreanrs',
  urlServerFaskes: 'https://api.sombanmedika.com/api/v2/bpjs/antrean',
  ipPublicServer: '103.147.154.88',
  consId: '11495',
  userKey: '4a1a84234ffc19f0c77750cebfa2444e',
};

/**
 * Bungkus konten HTML ke dalam dokumen Microsoft Word (.doc) lengkap dengan styling resmi Word
 */
function wrapWordDocument(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm; /* A4 */
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Calibri', 'Times New Roman', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 {
      font-family: 'Calibri', 'Arial', sans-serif;
      color: #047857;
      margin-top: 14pt;
      margin-bottom: 6pt;
      font-weight: bold;
    }
    h1 { font-size: 15pt; text-align: center; text-transform: uppercase; border-bottom: 2pt solid #047857; padding-bottom: 4pt; }
    h2 { font-size: 13pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt; color: #065f46; }
    h3 { font-size: 11.5pt; color: #1e293b; margin-top: 10pt; }
    p { margin-top: 0; margin-bottom: 7pt; text-align: justify; }
    .kop-surat {
      border-bottom: 3px double #0f172a;
      padding-bottom: 10pt;
      margin-bottom: 16pt;
      text-align: center;
    }
    .kop-nama {
      font-size: 16pt;
      font-weight: bold;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 2pt;
    }
    .kop-detail {
      font-size: 9.5pt;
      color: #475569;
      line-height: 1.25;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
      font-size: 10pt;
    }
    th {
      background-color: #065f46;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 6pt 8pt;
      border: 1pt solid #065f46;
    }
    td {
      padding: 5pt 8pt;
      border: 1pt solid #cbd5e1;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .table-clean, .table-clean td, .table-clean th {
      border: none;
      background: transparent;
      padding: 2pt 4pt;
    }
    .badge-pass {
      display: inline-block;
      background-color: #d1fae5;
      color: #065f46;
      font-weight: bold;
      font-size: 9pt;
      padding: 2pt 6pt;
      border-radius: 3pt;
      border: 1pt solid #34d399;
    }
    .badge-prod {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      font-weight: bold;
      font-size: 9pt;
      padding: 2pt 6pt;
      border-radius: 3pt;
      border: 1pt solid #38bdf8;
    }
    .materai-box {
      border: 1pt dashed #94a3b8;
      width: 90pt;
      height: 48pt;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 8pt;
      color: #64748b;
      margin: 8pt auto;
      background-color: #f8fafc;
    }
    .ttd-box {
      width: 48%;
      text-align: center;
      vertical-align: top;
      font-size: 10.5pt;
    }
    .page-break {
      page-break-before: always;
      mso-special-character: line-break;
    }
    .code-block {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      padding: 6pt;
      border-left: 3pt solid #065f46;
      margin: 6pt 0;
      color: #0f172a;
    }
  </style>
</head>
<body>
<div class='Section1'>
  ${bodyContent}
</div>
</body>
</html>`;
}

/**
 * 1. SURAT PERMOHONAN BRIDGING PRODUCTION (PROD)
 */
export function generateSuratPermohonanHtml(meta: BerkasProdMetadata): string {
  return `
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-nama">${meta.namaFaskes}</div>
      <div class="kop-detail">
        Surat Izin Operasional Fasilitas Pelayanan Kesehatan | Kode PPK BPJS: <strong>${meta.kodePPK}</strong><br>
        Alamat: ${meta.alamatFaskes}, ${meta.kotaFaskes} | Telp: ${meta.teleponFaskes}<br>
        Email Resmi: ${meta.emailFaskes} | Website: https://sombanmedika.com
      </div>
    </div>

    <!-- METADATA SURAT -->
    <table class="table-clean" style="margin-bottom: 14pt;">
      <tr>
        <td style="width: 80pt;">Nomor</td>
        <td style="width: 10pt;">:</td>
        <td><strong>${meta.nomorSurat}</strong></td>
        <td style="text-align: right;">${meta.kotaFaskes.replace('Kabupaten ', '').replace('Kota ', '')}, ${meta.tanggalSurat}</td>
      </tr>
      <tr>
        <td>Lampiran</td>
        <td>:</td>
        <td>1 (satu) Berkas Lengkap Dokumen Bridging</td>
        <td></td>
      </tr>
      <tr>
        <td>Perihal</td>
        <td>:</td>
        <td><strong>Permohonan Penerbitan Kredensial &amp; Akses Bridging Production (PROD) Sistem Antrean Online (Antrol RS v2 / FKTP)</strong></td>
        <td></td>
      </tr>
    </table>

    <p>
      Kepada Yth.<br>
      <strong>Kepala ${meta.kantorCabangBPJS}</strong><br>
      Di Tempat
    </p>

    <p style="margin-top: 12pt;">Dengan hormat,</p>

    <p>
      Sehubungan dengan telah dilaksanakannya tahapan integrasi dan pengujian sistem bridging Antrean Online (Antrol) pada lingkungan pengujian (Sandbox / Development Environment) BPJS Kesehatan dengan hasil <strong>100% Lulus Uji Coba (PASS)</strong>, bersama ini kami mengajukan permohonan resmi kepada BPJS Kesehatan untuk membuka akses dan menerbitkan kredensial <strong>Production (PROD)</strong> bagi fasilitas kesehatan kami:
    </p>

    <table style="margin: 10pt 0;">
      <tr>
        <th colspan="2">PROFIL FASILITAS KESEHATAN PEMOHON</th>
      </tr>
      <tr>
        <td style="width: 180pt;"><strong>Nama Fasilitas Kesehatan</strong></td>
        <td>${meta.namaFaskes}</td>
      </tr>
      <tr>
        <td><strong>Kode PPK BPJS Kesehatan</strong></td>
        <td><strong style="color: #065f46; font-size: 11pt;">${meta.kodePPK}</strong></td>
      </tr>
      <tr>
        <td><strong>Alamat Lengkap Faskes</strong></td>
        <td>${meta.alamatFaskes}, ${meta.kotaFaskes}</td>
      </tr>
      <tr>
        <td><strong>Penanggung Jawab / Pimpinan</strong></td>
        <td>${meta.namaPimpinan} (${meta.jabatanPimpinan})</td>
      </tr>
      <tr>
        <td><strong>Nomor Kontak / WhatsApp</strong></td>
        <td>${meta.teleponFaskes}</td>
      </tr>
      <tr>
        <td><strong>Email Resmi Faskes</strong></td>
        <td>${meta.emailFaskes}</td>
      </tr>
      <tr>
        <td><strong>Nama Aplikasi SIM / Antrean</strong></td>
        <td>Sistem Informasi &amp; Antrean Online ${meta.namaFaskes} (Terintegrasi Antrean RS v2 / FKTP &amp; PCare)</td>
      </tr>
      <tr>
        <td><strong>Penyedia / Vendor Sistem</strong></td>
        <td>${meta.namaVendor}</td>
      </tr>
    </table>

    <p>
      Sebagai pemenuhan persyaratan kelayakan rilis ke lingkungan Production, bersama surat ini kami lampirkan dokumen pendukung sebagai berikut:
    </p>

    <ol style="margin-top: 4pt; margin-bottom: 12pt; padding-left: 18pt;">
      <li style="margin-bottom: 3pt;"><strong>Berita Acara User Acceptance Testing (BA UAT)</strong> Integrasi Antrean Online dengan hasil 100% Lulus (Pass).</li>
      <li style="margin-bottom: 3pt;"><strong>Pakta Integritas Pimpinan Fasilitas Kesehatan</strong> terkait komitmen kerahasiaan data medis dan keamanan kredensial.</li>
      <li style="margin-bottom: 3pt;"><strong>Pakta Integritas Vendor / Pengembang Sistem IT</strong> terkait kepatuhan standar keamanan data (UU PDP No. 27/2022).</li>
      <li style="margin-bottom: 3pt;"><strong>Dokumen Spesifikasi Teknis &amp; Pemetaan WS URL</strong> (khusus antrean online, Task ID 1-7, kuota dokter, dan status antrean).</li>
    </ol>

    <p>
      Besar harapan kami agar permohonan aktivasi akses Production ini dapat disetujui, sehingga pasien peserta Program JKN-KIS dapat segera menikmati kemudahan antrean online secara real-time, transparan, dan memangkas waktu tunggu layanan di fasilitas kesehatan kami.
    </p>

    <p>Demikian surat permohonan ini kami sampaikan. Atas perhatian, arahan, dan kerja sama yang baik dari BPJS Kesehatan, kami ucapkan terima kasih.</p>

    <!-- TANDA TANGAN -->
    <table class="table-clean" style="margin-top: 24pt;">
      <tr>
        <td style="width: 50%;"></td>
        <td class="ttd-box">
          Hormat kami,<br>
          <strong>${meta.namaFaskes}</strong><br>
          <div class="materai-box">MATERAI<br>Rp 10.000,-</div>
          <strong style="text-decoration: underline;">${meta.namaPimpinan}</strong><br>
          <span>${meta.jabatanPimpinan}</span><br>
          <span style="font-size: 9pt; color: #64748b;">NIK: ${meta.nikPimpinan}</span>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 2. BERITA ACARA USER ACCEPTANCE TESTING (BA UAT) INTEGRASI ANTROL
 */
export function generateBaUatHtml(meta: BerkasProdMetadata): string {
  return `
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-nama">${meta.namaFaskes}</div>
      <div class="kop-detail">
        TIM VERIFIKATOR INTEGRASI BRIDGING SISTEM ANTREAN ONLINE (ANTROL) BPJS KESEHATAN<br>
        Alamat: ${meta.alamatFaskes}, ${meta.kotaFaskes} | Kode PPK BPJS: <strong>${meta.kodePPK}</strong>
      </div>
    </div>

    <h1>BERITA ACARA USER ACCEPTANCE TESTING (BA UAT)<br>INTEGRASI SISTEM ANTREAN ONLINE (ANTROL) BPJS KESEHATAN</h1>
    <p style="text-align: center; font-size: 10.5pt; margin-top: -2pt; color: #334155;">
      Nomor Berita Acara: <strong>${meta.nomorBaUat}</strong>
    </p>

    <p style="margin-top: 14pt;">
      Pada hari ini, <strong>Jumat</strong>, tanggal <strong>${meta.tanggalSurat}</strong>, bertempat di ${meta.namaFaskes}, telah dilaksanakan serangkaian pengujian fungsional dan teknis integrasi <em>User Acceptance Testing (UAT)</em> Sistem Antrean Online Faskes dengan Web Service Antrean BPJS Kesehatan (Antrol RS v2 / FKTP).
    </p>

    <p>Pengujian dan verifikasi dilaksanakan secara mandiri dan tuntas oleh <strong>Tim Verifikator Resmi</strong> yang terdiri dari dua pihak sebagai berikut:</p>

    <table style="margin: 8pt 0;">
      <tr>
        <th style="width: 30pt; text-align: center;">No</th>
        <th>Nama Personel</th>
        <th>Jabatan / Instansi</th>
        <th>Kedudukan dalam Tim Verifikator UAT</th>
      </tr>
      <tr>
        <td style="text-align: center;">1</td>
        <td><strong>${meta.namaPimpinan}</strong></td>
        <td>Pimpinan &amp; Penanggung Jawab ${meta.namaFaskes}</td>
        <td><strong>Verifikator I</strong> (Penanggung Jawab Fasilitas Kesehatan / Pemohon Akses PROD)</td>
      </tr>
      <tr>
        <td style="text-align: center;">2</td>
        <td><strong>${meta.namaPicVendor}</strong></td>
        <td>${meta.jabatanPicVendor} (${meta.namaVendor})</td>
        <td><strong>Verifikator II</strong> (Pengembang Perangkat Lunak SIM &amp; Verifikator Teknis UAT)</td>
      </tr>
    </table>
    <p style="font-size: 9pt; color: #475569; font-style: italic; margin-top: -2pt;">
      * Catatan: Tim Verifikator pengujian ini murni dan terbatas hanya pada pihak fasilitas kesehatan (${meta.namaPimpinan}) dan pihak pengembang teknis SIM IT (${meta.namaPicVendor}).
    </p>

    <h2>I. RUANG LINGKUP &amp; HASIL PENGUJIAN FUNGSIONAL</h2>
    <p>Pengujian mencakup seluruh alur pelayanan antrean pasien dari pengambilan tiket hingga selesai layanan dan pengambilan obat di farmasi:</p>

    <table>
      <thead>
        <tr>
          <th style="width: 25pt; text-align: center;">No</th>
          <th style="width: 140pt;">Modul / Fitur Pengujian</th>
          <th>Skenario Pengujian</th>
          <th>Hasil yang Diharapkan</th>
          <th style="width: 60pt; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td><strong>Ambil Antrean Baru</strong><br><span style="font-size: 8pt; color: #475569;">POST /antrean/ambil</span></td>
          <td>Pasien mengambil nomor antrean (Kategori BPJS/Umum/Prioritas) via Kiosk atau Mobile JKN.</td>
          <td>Nomor antrean (A-001/P-001) tercetak, kode booking terbentuk, kuota terpotong secara real-time.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td><strong>Cek Sisa &amp; Status Antrean</strong><br><span style="font-size: 8pt; color: #475569;">GET /antrean/status</span></td>
          <td>Pengecekan nomor antrean saat ini, sisa antrean di depan pasien, dan estimasi waktu dilayani.</td>
          <td>Data sisa antrean dan nama dokter tampil akurat pada display TV dan mobile.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td><strong>Pembatalan Antrean</strong><br><span style="font-size: 8pt; color: #475569;">POST /antrean/batal</span></td>
          <td>Pasien atau petugas membatalkan antrean dengan mencantumkan alasan pembatalan.</td>
          <td>Status tiket berubah menjadi BATAL, kuota kuota dokter pulih otomatis.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td><strong>Pelaporan Task ID 1</strong><br><span style="font-size: 8pt; color: #475569;">Waktu Tunggu Admisi</span></td>
          <td>Pasien mengambil tiket di kiosk / hadir di faskes untuk verifikasi pendaftaran.</td>
          <td>Timestamp tercatat dalam milidetik epoch dan terkirim ke server BPJS.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">5</td>
          <td><strong>Pelaporan Task ID 2</strong><br><span style="font-size: 8pt; color: #475569;">Selesai Admisi / Terbit SEP</span></td>
          <td>Petugas loket selesai memverifikasi berkas, NIK, dan mencetak SEP pasien.</td>
          <td>Timestamp selesai admisi tercatat dan tiket diarahkan ke poli tujuan.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">6</td>
          <td><strong>Pelaporan Task ID 3</strong><br><span style="font-size: 8pt; color: #475569;">Waktu Tunggu Poli</span></td>
          <td>Pasien menunggu di ruang tunggu poliklinik tujuan (Poli Umum, Gigi, KIA).</td>
          <td>Timestamp antre poli terkirim ke BPJS Kesehatan.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">7</td>
          <td><strong>Pelaporan Task ID 4</strong><br><span style="font-size: 8pt; color: #475569;">Pemeriksaan Dokter Mulai</span></td>
          <td>Dokter menekan tombol 'Panggil Pasien / Mulai Layani' di konsol dokter.</td>
          <td>Waktu mulai periksa dokter terkirim real-time.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">8</td>
          <td><strong>Pelaporan Task ID 5</strong><br><span style="font-size: 8pt; color: #475569;">Pemeriksaan Dokter Selesai</span></td>
          <td>Dokter menyelesaikan pemeriksaan, input diagnosis, dan resep obat digital.</td>
          <td>Timestamp selesai periksa dokter tercatat dan resep terkirim ke farmasi.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">9</td>
          <td><strong>Pelaporan Task ID 6</strong><br><span style="font-size: 8pt; color: #475569;">Mulai Layanan Farmasi</span></td>
          <td>Petugas farmasi menerima resep dan memulai peracikan obat.</td>
          <td>Waktu tunggu peracikan obat tercatat di BPJS.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">10</td>
          <td><strong>Pelaporan Task ID 7</strong><br><span style="font-size: 8pt; color: #475569;">Penyerahan Obat Selesai</span></td>
          <td>Petugas farmasi memanggil pasien dan menyerahkan obat beserta edukasi.</td>
          <td>Seluruh siklus antrean pasien selesai 100%.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">11</td>
          <td><strong>Pemanggilan Suara (TTS)</strong><br><span style="font-size: 8pt; color: #475569;">Text-to-Speech Engine</span></td>
          <td>Sistem membunyikan chime audio dan memanggil nomor antrean dalam bahasa Indonesia.</td>
          <td>Panggilan suara terdengar jelas pada speaker ruang tunggu dan display TV.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">12</td>
          <td><strong>Keamanan &amp; Audit Log</strong><br><span style="font-size: 8pt; color: #475569;">HMAC-SHA256 &amp; MySQL</span></td>
          <td>Pengecekan signature HMAC-SHA256, dekripsi response AES-256-CBC, dan log transaksi.</td>
          <td>Otentikasi berhasil tanpa bocor kredensial, log audit tersimpan di MySQL.</td>
          <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
        </tr>
      </tbody>
    </table>

    <h2>II. KESIMPULAN &amp; REKOMENDASI TIM VERIFIKATOR</h2>
    <p>
      Berdasarkan hasil pengujian menyeluruh pada 12 skenario modul pelayanan di atas, <strong>Tim Verifikator (${meta.namaPimpinan} dan ${meta.namaPicVendor})</strong> menyatakan dan menyimpulkan bahwa <strong>Sistem Antrean ${meta.namaFaskes} telah 100% LULUS (PASS)</strong> serta memenuhi seluruh ketentuan teknis dan fungsional integrasi Web Service Antrean BPJS Kesehatan (Antrol RS v2 / FKTP).
    </p>
    <p>
      Dengan demikian, sistem dinyatakan <strong>MEMENUHI SYARAT (RECOMMENDED)</strong> untuk segera dibuka aksesnya dan beralih dari lingkungan Development (Sandbox) menuju lingkungan <strong>PRODUCTION (PROD)</strong>.
    </p>

    <p>Demikian Berita Acara User Acceptance Testing ini dibuat dengan sebenar-benarnya dalam rangkap yang sah untuk dipergunakan sebagai kelengkapan utama berkas pengajuan akses Production BPJS Kesehatan.</p>

    <!-- TANDA TANGAN TIM VERIFIKATOR (2 PIHAK RESMI) -->
    <table class="table-clean" style="margin-top: 24pt;">
      <tr>
        <td class="ttd-box">
          <strong>VERIFIKATOR I (FASILITAS KESEHATAN)</strong><br>
          ${meta.namaFaskes}<br><br><br><br><br>
          <strong style="text-decoration: underline; font-size: 11pt;">${meta.namaPimpinan}</strong><br>
          <span>${meta.jabatanPimpinan}</span><br>
          <span style="font-size: 9pt; color: #64748b;">NIK: ${meta.nikPimpinan}</span>
        </td>
        <td class="ttd-box">
          <strong>VERIFIKATOR II (PENGEMBANG SISTEM IT)</strong><br>
          ${meta.namaVendor}<br><br><br><br><br>
          <strong style="text-decoration: underline; font-size: 11pt;">${meta.namaPicVendor}</strong><br>
          <span>${meta.jabatanPicVendor}</span><br>
          <span style="font-size: 9pt; color: #64748b;">Pengembang SIM &amp; Verifikator Teknis UAT</span>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 3. PAKTA INTEGRITAS 2 PIHAK (FASKES & VENDOR)
 */
export function generatePaktaIntegritasHtml(meta: BerkasProdMetadata): string {
  return `
    <!-- BAGIAN 1: PAKTA INTEGRITAS FASKES -->
    <div class="kop-surat">
      <div class="kop-nama">${meta.namaFaskes}</div>
      <div class="kop-detail">
        Alamat: ${meta.alamatFaskes}, ${meta.kotaFaskes} | Kode PPK BPJS: <strong>${meta.kodePPK}</strong>
      </div>
    </div>

    <h1>PAKTA INTEGRITAS PIMPINAN FASILITAS KESEHATAN<br>BRIDGING SISTEM ANTREAN ONLINE (ANTROL) BPJS KESEHATAN</h1>

    <p style="margin-top: 14pt;">Saya yang bertanda tangan di bawah ini:</p>

    <table class="table-clean" style="margin: 8pt 0 12pt 0;">
      <tr>
        <td style="width: 140pt;">Nama Lengkap</td>
        <td style="width: 10pt;">:</td>
        <td><strong>${meta.namaPimpinan}</strong></td>
      </tr>
      <tr>
        <td>Nomor Induk Kependudukan (NIK)</td>
        <td>:</td>
        <td>${meta.nikPimpinan}</td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>:</td>
        <td>${meta.jabatanPimpinan}</td>
      </tr>
      <tr>
        <td>Nama Fasilitas Kesehatan</td>
        <td>:</td>
        <td>${meta.namaFaskes}</td>
      </tr>
      <tr>
        <td>Kode PPK BPJS Kesehatan</td>
        <td>:</td>
        <td><strong>${meta.kodePPK}</strong></td>
      </tr>
      <tr>
        <td>Alamat Faskes</td>
        <td>:</td>
        <td>${meta.alamatFaskes}, ${meta.kotaFaskes}</td>
      </tr>
      <tr>
        <td>Nomor Telepon / Email</td>
        <td>:</td>
        <td>${meta.teleponFaskes} / ${meta.emailFaskes}</td>
      </tr>
    </table>

    <p>
      Dalam rangka pelaksanaan integrasi sistem bridging antrean online fasilitas kesehatan kami dengan sistem teknologi informasi BPJS Kesehatan (Antrol RS v2 / FKTP), dengan ini menyatakan dengan penuh kesadaran dan tanggung jawab bahwa:
    </p>

    <ol style="padding-left: 18pt; line-height: 1.45;">
      <li style="margin-bottom: 6pt;">
        <strong>Kerahasiaan Kredensial Produksi:</strong> Akan menjaga kerahasiaan seluruh kredensial Web Service (Consumer ID, Secret Key, dan User Key) yang diberikan oleh BPJS Kesehatan, dan tidak akan memindahtangankan, menyewakan, atau memberikannya kepada pihak ketiga mana pun tanpa izin tertulis dari BPJS Kesehatan.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Perlindungan Data Pribadi Pasien:</strong> Tunduk dan patuh terhadap Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) serta peraturan perundang-undangan terkait rekam medis dan data kesehatan, dengan menjamin bahwa data Nomor Kartu BPJS, NIK, dan riwayat kunjungan pasien hanya digunakan semata-mata untuk keperluan pelayanan kesehatan peserta Program JKN.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Keandalan &amp; Akurasi Data:</strong> Bertanggung jawab penuh bahwa data transaksi antrean, waktu layanan (Task ID 1 s.d. 7), kuota poliklinik, dan jadwal dokter yang dikirimkan ke server BPJS Kesehatan adalah benar, akurat, dan mencerminkan operasional riil di fasilitas kesehatan kami.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Kepatuhan Penggunaan Web Service:</strong> Tidak akan melakukan tindakan penyerangan siber, pembebanan berlebih (DoS/DDoS), reverse engineering, pengikisan data (scraping), atau memanipulasi response data Web Service BPJS Kesehatan yang dapat mengganggu kestabilan sistem nasional.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Sanksi:</strong> Apabila di kemudian hari terbukti melanggar butir-butir pernyataan dalam Pakta Integritas ini, kami bersedia menerima sanksi pencabutan akses Web Service, pemutusan kerja sama fasilitas kesehatan, serta sanksi hukum sesuai ketentuan peraturan perundang-undangan yang berlaku di Republik Indonesia.
      </li>
    </ol>

    <p style="margin-top: 10pt;">Demikian Pakta Integritas ini kami buat dengan sebenarnya, tanpa ada paksaan dari pihak mana pun.</p>

    <table class="table-clean" style="margin-top: 20pt;">
      <tr>
        <td style="width: 50%;"></td>
        <td class="ttd-box">
          ${meta.kotaFaskes.replace('Kabupaten ', '').replace('Kota ', '')}, ${meta.tanggalSurat}<br>
          Yang Membuat Pernyataan,<br>
          <strong>${meta.namaFaskes}</strong><br>
          <div class="materai-box">MATERAI<br>Rp 10.000,-</div>
          <strong style="text-decoration: underline;">${meta.namaPimpinan}</strong><br>
          <span>${meta.jabatanPimpinan}</span>
        </td>
      </tr>
    </table>

    <!-- PAGE BREAK UNTUK PAKTA INTEGRITAS VENDOR -->
    <div class="page-break"></div>

    <!-- BAGIAN 2: PAKTA INTEGRITAS VENDOR / PENGEMBANG IT -->
    <div class="kop-surat">
      <div class="kop-nama">${meta.namaVendor}</div>
      <div class="kop-detail">
        DIVISI SISTEM INFORMASI MANAJEMEN KLINIK (SIMKLINIK) &amp; INTEGRASI BRIDGING BPJS KESEHATAN<br>
        Alamat: ${meta.alamatFaskes}, ${meta.kotaFaskes} | Email: ${meta.emailVendor} | Telp: ${meta.teleponVendor}
      </div>
    </div>

    <h1>PAKTA INTEGRITAS PENGEMBANG SISTEM / VENDOR IT<br>BRIDGING SISTEM ANTREAN ONLINE BPJS KESEHATAN</h1>

    <p style="margin-top: 14pt;">Saya yang bertanda tangan di bawah ini:</p>

    <table class="table-clean" style="margin: 8pt 0 12pt 0;">
      <tr>
        <td style="width: 140pt;">Nama Lengkap</td>
        <td style="width: 10pt;">:</td>
        <td><strong>${meta.namaPicVendor}</strong></td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>:</td>
        <td>${meta.jabatanPicVendor}</td>
      </tr>
      <tr>
        <td>Perusahaan / Tim Pengembang</td>
        <td>:</td>
        <td><strong>${meta.namaVendor}</strong></td>
      </tr>
      <tr>
        <td>Faskes Mitra</td>
        <td>:</td>
        <td>${meta.namaFaskes} (Kode PPK: <strong>${meta.kodePPK}</strong>)</td>
      </tr>
      <tr>
        <td>Nomor Telepon / Email</td>
        <td>:</td>
        <td>${meta.teleponVendor} / ${meta.emailVendor}</td>
      </tr>
    </table>

    <p>
      Selaku Pengembang dan Penyedia Perangkat Lunak Sistem Informasi Manajemen Fasilitas Kesehatan yang digunakan oleh mitra faskes kami, dengan ini menyatakan dengan sungguh-sungguh bahwa:
    </p>

    <ol style="padding-left: 18pt; line-height: 1.45;">
      <li style="margin-bottom: 6pt;">
        <strong>Kepatuhan Standar Teknis BPJS:</strong> Telah mengimplementasikan seluruh arsitektur integrasi bridging Web Service Antrean BPJS Kesehatan (Antrol RS v2 / FKTP) sesuai spesifikasi resmi, termasuk algoritma HMAC-SHA256, enkripsi/dekripsi AES-256-CBC, kompresi LZString, dan pemetaan Task ID 1 s.d. 7.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Bebas Backdoor &amp; Kode Berbahaya:</strong> Menjamin bahwa source code aplikasi yang dibangun bebas dari pintu belakang (backdoor), spyware, trojan, keylogger, atau komponen tersembunyi yang dapat mencuri kredensial API maupun data rekam medis pasien.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Keamanan Database &amp; Enkripsi Server:</strong> Menjamin seluruh komunikasi API menggunakan enkripsi protokol SSL/TLS 1.3 serta data kredensial disimpan dalam environment database terproteksi dengan pembatasan hak akses berbasis peran (Role-Based Access Control).
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Tidak Menyimpan Data Ilegal:</strong> Tidak akan memperjualbelikan, menyalin, menganalisis, atau mengeksploitasi data data medis, NIK, dan kepesertaan BPJS pasien untuk kepentingan pihak ketiga mana pun di luar fungsionalitas pelayanan klinik.
      </li>
      <li style="margin-bottom: 6pt;">
        <strong>Dukungan Teknis Operasional (SLA):</strong> Berkomitmen memberikan pendampingan teknis berkelanjutan, pemeliharaan sistem (*maintenance*), dan respons perbaikan cepat apabila terjadi kendala komunikasi data bridging guna menjamin kontinuitas pelayanan publik di faskes mitra.
      </li>
    </ol>

    <p style="margin-top: 10pt;">Demikian Pakta Integritas ini kami tandatangani dengan penuh tanggung jawab profesi dan kesadaran hukum.</p>

    <table class="table-clean" style="margin-top: 20pt;">
      <tr>
        <td style="width: 50%;"></td>
        <td class="ttd-box">
          ${meta.kotaFaskes.replace('Kabupaten ', '').replace('Kota ', '')}, ${meta.tanggalSurat}<br>
          Yang Membuat Pernyataan,<br>
          <strong>${meta.namaVendor}</strong><br>
          <div class="materai-box">MATERAI<br>Rp 10.000,-</div>
          <strong style="text-decoration: underline;">${meta.namaPicVendor}</strong><br>
          <span>${meta.jabatanPicVendor}</span>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 4. DOKUMEN SPESIFIKASI TEKNIS & WS URL (KHUSUS ANTREAN ONLINE / ANTROL)
 */
export function generateWsUrlAntrolHtml(meta: BerkasProdMetadata): string {
  return `
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-nama">${meta.namaFaskes}</div>
      <div class="kop-detail">
        DOKUMEN SPESIFIKASI TEKNIS &amp; PEMETAAN WEB SERVICE URL (WS URL) BRIDGING ANTREAN ONLINE<br>
        Standar Integrasi: Antrean RS v2 &amp; PCare FKTP BPJS Kesehatan | Kode PPK: <strong>${meta.kodePPK}</strong>
      </div>
    </div>

    <h1>DOKUMEN TEKNIS &amp; PEMETAAN WS URL<br>(KHUSUS BRIDGING ANTREAN ONLINE - ANTROL)</h1>
    <p style="text-align: center; font-size: 10pt; color: #475569; margin-top: -2pt;">
      Revisi: 1.0 (PROD Deployment Ready) | Terakhir Diperbarui: ${meta.tanggalSurat}
    </p>

    <h2>1. INFORMASI FASKES &amp; KREDENSIAL BRIDGING</h2>
    <table>
      <tr>
        <th style="width: 160pt;">Parameter</th>
        <th>Nilai Konfigurasi</th>
        <th style="width: 120pt;">Keterangan</th>
      </tr>
      <tr>
        <td><strong>Nama Fasilitas Kesehatan</strong></td>
        <td>${meta.namaFaskes}</td>
        <td>Faskes Pemohon</td>
      </tr>
      <tr>
        <td><strong>Kode PPK Faskes</strong></td>
        <td><strong style="color: #065f46;">${meta.kodePPK}</strong></td>
        <td>Terdaftar di Master Faskes BPJS</td>
      </tr>
      <tr>
        <td><strong>Consumer ID (Cons ID)</strong></td>
        <td><code>${meta.consId}</code></td>
        <td>Identitas Faskes Pemohon</td>
      </tr>
      <tr>
        <td><strong>User Key Antrean</strong></td>
        <td><code>${meta.userKey}</code></td>
        <td>Header Otentikasi BPJS</td>
      </tr>
      <tr>
        <td><strong>Kantor Cabang Pembina</strong></td>
        <td>${meta.kantorCabangBPJS}</td>
        <td>Wilayah Kerja Faskes</td>
      </tr>
    </table>

    <h2>2. BASE WEB SERVICE URL BPJS KESEHATAN</h2>
    <table>
      <tr>
        <th style="width: 120pt;">Lingkungan (Env)</th>
        <th>Base URL Web Service</th>
        <th style="width: 80pt; text-align: center;">Status</th>
      </tr>
      <tr>
        <td><strong>Development / Sandbox</strong></td>
        <td><code class="code-block" style="display: block;">${meta.urlBaseDev}</code></td>
        <td style="text-align: center;"><span class="badge-pass">PASS UAT</span></td>
      </tr>
      <tr>
        <td><strong>Production (PROD)</strong></td>
        <td><code class="code-block" style="display: block;">${meta.urlBaseProd}</code></td>
        <td style="text-align: center;"><span class="badge-prod">TARGET PROD</span></td>
      </tr>
    </table>

    <h2>3. INFRASTRUKTUR SERVER &amp; WEB SERVICE FASKES</h2>
    <table>
      <tr>
        <th style="width: 160pt;">Komponen Infrastruktur</th>
        <th>Spesifikasi Teknis</th>
      </tr>
      <tr>
        <td><strong>Base URL Server Faskes</strong></td>
        <td><code>${meta.urlServerFaskes}</code></td>
      </tr>
      <tr>
        <td><strong>IP Public Static Server Faskes</strong></td>
        <td><code>${meta.ipPublicServer}</code> (Telah siap untuk di-whitelist oleh Firewall BPJS)</td>
      </tr>
      <tr>
        <td><strong>Protokol &amp; Enkripsi SSL</strong></td>
        <td>HTTPS dengan TLS 1.3, Sertifikat DigiCert / Let's Encrypt SHA-256</td>
      </tr>
      <tr>
        <td><strong>Database Engine</strong></td>
        <td>MySQL 8.0 Enterprise / PostgreSQL dengan Audit Logging Transaksi JSON</td>
      </tr>
      <tr>
        <td><strong>Kapasitas Bandwidth</strong></td>
        <td>Koneksi Dedicated Fiber Optic 100 Mbps Simetris (Uptime SLA 99.8%)</td>
      </tr>
    </table>

    <h2>4. PEMETAAN ENDPOINT WEB SERVICE ANTREAN (WS URL MAPPING)</h2>
    <p>Daftar lengkap endpoint API Antrean Online yang telah diimplementasikan dan diverifikasi:</p>

    <table>
      <thead>
        <tr>
          <th style="width: 25pt; text-align: center;">No</th>
          <th style="width: 60pt;">Method</th>
          <th style="width: 140pt;">Endpoint Antrol</th>
          <th>Fungsi Pelayanan &amp; Payload Transaksi</th>
          <th style="width: 50pt; text-align: center;">Task</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td><span style="font-weight: bold; color: #059669;">POST</span></td>
          <td><code>/antrean/ambil</code></td>
          <td>Pasien mengambil nomor antrean (Kiosk / Mobile JKN). Mengembalikan nomor antrean, kode booking, dan estimasi waktu dilayani.</td>
          <td style="text-align: center;"><span class="badge-pass">Task 1</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td><span style="font-weight: bold; color: #0284c7;">GET</span></td>
          <td><code>/antrean/status/{kodeBooking}</code></td>
          <td>Mengambil status antrean terkini, loket pemanggil, dan posisi antrean di ruang tunggu.</td>
          <td style="text-align: center;">-</td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td><span style="font-weight: bold; color: #0284c7;">GET</span></td>
          <td><code>/antrean/sisa/{kodePoli}/{tgl}</code></td>
          <td>Pengecekan sisa kuota antrean poli dan nomor antrean yang sedang aktif dilayani.</td>
          <td style="text-align: center;">-</td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td><span style="font-weight: bold; color: #dc2626;">POST</span></td>
          <td><code>/antrean/batal</code></td>
          <td>Pembatalan antrean oleh pasien dengan parameter: kode booking dan keterangan alasan. Kuota dokter otomatis dikembalikan.</td>
          <td style="text-align: center;">-</td>
        </tr>
        <tr>
          <td style="text-align: center;">5</td>
          <td><span style="font-weight: bold; color: #059669;">POST</span></td>
          <td><code>/antrean/updatewaktu</code></td>
          <td>
            <strong>Pengiriman Timestamp Waktu Tunggu &amp; Layanan (Task ID 1 s.d. 7):</strong><br>
            • Task 1: Waktu tunggu admisi (Ambil tiket)<br>
            • Task 2: Selesai pendaftaran &amp; terbit SEP<br>
            • Task 3: Waktu tunggu di poli tujuan<br>
            • Task 4: Waktu pemeriksaan dokter dimulai<br>
            • Task 5: Waktu pemeriksaan dokter selesai<br>
            • Task 6: Waktu mulai penyiapan/racik obat farmasi<br>
            • Task 7: Penyerahan obat ke pasien selesai
          </td>
          <td style="text-align: center;"><span class="badge-prod">Task 1-7</span></td>
        </tr>
        <tr>
          <td style="text-align: center;">6</td>
          <td><span style="font-weight: bold; color: #0284c7;">GET</span></td>
          <td><code>/jadwal/dokter/{kodePoli}/{tgl}</code></td>
          <td>Sinkronisasi referensi master jadwal praktek dokter, jam buka/tutup, dan kapasitas kuota pasien per hari.</td>
          <td style="text-align: center;">-</td>
        </tr>
        <tr>
          <td style="text-align: center;">7</td>
          <td><span style="font-weight: bold; color: #059669;">POST</span></td>
          <td><code>/antrean/farmasi/ambil</code></td>
          <td>Pengambilan antrean depo farmasi setelah dokter menyelesaikan peresepan elektronik (Task 5).</td>
          <td style="text-align: center;"><span class="badge-pass">Task 6</span></td>
        </tr>
      </tbody>
    </table>

    <h2>5. SPESIFIKASI FORMAT HEADER &amp; OTENTIKASI KEAMANAN</h2>
    <p>Setiap request ke Web Service BPJS Kesehatan wajib menyertakan 4 header standar:</p>

    <div class="code-block">
x-cons-id: ${meta.consId}<br>
x-timestamp: {UTC Unix Epoch Seconds, e.g. 1791295200}<br>
x-signature: {HMAC-SHA256 Base64 Hash (ConsID + "&" + Timestamp, SecretKey)}<br>
user_key: ${meta.userKey}<br>
Content-Type: application/json
    </div>

    <p><strong>Formula Enkripsi &amp; Dekripsi:</strong></p>
    <ul>
      <li><strong>Signature:</strong> <code>Base64(HMAC_SHA256(ConsID + "&amp;" + Timestamp, SecretKey))</code></li>
      <li><strong>Decryption Key:</strong> <code>ConsID + SecretKey + Timestamp</code></li>
      <li><strong>Algoritma Dekripsi Response:</strong> AES-256-CBC dengan IV 16 bytes pertama hash SHA256 dari key.</li>
      <li><strong>Dekompresi Data:</strong> String hasil dekripsi didekompresi menggunakan LZString.</li>
    </ul>

    <h2>6. PENANGGUNG JAWAB TEKNIS &amp; VERIFIKATOR</h2>
    <table class="table-clean" style="margin-top: 14pt;">
      <tr>
        <td class="ttd-box">
          Disusun &amp; Diverifikasi Oleh,<br>
          <strong>Pengembang &amp; Verifikator Sistem IT</strong><br><br><br><br><br>
          <strong style="text-decoration: underline; font-size: 11pt;">${meta.namaPicVendor}</strong><br>
          <span>${meta.jabatanPicVendor}</span><br>
          <span style="font-size: 9pt; color: #64748b;">Kontak: ${meta.teleponVendor} | ${meta.emailVendor}</span>
        </td>
        <td class="ttd-box">
          Disetujui Oleh,<br>
          <strong>Pimpinan Fasilitas Kesehatan</strong><br><br><br><br><br>
          <strong style="text-decoration: underline; font-size: 11pt;">${meta.namaPimpinan}</strong><br>
          <span>${meta.jabatanPimpinan}</span><br>
          <span style="font-size: 9pt; color: #64748b;">Faskes: ${meta.namaFaskes}</span>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 5. BUNDLE LENGKAP: SEMUA 4 BERKAS PROD DALAM 1 FILE WORD (.doc)
 */
export function generatePaketLengkapBerkasProdHtml(meta: BerkasProdMetadata): string {
  return `
    <!-- BAGIAN 1: SURAT PERMOHONAN -->
    ${generateSuratPermohonanHtml(meta)}

    <div class="page-break"></div>

    <!-- BAGIAN 2: BERITA ACARA UAT -->
    ${generateBaUatHtml(meta)}

    <div class="page-break"></div>

    <!-- BAGIAN 3: PAKTA INTEGRITAS (FASKES & VENDOR) -->
    ${generatePaktaIntegritasHtml(meta)}

    <div class="page-break"></div>

    <!-- BAGIAN 4: DOKUMEN TEKNIS WS URL (ANTROL) -->
    ${generateWsUrlAntrolHtml(meta)}
  `;
}

/**
 * Helper untuk memicu unduhan file .doc di browser
 */
export function downloadDocFile(filename: string, htmlContent: string) {
  const fullDocument = wrapWordDocument(filename.replace('.doc', ''), htmlContent);
  const blob = new Blob(['\ufeff', fullDocument], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Handler Khusus untuk Setiap Dokumen:
 */
export function downloadSuratPermohonanDoc(meta: BerkasProdMetadata = DEFAULT_BERKAS_PROD_METADATA) {
  const html = generateSuratPermohonanHtml(meta);
  const filename = `1_Surat_Permohonan_Bridging_PROD_${meta.kodePPK}.doc`;
  downloadDocFile(filename, html);
}

export function downloadBaUatDoc(meta: BerkasProdMetadata = DEFAULT_BERKAS_PROD_METADATA) {
  const html = generateBaUatHtml(meta);
  const filename = `2_Berita_Acara_UAT_Antrol_PROD_${meta.kodePPK}.doc`;
  downloadDocFile(filename, html);
}

export function downloadPaktaIntegritasDoc(meta: BerkasProdMetadata = DEFAULT_BERKAS_PROD_METADATA) {
  const html = generatePaktaIntegritasHtml(meta);
  const filename = `3_Pakta_Integritas_Faskes_dan_Vendor_PROD_${meta.kodePPK}.doc`;
  downloadDocFile(filename, html);
}

export function downloadWsUrlAntrolDoc(meta: BerkasProdMetadata = DEFAULT_BERKAS_PROD_METADATA) {
  const html = generateWsUrlAntrolHtml(meta);
  const filename = `4_Dokumen_Teknis_WS_URL_Antrol_PROD_${meta.kodePPK}.doc`;
  downloadDocFile(filename, html);
}

export function downloadSemuaBerkasProdDoc(meta: BerkasProdMetadata = DEFAULT_BERKAS_PROD_METADATA) {
  const html = generatePaketLengkapBerkasProdHtml(meta);
  const filename = `PAKET_LENGKAP_BERKAS_PROD_ANTROL_${meta.kodePPK}.doc`;
  downloadDocFile(filename, html);
}
