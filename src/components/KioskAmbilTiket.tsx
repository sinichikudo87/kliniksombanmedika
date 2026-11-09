import React, { useState } from 'react';
import {
  CreditCard,
  User,
  HeartHandshake,
  Pill,
  Printer,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Search,
  ArrowRight,
  Building,
  Sparkles,
  Phone,
  FileText,
  MapPin,
  Stethoscope,
  ShieldCheck,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { KategoriAntrean, QueueTicket } from '../types/queue';

interface KioskAmbilTiketProps {
  openMapModal?: () => void;
}

export const KioskAmbilTiket: React.FC<KioskAmbilTiketProps> = ({ openMapModal }) => {
  const { ambilTiketBaru, cekPesertaBPJS, bpjsConfig, tickets } = useQueue();

  const [selectedKategori, setSelectedKategori] = useState<KategoriAntrean | null>(null);
  const [selectedPoli, setSelectedPoli] = useState<string>('Poli Umum');
  const [kodePoli, setKodePoli] = useState<string>('001');
  const [dokterNama, setDokterNama] = useState<string>('dr. Machmujur');

  // BPJS Form states
  const [inputNoKartu, setInputNoKartu] = useState<string>('');
  const [inputNikBPJS, setInputNikBPJS] = useState<string>('');
  const [inputNamaBPJS, setInputNamaBPJS] = useState<string>('');
  const [inputNoHp, setInputNoHp] = useState<string>('081234567890');
  const [inputAlamat, setInputAlamat] = useState<string>('Kebonsari, Candi, Sidoarjo');
  const [inputKeluhan, setInputKeluhan] = useState<string>('Pemeriksaan kesehatan rutin');
  const [inputJenisKunjungan, setInputJenisKunjungan] = useState<string>('Rujukan Faskes 1');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedPatient, setVerifiedPatient] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // General patient name input
  const [inputNamaUmum, setInputNamaUmum] = useState<string>('');

  // Ticket printed modal
  const [printedTicket, setPrintedTicket] = useState<QueueTicket | null>(null);

  // Standar Referensi Poliklinik BPJS Kesehatan (P-Care / Antrean RS v2)
  const poliList = [
    { nama: 'Poli Umum', kode: '001', dokter: 'dr. Machmujur', isDefault: true },
    { nama: 'Poli Gigi & Mulut', kode: '002', dokter: 'dr. Diana (Dokter Umum)' },
    { nama: 'Poli KIA & Kebidanan / KB', kode: '003', dokter: 'Bidan' },
    { nama: 'Poli Lansia & Prolanis', kode: '004', dokter: 'dr. Diana (Dokter Umum)' },
    { nama: 'Farmasi & Penyerahan Resep', kode: '005', dokter: 'Wandi (Penyerahan Resep)' },
    { nama: 'Laboratorium & Cek Darah', kode: '006', dokter: 'Analis Medis Somban' },
  ];

  const demoPatientsBPJS = [
    {
      nama: 'Siti Rahmawati',
      noKartu: '0001827463910',
      nik: '3515085404880002',
      kelas: 'Kelas 1 (Mandiri)',
      faskes: 'Klinik Somban Medika Sidoarjo',
      noHp: '081234567890',
      poli: 'Poli Umum',
      kodePoli: '001',
      dokter: 'dr. Machmujur',
      keluhan: 'Kontrol tensi darah dan pusing ringan',
    },
    {
      nama: 'Bambang Sutrisno',
      noKartu: '0002938475612',
      nik: '3515081203750001',
      kelas: 'Kelas 3 (PBI APBD Sidoarjo)',
      faskes: 'Puskesmas Candi Sidoarjo',
      noHp: '085732198765',
      poli: 'Poli Lansia & Prolanis',
      kodePoli: '004',
      dokter: 'dr. Diana',
      keluhan: 'Pemeriksaan rutin gula darah Prolanis',
    },
    {
      nama: 'Kayla Azzahra',
      noKartu: '0003849501923',
      nik: '3515086509200003',
      kelas: 'Kelas 2 (Pekerja Penerima Upah)',
      faskes: 'Klinik Somban Medika Sidoarjo',
      noHp: '082198765432',
      poli: 'Poli KIA & Kebidanan / KB',
      kodePoli: 'KIA',
      dokter: 'Bidan',
      keluhan: 'Imunisasi balita dan konsultasi tumbuh kembang',
    },
  ];

  const handleApplyDemoPatient = (demo: (typeof demoPatientsBPJS)[0]) => {
    setInputNoKartu(demo.noKartu);
    setInputNikBPJS(demo.nik);
    setInputNamaBPJS(demo.nama);
    setInputNoHp(demo.noHp);
    setSelectedPoli(demo.poli);
    setKodePoli(demo.kodePoli);
    setDokterNama(demo.dokter);
    setInputKeluhan(demo.keluhan);
    setVerifiedPatient({
      noKartu: demo.noKartu,
      nik: demo.nik,
      nama: demo.nama,
      statusPeserta: { keterangan: 'AKTIF (Terverifikasi BPJS Kesehatan)' },
      hakKelas: { keterangan: demo.kelas },
      provUmum: { nmProvider: demo.faskes },
    });
    setVerificationError(null);
  };

  const handleSelectPoli = (item: (typeof poliList)[0]) => {
    setSelectedPoli(item.nama);
    setKodePoli(item.kode);
    setDokterNama(item.dokter);
  };

  const handleVerifikasiBPJS = async (cardNumberToVerify?: string) => {
    const targetCard = cardNumberToVerify || inputNoKartu.trim();
    if (!targetCard) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const isNik = targetCard.length === 16;
      const res = await cekPesertaBPJS(targetCard, isNik);
      if (res.status === 200 && res.data?.response?.peserta) {
        const p = res.data.response.peserta;
        setVerifiedPatient(p);
        if (p.nama && !inputNamaBPJS) {
          setInputNamaBPJS(p.nama);
        }
        if (p.nik && !inputNikBPJS) {
          setInputNikBPJS(p.nik);
        }
      } else {
        setVerificationError(
          res.data?.metaData?.message || 'Nomor kartu/NIK belum terdaftar di simulasi BPJS'
        );
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Gagal memverifikasi kepesertaan BPJS');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateTicket = async () => {
    if (!selectedKategori) return;

    let nama = 'Pasien Terdaftar';
    let noBpjs = '-';
    let nik = '';

    if (selectedKategori === 'BPJS') {
      nama =
        inputNamaBPJS.trim() ||
        verifiedPatient?.nama ||
        (inputNoKartu ? `Pasien BPJS (${inputNoKartu})` : 'Pasien BPJS Mandiri');
      noBpjs =
        inputNoKartu.trim() ||
        verifiedPatient?.noKartu ||
        '000' + Math.floor(1000000000 + Math.random() * 9000000000);
      nik =
        inputNikBPJS.trim() ||
        verifiedPatient?.nik ||
        '351' + Math.floor(1000000000000 + Math.random() * 9000000000000);
    } else if (selectedKategori === 'UMUM') {
      nama = inputNamaUmum.trim() || 'Pasien Umum / Asuransi';
    } else if (selectedKategori === 'PRIORITAS') {
      nama = inputNamaUmum.trim() || 'Pasien Prioritas Lansia';
    } else if (selectedKategori === 'FARMASI') {
      nama = inputNamaUmum.trim() || 'Pasien Pengambilan Obat';
    }

    const ticket = await ambilTiketBaru({
      kategori: selectedKategori,
      poliTujuan: selectedKategori === 'FARMASI' ? 'Farmasi & Penyerahan Resep' : selectedPoli,
      kodePoli: selectedKategori === 'FARMASI' ? 'FAR' : kodePoli,
      dokterNama: selectedKategori === 'FARMASI' ? 'Wandi (Penyerahan Resep)' : dokterNama,
      namaPasien: nama,
      noKartuBPJS: noBpjs,
      nik: nik,
    });

    setPrintedTicket(ticket);
    // Reset inputs
    setSelectedKategori(null);
    setInputNoKartu('');
    setInputNikBPJS('');
    setInputNamaBPJS('');
    setVerifiedPatient(null);
    setInputNamaUmum('');
  };

  const sisaAntreanDiDepan = printedTicket
    ? tickets.filter(
        (t) =>
          t.huruf === printedTicket.huruf &&
          t.status === 'MENUNGGU' &&
          t.angka < printedTicket.angka
      ).length
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
          <Building className="w-3.5 h-3.5" />
          <span>Kiosk Antrean Mandiri Pasien</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Klinik Somban Medika
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Kampung Bebek Kebonsari RT.05 RW.03, Candi - Sidoarjo</span>
          {openMapModal && (
            <button
              onClick={openMapModal}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>· Cek Lokasi Maps 📍</span>
            </button>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xl mx-auto pt-1">
          Silakan pilih kategori pelayanan di bawah ini. Nomor antrean akan otomatis tercetak dan tersinkronisasi dengan sistem Bridging BPJS Kesehatan.
        </p>
      </div>

      {/* Main Touch Buttons */}
      {!selectedKategori ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: BPJS Kesehatan */}
          <button
            onClick={() => {
              setSelectedKategori('BPJS');
              // Pre-fill default demo values for effortless experience if blank
              if (!inputNoKartu) {
                setInputNoKartu('0001827463910');
                setInputNikBPJS('3515085404880002');
                setInputNamaBPJS('Siti Rahmawati');
              }
            }}
            className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-600 dark:border-emerald-500/80 hover:border-emerald-700 dark:hover:border-emerald-400 hover:shadow-md text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="font-mono text-3xl font-black text-emerald-800 dark:text-emerald-400">A</span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Pasien BPJS Kesehatan
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Form Online
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Buka formulir pendaftaran, verifikasi nomor kartu/NIK, pemilihan dokter poli, dan penerbitan nomor antrean SEP BPJS Kesehatan.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              <span>Buka Form Pendaftaran Kategori A (BPJS)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: Pasien Umum */}
          <button
            onClick={() => setSelectedKategori('UMUM')}
            className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 hover:shadow-md text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 flex items-center justify-center text-blue-800 dark:text-blue-400 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <User className="w-6 h-6" />
              </div>
              <span className="font-mono text-3xl font-black text-blue-700 dark:text-blue-400">B</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              Pasien Umum / Asuransi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Pasien Non-BPJS, Pembayaran Tunai / Debit / QRIS, dan Asuransi Swasta Komersial
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span>Ambil Tiket Kategori B</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 3: Layanan Prioritas */}
          <button
            onClick={() => setSelectedKategori('PRIORITAS')}
            className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-600 hover:shadow-md text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-400 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="font-mono text-3xl font-black text-amber-700 dark:text-amber-400">P</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
              Layanan Prioritas Khusus
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Lansia (&gt;60 Tahun), Penyandang Disabilitas, Ibu Hamil Berisiko, dan Balita
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Ambil Tiket Kategori P (Loket Khusus)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 4: Farmasi & Obat */}
          <button
            onClick={() => setSelectedKategori('FARMASI')}
            className="p-6 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-teal-600 hover:shadow-md text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-800 dark:text-teal-400 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                <Pill className="w-6 h-6" />
              </div>
              <span className="font-mono text-3xl font-black text-teal-700 dark:text-teal-400">F</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
              Farmasi &amp; Pengambilan Obat
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Penyerahan resep dokter, verifikasi obat kronis (PRB), dan pengambilan obat jadi/racikan
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-400">
              <span>Ambil Tiket Kategori F</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      ) : (
        /* Form / Confirmation View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs max-w-3xl mx-auto">
          {/* Header Form */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                  selectedKategori === 'BPJS'
                    ? 'bg-emerald-700'
                    : selectedKategori === 'UMUM'
                    ? 'bg-blue-700'
                    : selectedKategori === 'PRIORITAS'
                    ? 'bg-amber-600'
                    : 'bg-teal-700'
                }`}
              >
                {selectedKategori === 'BPJS' ? 'A' : selectedKategori === 'UMUM' ? 'B' : selectedKategori === 'PRIORITAS' ? 'P' : 'F'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedKategori === 'BPJS'
                    ? 'Formulir Pendaftaran Pasien BPJS Kesehatan (JKN)'
                    : `Konfirmasi Tiket Kategori ${selectedKategori}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedKategori === 'BPJS'
                    ? 'Silakan isi data nomor kartu BPJS, nama lengkap, dan poliklinik tujuan Anda'
                    : 'Lengkapi rincian kunjungan untuk mencetak nomor antrean'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedKategori(null)}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer font-medium hover:bg-slate-200 transition-colors"
            >
              Kembali
            </button>
          </div>

          {/* Quick Demo Fill Buttons for BPJS */}
          {selectedKategori === 'BPJS' && (
            <div className="mb-6 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Isi Otomatis Data Pasien BPJS (Demo Cepat):</span>
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                  1-Klik Simulasi
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoPatientsBPJS.map((demo) => (
                  <button
                    key={demo.noKartu}
                    type="button"
                    onClick={() => handleApplyDemoPatient(demo)}
                    className="p-2 text-left rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer text-xs group"
                  >
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 truncate">
                      {demo.nama}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      No. {demo.noKartu}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                      {demo.poli}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If BPJS: Comprehensive Registration Form */}
          {selectedKategori === 'BPJS' && (
            <div className="space-y-4 mb-6">
              {/* Row 1: Nomor Kartu BPJS & Cek Validasi */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  1. Nomor Kartu BPJS (13 Digit): <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputNoKartu}
                      onChange={(e) => setInputNoKartu(e.target.value)}
                      placeholder="Contoh: 0001827463910"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    {inputNoKartu && (
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                        {inputNoKartu.length}/13 digit
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifikasiBPJS()}
                    disabled={isVerifying || !inputNoKartu.trim()}
                    className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isVerifying ? 'Memeriksa Server...' : 'Verifikasi BPJS'}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: NIK & Nama Lengkap Pasien */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    2. Nomor Induk Kependudukan (NIK 16 Digit):
                  </label>
                  <input
                    type="text"
                    value={inputNikBPJS}
                    onChange={(e) => setInputNikBPJS(e.target.value)}
                    placeholder="Contoh: 3515085404880002"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    3. Nama Lengkap Pasien BPJS: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputNamaBPJS}
                    onChange={(e) => setInputNamaBPJS(e.target.value)}
                    placeholder="Masukkan nama lengkap sesuai KIS/KTP"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              {/* Row 3: Nomor HP & Alamat Pasien */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    4. Nomor WhatsApp / HP Pasien:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputNoHp}
                      onChange={(e) => setInputNoHp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    5. Alamat Domisili Pasien:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputAlamat}
                      onChange={(e) => setInputAlamat(e.target.value)}
                      placeholder="Kebonsari RT.05 RW.03, Candi, Sidoarjo"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 4: Jenis Kunjungan & Keluhan Pasien */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    6. Jenis Kunjungan BPJS:
                  </label>
                  <select
                    value={inputJenisKunjungan}
                    onChange={(e) => setInputJenisKunjungan(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Rujukan Faskes 1">Rujukan Faskes Tingkat 1 (Puskesmas / Klinik)</option>
                    <option value="Kontrol Ulang PRB">Kontrol Ulang Rutin / Program PRB</option>
                    <option value="Kunjungan Pertama Kali">Kunjungan Pertama Kali (Faskes Primer Somban)</option>
                    <option value="Rujukan Internal Antar Poli">Rujukan Internal Antar Poliklinik</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    7. Keluhan Utama / Alasan Kunjungan:
                  </label>
                  <input
                    type="text"
                    value={inputKeluhan}
                    onChange={(e) => setInputKeluhan(e.target.value)}
                    placeholder="Contoh: Pemeriksaan tensi, batuk pilek, cek lab"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Verified Result Card (If already checked or loaded) */}
              {verifiedPatient && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Hasil Verifikasi Server BPJS Kesehatan:</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                      ELIGIBLE (SEP Siap)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nama Peserta:</span>
                      <strong className="text-slate-900 dark:text-white text-xs">{verifiedPatient.nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Status JKN:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{verifiedPatient.statusPeserta?.keterangan || 'AKTIF'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Hak Kelas Rawat:</span>
                      <span className="font-semibold">{verifiedPatient.hakKelas?.keterangan || 'Kelas 1'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Faskes Terdaftar:</span>
                      <span className="truncate block font-semibold">{verifiedPatient.provUmum?.nmProvider || 'Klinik Somban Medika Sidoarjo'}</span>
                    </div>
                  </div>
                </div>
              )}

              {verificationError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}
            </div>
          )}

          {/* If Non-BPJS: General Name input */}
          {selectedKategori !== 'BPJS' && selectedKategori !== 'FARMASI' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1.5">
                  Nama Pasien:
                </label>
                <input
                  type="text"
                  value={inputNamaUmum}
                  onChange={(e) => setInputNamaUmum(e.target.value)}
                  placeholder="Masukkan nama lengkap pasien"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Poliklinik Picker (except for farmasi) */}
          {selectedKategori !== 'FARMASI' && (
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">
                  {selectedKategori === 'BPJS' ? '8. Pilih Poliklinik Spesialis & Dokter DPJP Tujuan:' : 'Pilih Poliklinik Spesialis Tujuan:'}
                </label>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  {selectedPoli} ({dokterNama})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {poliList.map((item) => (
                  <button
                    key={item.kode}
                    type="button"
                    onClick={() => handleSelectPoli(item)}
                    className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                      selectedPoli === item.nama
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{item.nama}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.kode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-emerald-600" />
                      <span>{item.dokter}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Print / Cetak Button */}
          <button
            onClick={handleGenerateTicket}
            className="w-full py-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {selectedKategori === 'BPJS'
                ? 'Cetak Tiket Antrean Kategori A & Bridging BPJS Sekarang'
                : 'Cetak Tiket Antrean Sekarang'}
            </span>
          </button>
        </div>
      )}

      {/* Printable Thermal Receipt Modal */}
      {printedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white text-slate-900 rounded-xl max-w-sm w-full p-5 sm:p-6 shadow-xl font-mono text-center border border-slate-300 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Thermal Print Header */}
            <div className="border-b-2 border-dashed border-slate-400 pb-4 mb-4">
              <h4 className="font-bold text-base tracking-tight text-slate-950">
                {bpjsConfig.namaFaskes}
              </h4>
              <p className="text-[11px] text-slate-600">
                Kampung Bebek Kebonsari RT.05 RW.03, Candi - Sidoarjo
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Telp: (031) 896-1234 · Kode PPK BPJS: {bpjsConfig.kodePPK}
              </p>
            </div>

            {/* Queue Number */}
            <div className="py-2">
              <span className="text-xs uppercase font-sans font-semibold tracking-wider text-slate-600">
                Nomor Antrean Anda
              </span>
              <div className="text-6xl font-black tracking-tight text-slate-950 my-2">
                {printedTicket.nomorAntrean}
              </div>
              <span className="inline-block px-3 py-1 rounded bg-slate-100 text-xs font-bold text-slate-800">
                Kategori: {printedTicket.kategori}
              </span>
            </div>

            {/* Details Table */}
            <div className="border-t-2 border-b-2 border-dashed border-slate-400 py-3 my-3 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Poli Tujuan:</span>
                <span className="font-bold text-slate-900">{printedTicket.poliTujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dokter:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">{printedTicket.dokterNama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pasien:</span>
                <span className="font-semibold text-slate-800">{printedTicket.namaPasien}</span>
              </div>
              {printedTicket.noKartuBPJS && printedTicket.noKartuBPJS !== '-' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">No. BPJS:</span>
                  <span className="font-mono text-emerald-800 font-bold">{printedTicket.noKartuBPJS}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Booking:</span>
                <span className="font-bold text-emerald-800">{printedTicket.kodeBooking}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Ambil:</span>
                <span>{new Date(printedTicket.waktuAmbil).toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-slate-900 border-t border-slate-200">
                <span>Sisa Antrean Di Depan:</span>
                <span className="text-rose-600">{sisaAntreanDiDepan} Pasien</span>
              </div>
            </div>

            {/* Simulated QR Code */}
            <div className="my-3 flex flex-col items-center justify-center">
              <div className="w-24 h-24 border border-slate-400 rounded-lg p-2 bg-slate-50 flex items-center justify-center">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Scan di Loket Admisi / Mobile JKN</span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Simpan bukti antrean ini hingga selesai dilayani. Harap mendengarkan panggilan nomor antrean melalui pengeras suara.
            </p>

            {/* Close Button */}
            <button
              onClick={() => setPrintedTicket(null)}
              className="mt-5 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold transition-colors cursor-pointer"
            >
              Selesai &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
