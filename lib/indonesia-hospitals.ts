export interface ReferralHospital {
  id?: string;
  kodeFaskes: string;
  nama: string;
  kelas: 'A' | 'B' | 'C' | 'D' | 'Khusus';
  jenis: string;
  kota: string;
  provinsi: string;
  alamat?: string;
  telepon?: string;
  isBpjs?: boolean;
}

export const INDONESIA_PROVINCES: string[] = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Barat Daya',
];

/**
 * Daftar Master RS Rujukan FKRTL BPJS Kesehatan seluruh Indonesia (38 Provinsi).
 * Digunakan sebagai data seed awal tabel `rs_rujukan` di MySQL.
 */
export const INDONESIA_REFERRAL_HOSPITALS: ReferralHospital[] = [
  // ================= JAWA TIMUR (Prioritas Wilayah Sekitar Sidoarjo & Jatim) =================
  { kodeFaskes: '0195R001', nama: 'RSUD Sidoarjo (R.T. Notopuro)', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Mojopahit No. 667, Sidoarjo' },
  { kodeFaskes: '0195R002', nama: 'RSI Siti Hajar Sidoarjo', kelas: 'B', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Raden Patah No. 70-72, Sidoarjo' },
  { kodeFaskes: '0195R003', nama: 'RS Delta Surya Sidoarjo', kelas: 'C', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Pahlawan No. 9, Sidoarjo' },
  { kodeFaskes: '0195R004', nama: 'RS Mitra Keluarga Waru', kelas: 'B', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Jend. S. Parman No. 8, Waru, Sidoarjo' },
  { kodeFaskes: '0195R005', nama: 'RSU Anwar Medika Krian', kelas: 'C', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Bypass Krian KM 33, Balongbendo, Sidoarjo' },
  { kodeFaskes: '0195R006', nama: 'RS Jasem Sidoarjo', kelas: 'C', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Samanhudi No. 85a, Sidoarjo' },
  { kodeFaskes: '0195R007', nama: 'RSUD Sidoarjo Barat', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Bibis Bunder, Tambak Kemerakan, Krian, Sidoarjo' },
  { kodeFaskes: '0195R008', nama: 'RS Bhayangkara Pusdik Sabhara Porong', kelas: 'C', jenis: 'RS Polri', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Raya Porong No. 1, Sidoarjo' },
  { kodeFaskes: '0195R009', nama: 'RS Rahman Rahim Sukodono', kelas: 'C', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Raya Saimbang, Kebonagung, Sukodono, Sidoarjo' },
  { kodeFaskes: '0195R010', nama: 'RS Citra Medika Tarik', kelas: 'C', jenis: 'RSU Swasta', kota: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', alamat: 'Jl. Raya Surabaya-Mojokerto KM 44, Tarik, Sidoarjo' },
  { kodeFaskes: '0201R001', nama: 'RSUD Dr. Soetomo Surabaya', kelas: 'A', jenis: 'RSUD Rujukan Nasional', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Mayjen Prof. Dr. Moestopo No. 6-8, Surabaya' },
  { kodeFaskes: '0201R002', nama: 'RS Universitas Airlangga (RSUA)', kelas: 'B', jenis: 'RS PTN', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Kampus C Mulyorejo, Surabaya' },
  { kodeFaskes: '0201R003', nama: 'RSPAL Dr. Ramelan Surabaya', kelas: 'A', jenis: 'RS TNI AL', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Gadung No. 1, Wonokromo, Surabaya' },
  { kodeFaskes: '0201R004', nama: 'RSUD Haji Provinsi Jawa Timur', kelas: 'B', jenis: 'RSUD', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Manyar Kertoadi, Sukolilo, Surabaya' },
  { kodeFaskes: '0201R005', nama: 'RSUD Dr. Mohamad Soewandhie', kelas: 'B', jenis: 'RSUD', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Tambak Rejo No. 45-47, Surabaya' },
  { kodeFaskes: '0201R006', nama: 'RSI Surabaya A. Yani', kelas: 'B', jenis: 'RSU Swasta', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Jend. A. Yani No. 2-4, Surabaya' },
  { kodeFaskes: '0201R007', nama: 'RS Premier Surabaya', kelas: 'B', jenis: 'RSU Swasta', kota: 'Kota Surabaya', provinsi: 'Jawa Timur', alamat: 'Jl. Nginden Intan Barat Blok B, Surabaya' },
  { kodeFaskes: '0202R001', nama: 'RSUD Dr. Saiful Anwar Malang', kelas: 'A', jenis: 'RSUD Rujukan', kota: 'Kota Malang', provinsi: 'Jawa Timur', alamat: 'Jl. Jaksa Agung Suprapto No. 2, Malang' },
  { kodeFaskes: '0202R002', nama: 'RSUD Kanjuruhan Kepanjen', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Malang', provinsi: 'Jawa Timur', alamat: 'Jl. Panji No. 100, Kepanjen, Malang' },
  { kodeFaskes: '0203R001', nama: 'RSUD Dr. Soebandi Jember', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Jember', provinsi: 'Jawa Timur', alamat: 'Jl. Dr. Soebandi No. 124, Jember' },
  { kodeFaskes: '0204R001', nama: 'RSUD Dr. Iskak Tulungagung', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Tulungagung', provinsi: 'Jawa Timur', alamat: 'Jl. Dr. Wahidin Sudiro Husodo, Tulungagung' },
  { kodeFaskes: '0205R001', nama: 'RSUD Dr. Soedono Madiun', kelas: 'B', jenis: 'RSUD', kota: 'Kota Madiun', provinsi: 'Jawa Timur', alamat: 'Jl. Dr. Soetomo No. 59, Madiun' },
  { kodeFaskes: '0206R001', nama: 'RSUD Gambiran Kota Kediri', kelas: 'B', jenis: 'RSUD', kota: 'Kota Kediri', provinsi: 'Jawa Timur', alamat: 'Jl. Kapten Piere Tendean No. 16, Kediri' },
  { kodeFaskes: '0207R001', nama: 'RSUD Ibnu Sina Kabupaten Gresik', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Gresik', provinsi: 'Jawa Timur', alamat: 'Jl. Dr. Wahidin Sudirohusodo No. 243B, Gresik' },
  { kodeFaskes: '0208R001', nama: 'RSUD Dr. Wahidin Sudiro Husodo', kelas: 'B', jenis: 'RSUD', kota: 'Kota Mojokerto', provinsi: 'Jawa Timur', alamat: 'Jl. Raya Surodinawan, Mojokerto' },
  { kodeFaskes: '0209R001', nama: 'RSUD Bangil Kab. Pasuruan', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Pasuruan', provinsi: 'Jawa Timur', alamat: 'Jl. Raya Raci - Bangil, Pasuruan' },
  { kodeFaskes: '0210R001', nama: 'RSUD Blambangan Banyuwangi', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Banyuwangi', provinsi: 'Jawa Timur', alamat: 'Jl. Letkol Istiqlah No. 49, Banyuwangi' },
  { kodeFaskes: '0211R001', nama: 'RSUD Dr. Soegiri Lamongan', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Lamongan', provinsi: 'Jawa Timur', alamat: 'Jl. Kusuma Bangsa No. 7, Lamongan' },
  { kodeFaskes: '0212R001', nama: 'RSUD Syarifah Ambami Rato Ebu', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Bangkalan', provinsi: 'Jawa Timur', alamat: 'Jl. Pemuda Kaffa No. 9, Bangkalan' },

  // ================= DKI JAKARTA =================
  { kodeFaskes: '0901R001', nama: 'RSUPN Dr. Cipto Mangunkusumo (RSCM)', kelas: 'A', jenis: 'RSUP Nasional', kota: 'Jakarta Pusat', provinsi: 'DKI Jakarta', alamat: 'Jl. Pangeran Diponegoro No. 71, Jakarta Pusat' },
  { kodeFaskes: '0901R002', nama: 'RSPAD Gatot Soebroto', kelas: 'A', jenis: 'RS TNI AD', kota: 'Jakarta Pusat', provinsi: 'DKI Jakarta', alamat: 'Jl. Abdul Rahman Saleh No. 24, Jakarta Pusat' },
  { kodeFaskes: '0901R003', nama: 'RSUP Persahabatan', kelas: 'A', jenis: 'RSUP', kota: 'Jakarta Timur', provinsi: 'DKI Jakarta', alamat: 'Jl. Persahabatan Raya No. 1, Jakarta Timur' },
  { kodeFaskes: '0901R004', nama: 'RSUP Fatmawati', kelas: 'A', jenis: 'RSUP', kota: 'Jakarta Selatan', provinsi: 'DKI Jakarta', alamat: 'Jl. RS Fatmawati Raya No. 4, Jakarta Selatan' },
  { kodeFaskes: '0901R005', nama: 'RS Jantung & Pembuluh Darah Harapan Kita', kelas: 'A', jenis: 'RS Khusus Nasional', kota: 'Jakarta Barat', provinsi: 'DKI Jakarta', alamat: 'Jl. Letjen S. Parman Kav. 87, Jakarta Barat' },
  { kodeFaskes: '0901R006', nama: 'RS Kanker Dharmais', kelas: 'A', jenis: 'RS Khusus Nasional', kota: 'Jakarta Barat', provinsi: 'DKI Jakarta', alamat: 'Jl. Letjen S. Parman Kav. 84-86, Jakarta Barat' },
  { kodeFaskes: '0901R007', nama: 'RSUD Tarakan Jakarta', kelas: 'A', jenis: 'RSUD', kota: 'Jakarta Pusat', provinsi: 'DKI Jakarta', alamat: 'Jl. Kyai Caringin No. 7, Jakarta Pusat' },
  { kodeFaskes: '0901R008', nama: 'RSUD Pasar Rebo', kelas: 'B', jenis: 'RSUD', kota: 'Jakarta Timur', provinsi: 'DKI Jakarta', alamat: 'Jl. TB Simatupang No. 30, Jakarta Timur' },
  { kodeFaskes: '0901R009', nama: 'RSUD Koja', kelas: 'B', jenis: 'RSUD', kota: 'Jakarta Utara', provinsi: 'DKI Jakarta', alamat: 'Jl. Deli No. 4, Koja, Jakarta Utara' },
  { kodeFaskes: '0901R010', nama: 'RSUD Cengkareng', kelas: 'B', jenis: 'RSUD', kota: 'Jakarta Barat', provinsi: 'DKI Jakarta', alamat: 'Jl. Kamal Raya Bumi Cengkareng Indah, Jakarta Barat' },

  // ================= JAWA BARAT =================
  { kodeFaskes: '1001R001', nama: 'RSUP Dr. Hasan Sadikin (RSHS) Bandung', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Bandung', provinsi: 'Jawa Barat', alamat: 'Jl. Pasteur No. 38, Bandung' },
  { kodeFaskes: '1001R002', nama: 'RS Mata Cicendo Bandung', kelas: 'A', jenis: 'RS Khusus Mata', kota: 'Kota Bandung', provinsi: 'Jawa Barat', alamat: 'Jl. Cicendo No. 4, Bandung' },
  { kodeFaskes: '1002R001', nama: 'RSUD Al Ihsan Provinsi Jawa Barat', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Bandung', provinsi: 'Jawa Barat', alamat: 'Jl. Ki Astramanggala, Baleendah, Bandung' },
  { kodeFaskes: '1003R001', nama: 'RSUD Kota Bogor', kelas: 'B', jenis: 'RSUD', kota: 'Kota Bogor', provinsi: 'Jawa Barat', alamat: 'Jl. Dr. Sumeru No. 120, Bogor' },
  { kodeFaskes: '1004R001', nama: 'RSUD Dr. Chasbullah Abdulmadjid', kelas: 'B', jenis: 'RSUD', kota: 'Kota Bekasi', provinsi: 'Jawa Barat', alamat: 'Jl. Pramuka No. 55, Bekasi' },
  { kodeFaskes: '1005R001', nama: 'RSUD Khidmat Sehat Afiat (KiSA) Depok', kelas: 'C', jenis: 'RSUD', kota: 'Kota Depok', provinsi: 'Jawa Barat', alamat: 'Jl. Raya Muchtar No. 99, Depok' },
  { kodeFaskes: '1006R001', nama: 'RSUD Gunung Jati Kota Cirebon', kelas: 'B', jenis: 'RSUD', kota: 'Kota Cirebon', provinsi: 'Jawa Barat', alamat: 'Jl. Kesambi No. 56, Cirebon' },
  { kodeFaskes: '1007R001', nama: 'RSUD Dr. Soekardjo Tasikmalaya', kelas: 'B', jenis: 'RSUD', kota: 'Kota Tasikmalaya', provinsi: 'Jawa Barat', alamat: 'Jl. Rumah Sakit No. 33, Tasikmalaya' },
  { kodeFaskes: '1008R001', nama: 'RSUD Karawang', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Karawang', provinsi: 'Jawa Barat', alamat: 'Jl. Galuh Mas Raya No. 1, Karawang' },

  // ================= BANTEN =================
  { kodeFaskes: '2801R001', nama: 'RSUP Dr. Sitanala Tangerang', kelas: 'B', jenis: 'RSUP', kota: 'Kota Tangerang', provinsi: 'Banten', alamat: 'Jl. Dr. Sitanala No. 99, Tangerang' },
  { kodeFaskes: '2801R002', nama: 'RSUD Kabupaten Tangerang', kelas: 'B', jenis: 'RSUD', kota: 'Kota Tangerang', provinsi: 'Banten', alamat: 'Jl. Jend. Ahmad Yani No. 9, Tangerang' },
  { kodeFaskes: '2802R001', nama: 'RSUD Provinsi Banten', kelas: 'B', jenis: 'RSUD', kota: 'Kota Serang', provinsi: 'Banten', alamat: 'Jl. Syekh Nawawi Al-Bantani, Serang' },
  { kodeFaskes: '2803R001', nama: 'RSUD Kota Tangerang Selatan', kelas: 'C', jenis: 'RSUD', kota: 'Kota Tangerang Selatan', provinsi: 'Banten', alamat: 'Jl. Pajajaran No. 101, Pamulang' },

  // ================= JAWA TENGAH =================
  { kodeFaskes: '1101R001', nama: 'RSUP Dr. Kariadi Semarang', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Semarang', provinsi: 'Jawa Tengah', alamat: 'Jl. Dr. Sutomo No. 16, Semarang' },
  { kodeFaskes: '1101R002', nama: 'RSUD Tugurejo Semarang', kelas: 'B', jenis: 'RSUD', kota: 'Kota Semarang', provinsi: 'Jawa Tengah', alamat: 'Jl. Walisongo KM 8,5, Semarang' },
  { kodeFaskes: '1102R001', nama: 'RSUD Dr. Moewardi Surakarta', kelas: 'A', jenis: 'RSUD Rujukan', kota: 'Kota Surakarta', provinsi: 'Jawa Tengah', alamat: 'Jl. Kolonel Sutarto No. 132, Surakarta' },
  { kodeFaskes: '1103R001', nama: 'RSUP Dr. Soeradji Tirtonegoro Klaten', kelas: 'A', jenis: 'RSUP', kota: 'Kab. Klaten', provinsi: 'Jawa Tengah', alamat: 'Jl. KRT Soeradji Tirtonegoro No. 1, Klaten' },
  { kodeFaskes: '1104R001', nama: 'RSUD Prof. Dr. Margono Soekarjo', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Banyumas', provinsi: 'Jawa Tengah', alamat: 'Jl. Dr. Gumbreg No. 1, Purwokerto' },
  { kodeFaskes: '1105R001', nama: 'RSUD Tidar Kota Magelang', kelas: 'B', jenis: 'RSUD', kota: 'Kota Magelang', provinsi: 'Jawa Tengah', alamat: 'Jl. Tidar No. 30A, Magelang' },
  { kodeFaskes: '1106R001', nama: 'RSUD Kardinah Kota Tegal', kelas: 'B', jenis: 'RSUD', kota: 'Kota Tegal', provinsi: 'Jawa Tengah', alamat: 'Jl. AIP KS Tubun No. 2, Tegal' },

  // ================= DI YOGYAKARTA =================
  { kodeFaskes: '1201R001', nama: 'RSUP Dr. Sardjito Yogyakarta', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kab. Sleman', provinsi: 'DI Yogyakarta', alamat: 'Jl. Kesehatan No. 1, Sekip, Yogyakarta' },
  { kodeFaskes: '1201R002', nama: 'RSUD Kota Yogyakarta (Wirosaban)', kelas: 'B', jenis: 'RSUD', kota: 'Kota Yogyakarta', provinsi: 'DI Yogyakarta', alamat: 'Jl. Ki Ageng Pemanahan No. 1-6, Yogyakarta' },
  { kodeFaskes: '1202R001', nama: 'RSUD Panembahan Senopati Bantul', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Bantul', provinsi: 'DI Yogyakarta', alamat: 'Jl. Dr. Wahidin Sudiro Husodo, Bantul' },
  { kodeFaskes: '1203R001', nama: 'RSUD Sleman', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Sleman', provinsi: 'DI Yogyakarta', alamat: 'Jl. Bhayangkara No. 48, Sleman' },

  // ================= ACEH =================
  { kodeFaskes: '0101R001', nama: 'RSUD Dr. Zainoel Abidin Banda Aceh', kelas: 'A', jenis: 'RSUD Rujukan Provinsi', kota: 'Kota Banda Aceh', provinsi: 'Aceh', alamat: 'Jl. Tgk. Daud Beureueh No. 108, Banda Aceh' },
  { kodeFaskes: '0102R001', nama: 'RSUD Cut Meutia Aceh Utara', kelas: 'B', jenis: 'RSUD', kota: 'Kota Lhokseumawe', provinsi: 'Aceh', alamat: 'Jl. Banda Aceh - Medan KM 6, Buket Rata' },
  { kodeFaskes: '0103R001', nama: 'RSUD Cut Nyak Dhien Meulaboh', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Aceh Barat', provinsi: 'Aceh', alamat: 'Jl. Gajah Mada, Meulaboh' },

  // ================= SUMATERA UTARA =================
  { kodeFaskes: '0213R001', nama: 'RSUP H. Adam Malik Medan', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Medan', provinsi: 'Sumatera Utara', alamat: 'Jl. Bunga Lau No. 17, Medan' },
  { kodeFaskes: '0213R002', nama: 'RSUD Dr. Pirngadi Medan', kelas: 'B', jenis: 'RSUD', kota: 'Kota Medan', provinsi: 'Sumatera Utara', alamat: 'Jl. Prof. HM Yamin SH No. 47, Medan' },
  { kodeFaskes: '0214R001', nama: 'RSUD Dr. Djasamen Saragih', kelas: 'B', jenis: 'RSUD', kota: 'Kota Pematangsiantar', provinsi: 'Sumatera Utara', alamat: 'Jl. Sutomo No. 230, Pematangsiantar' },
  { kodeFaskes: '0215R001', nama: 'RSUD Padangsidimpuan', kelas: 'B', jenis: 'RSUD', kota: 'Kota Padangsidimpuan', provinsi: 'Sumatera Utara', alamat: 'Jl. Dr. F.L. Tobing No. 10' },

  // ================= SUMATERA BARAT =================
  { kodeFaskes: '0301R001', nama: 'RSUP Dr. M. Djamil Padang', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Padang', provinsi: 'Sumatera Barat', alamat: 'Jl. Perintis Kemerdekaan, Padang' },
  { kodeFaskes: '0302R001', nama: 'RSUD Dr. Achmad Mochtar Bukittinggi', kelas: 'B', jenis: 'RSUD', kota: 'Kota Bukittinggi', provinsi: 'Sumatera Barat', alamat: 'Jl. Dr. Abdul Rivai No. 1, Bukittinggi' },
  { kodeFaskes: '0303R001', nama: 'RSUD Padang Pariaman', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Padang Pariaman', provinsi: 'Sumatera Barat', alamat: 'Jl. Raya Parit Malintang' },

  // ================= RIAU & KEPULAUAN RIAU =================
  { kodeFaskes: '0401R001', nama: 'RSUD Arifin Achmad Provinsi Riau', kelas: 'B', jenis: 'RSUD Rujukan Provinsi', kota: 'Kota Pekanbaru', provinsi: 'Riau', alamat: 'Jl. Diponegoro No. 2, Pekanbaru' },
  { kodeFaskes: '0402R001', nama: 'RSUD Kota Dumai', kelas: 'B', jenis: 'RSUD', kota: 'Kota Dumai', provinsi: 'Riau', alamat: 'Jl. Tanjung Jati No. 4, Dumai' },
  { kodeFaskes: '0501R001', nama: 'RSUD Embung Fatimah Kota Batam', kelas: 'B', jenis: 'RSUD', kota: 'Kota Batam', provinsi: 'Kepulauan Riau', alamat: 'Jl. Letjen R. Soeprapto Blok D1-9, Batam' },
  { kodeFaskes: '0502R001', nama: 'RSUD Raja Ahmad Tabib Tanjungpinang', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Tanjungpinang', provinsi: 'Kepulauan Riau', alamat: 'Jl. W.R. Supratman No. 100, Tanjungpinang' },

  // ================= JAMBI, SUMSEL, BABEL, BENGKULU, LAMPUNG =================
  { kodeFaskes: '0601R001', nama: 'RSUD Raden Mattaher Provinsi Jambi', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Jambi', provinsi: 'Jambi', alamat: 'Jl. Letjen Suprapto No. 31, Telanaipura, Jambi' },
  { kodeFaskes: '0701R001', nama: 'RSUP Dr. Mohammad Hoesin Palembang', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Palembang', provinsi: 'Sumatera Selatan', alamat: 'Jl. Jend. Sudirman KM 3.5, Palembang' },
  { kodeFaskes: '0701R002', nama: 'RSUD Siti Fatimah Az-Zahra Sumsel', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Palembang', provinsi: 'Sumatera Selatan', alamat: 'Jl. Kol. H. Burlian, Palembang' },
  { kodeFaskes: '0702R001', nama: 'RSUD Siti Aisyah Lubuklinggau', kelas: 'B', jenis: 'RSUD', kota: 'Kota Lubuklinggau', provinsi: 'Sumatera Selatan', alamat: 'Jl. Lapter Silampari, Lubuklinggau' },
  { kodeFaskes: '2901R001', nama: 'RSUD Dr. (H.C.) Ir. Soekarno Babel', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kab. Bangka', provinsi: 'Bangka Belitung', alamat: 'Jl. Zipur, Air Anyir, Merawang, Bangka' },
  { kodeFaskes: '0801R001', nama: 'RSUD Dr. M. Yunus Bengkulu', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Bengkulu', provinsi: 'Bengkulu', alamat: 'Jl. Bhayangkara, Sidomulyo, Bengkulu' },
  { kodeFaskes: '0851R001', nama: 'RSUD Dr. H. Abdul Moeloek Lampung', kelas: 'A', jenis: 'RSUD Provinsi', kota: 'Kota Bandar Lampung', provinsi: 'Lampung', alamat: 'Jl. Dr. Rivai No. 6, Bandar Lampung' },
  { kodeFaskes: '0852R001', nama: 'RSUD Jend. Ahmad Yani Metro', kelas: 'B', jenis: 'RSUD', kota: 'Kota Metro', provinsi: 'Lampung', alamat: 'Jl. Jend. A. Yani No. 13, Metro' },

  // ================= BALI, NTB, NTT =================
  { kodeFaskes: '2201R001', nama: 'RSUP Prof. Dr. I.G.N.G. Ngoerah (Sanglah)', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Denpasar', provinsi: 'Bali', alamat: 'Jl. Diponegoro, Dauh Puri Klod, Denpasar' },
  { kodeFaskes: '2201R002', nama: 'RSUD Bali Mandara', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Denpasar', provinsi: 'Bali', alamat: 'Jl. Bypass Ngurah Rai No. 548, Denpasar' },
  { kodeFaskes: '2202R001', nama: 'RSUD Sanjiwani Gianyar', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Gianyar', provinsi: 'Bali', alamat: 'Jl. Ciung Wanara No. 2, Gianyar' },
  { kodeFaskes: '2301R001', nama: 'RSUD Provinsi NTB', kelas: 'A', jenis: 'RSUD Provinsi', kota: 'Kota Mataram', provinsi: 'Nusa Tenggara Barat', alamat: 'Jl. Prabu Rangkasari, Dasan Cermen, Mataram' },
  { kodeFaskes: '2302R001', nama: 'RSUD Bima', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Bima', provinsi: 'Nusa Tenggara Barat', alamat: 'Jl. Langsat No. 1, Raba, Bima' },
  { kodeFaskes: '2401R001', nama: 'RSUP Dr. Ben Mboi Kupang', kelas: 'B', jenis: 'RSUP', kota: 'Kota Kupang', provinsi: 'Nusa Tenggara Timur', alamat: 'Jl. Frans Seda, Kupang' },
  { kodeFaskes: '2401R002', nama: 'RSUD Prof. Dr. W.Z. Johannes Kupang', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Kupang', provinsi: 'Nusa Tenggara Timur', alamat: 'Jl. Dr. Moch. Hatta No. 19, Kupang' },

  // ================= KALIMANTAN (BARAT, TENGAH, SELATAN, TIMUR, UTARA) =================
  { kodeFaskes: '1301R001', nama: 'RSUD Dr. Soedarso Pontianak', kelas: 'A', jenis: 'RSUD Provinsi', kota: 'Kota Pontianak', provinsi: 'Kalimantan Barat', alamat: 'Jl. Dr. Soedarso No. 1, Pontianak' },
  { kodeFaskes: '1302R001', nama: 'RSUD Dr. Abdul Aziz Singkawang', kelas: 'B', jenis: 'RSUD', kota: 'Kota Singkawang', provinsi: 'Kalimantan Barat', alamat: 'Jl. Dr. Soetomo No. 28, Singkawang' },
  { kodeFaskes: '1401R001', nama: 'RSUD Dr. Doris Sylvanus Palangkaraya', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Palangka Raya', provinsi: 'Kalimantan Tengah', alamat: 'Jl. Tambun Bungai No. 4, Palangka Raya' },
  { kodeFaskes: '1501R001', nama: 'RSUD Ulin Banjarmasin', kelas: 'A', jenis: 'RSUD Provinsi', kota: 'Kota Banjarmasin', provinsi: 'Kalimantan Selatan', alamat: 'Jl. A. Yani KM 2,5 No. 43, Banjarmasin' },
  { kodeFaskes: '1502R001', nama: 'RSUD Ratu Zalecha Martapura', kelas: 'B', jenis: 'RSUD', kota: 'Kab. Banjar', provinsi: 'Kalimantan Selatan', alamat: 'Jl. Menteri Empat, Martapura' },
  { kodeFaskes: '1601R001', nama: 'RSUD Abdul Wahab Sjahranie Samarinda', kelas: 'A', jenis: 'RSUD Provinsi', kota: 'Kota Samarinda', provinsi: 'Kalimantan Timur', alamat: 'Jl. Palang Merah No. 1, Samarinda' },
  { kodeFaskes: '1602R001', nama: 'RSUD Dr. Kanujoso Djatiwibowo', kelas: 'B', jenis: 'RSUD', kota: 'Kota Balikpapan', provinsi: 'Kalimantan Timur', alamat: 'Jl. M.T. Haryono No. 656, Balikpapan' },
  { kodeFaskes: '3401R001', nama: 'RSUD dr. H. Jusuf SK Tarakan', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Tarakan', provinsi: 'Kalimantan Utara', alamat: 'Jl. Pulau Irian No. 1, Tarakan' },

  // ================= SULAWESI (UTARA, GORONTALO, TENGAH, BARAT, SELATAN, TENGGARA) =================
  { kodeFaskes: '1701R001', nama: 'RSUP Prof. Dr. R.D. Kandou Manado', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Manado', provinsi: 'Sulawesi Utara', alamat: 'Jl. Raya Tanawangko No. 56, Manado' },
  { kodeFaskes: '3001R001', nama: 'RSUD Prof. Dr. H. Aloei Saboe Gorontalo', kelas: 'B', jenis: 'RSUD', kota: 'Kota Gorontalo', provinsi: 'Gorontalo', alamat: 'Jl. Prof. Dr. H. Aloei Saboe No. 92, Gorontalo' },
  { kodeFaskes: '1801R001', nama: 'RSUD Undata Palu', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Palu', provinsi: 'Sulawesi Tengah', alamat: 'Jl. R.E. Martadinata, Tondo, Palu' },
  { kodeFaskes: '3101R001', nama: 'RSUD Provinsi Sulawesi Barat', kelas: 'C', jenis: 'RSUD Provinsi', kota: 'Kab. Mamuju', provinsi: 'Sulawesi Barat', alamat: 'Jl. R.E. Martadinata, Mamuju' },
  { kodeFaskes: '1901R001', nama: 'RSUP Dr. Wahidin Sudirohusodo Makassar', kelas: 'A', jenis: 'RSUP Rujukan Nasional', kota: 'Kota Makassar', provinsi: 'Sulawesi Selatan', alamat: 'Jl. Perintis Kemerdekaan KM 11, Makassar' },
  { kodeFaskes: '1901R002', nama: 'RSUD Labuang Baji Makassar', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Makassar', provinsi: 'Sulawesi Selatan', alamat: 'Jl. Dr. Ratulangi No. 81, Makassar' },
  { kodeFaskes: '1902R001', nama: 'RSUD Andi Makkasau Parepare', kelas: 'B', jenis: 'RSUD', kota: 'Kota Parepare', provinsi: 'Sulawesi Selatan', alamat: 'Jl. Nurussamawati No. 9, Parepare' },
  { kodeFaskes: '2001R001', nama: 'RSUD Bahteramas Kendari', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Kendari', provinsi: 'Sulawesi Tenggara', alamat: 'Jl. Kapten Piere Tendean No. 50, Kendari' },

  // ================= MALUKU & MALUKU UTARA =================
  { kodeFaskes: '2101R001', nama: 'RSUP Dr. Johannes Leimena Ambon', kelas: 'B', jenis: 'RSUP', kota: 'Kota Ambon', provinsi: 'Maluku', alamat: 'Jl. R. Wolter Monginsidi, Rumah Tiga, Ambon' },
  { kodeFaskes: '2101R002', nama: 'RSUD Dr. M. Haulussy Ambon', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Ambon', provinsi: 'Maluku', alamat: 'Jl. Dr. Kayadoe, Benteng, Ambon' },
  { kodeFaskes: '3201R001', nama: 'RSUD Dr. H. Chasan Boesoirie Ternate', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Ternate', provinsi: 'Maluku Utara', alamat: 'Jl. Cempaka, Tanah Tinggi, Ternate' },

  // ================= PAPUA (6 PROVINSI) =================
  { kodeFaskes: '2501R001', nama: 'RSUD Dok II Jayapura', kelas: 'B', jenis: 'RSUD Provinsi', kota: 'Kota Jayapura', provinsi: 'Papua', alamat: 'Jl. Kesehatan I No. 1, Dok II, Jayapura' },
  { kodeFaskes: '2501R002', nama: 'RSUD Abepura Jayapura', kelas: 'B', jenis: 'RSUD', kota: 'Kota Jayapura', provinsi: 'Papua', alamat: 'Jl. Gerilyawan No. 70, Abepura, Jayapura' },
  { kodeFaskes: '3301R001', nama: 'RSUD Manokwari', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Manokwari', provinsi: 'Papua Barat', alamat: 'Jl. Bhayangkara No. 1, Manokwari' },
  { kodeFaskes: '3501R001', nama: 'RSUD Mimika', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Mimika', provinsi: 'Papua Tengah', alamat: 'Jl. Yos Sudarso KM 4, Timika' },
  { kodeFaskes: '3601R001', nama: 'RSUD Wamena', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Jayawijaya', provinsi: 'Papua Pegunungan', alamat: 'Jl. Trikora No. 9, Wamena' },
  { kodeFaskes: '3701R001', nama: 'RSUD Merauke', kelas: 'C', jenis: 'RSUD', kota: 'Kab. Merauke', provinsi: 'Papua Selatan', alamat: 'Jl. Soekarjo Wiryopranoto No. 1, Merauke' },
  { kodeFaskes: '3801R001', nama: 'RSUD Sele Be Solu Kota Sorong', kelas: 'C', jenis: 'RSUD', kota: 'Kota Sorong', provinsi: 'Papua Barat Daya', alamat: 'Jl. Sele Be Solu II No. 1, Sorong' },
];
