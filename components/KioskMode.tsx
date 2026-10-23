'use client';

import React, { useState } from 'react';
import { useQueue } from '@/lib/queue-context';
import { verifyBpjsParticipant } from '@/lib/bpjs-bridging';
import { ThermalTicketModal } from './ThermalTicketModal';
import { QueueItem, PoliInfo } from '@/types/queue';
import {
  CreditCard,
  UserCheck,
  Smartphone,
  Stethoscope,
  Smile,
  HeartPulse,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const KioskMode: React.FC = () => {
  const { addQueue, bpjsConfig, poliList, queues } = useQueue();

  const [step, setStep] = useState<'TYPE' | 'INPUT_BPJS' | 'INPUT_UMUM' | 'INPUT_BOOKING' | 'SELECT_POLI'>('TYPE');
  const [patientType, setPatientType] = useState<'BPJS' | 'UMUM'>('BPJS');
  const [idInput, setIdInput] = useState<string>('');
  const [generalName, setGeneralName] = useState<string>('');
  const [generalNik, setGeneralNik] = useState<string>('');
  const [generalPhone, setGeneralPhone] = useState<string>('');
  const [complaint, setComplaint] = useState<string>('');

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedPatient, setVerifiedPatient] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [printedItem, setPrintedItem] = useState<QueueItem | null>(null);

  // Quick virtual keypad handler for kiosk touchscreens
  const handleKeypadPress = (val: string) => {
    if (val === 'DEL') {
      setIdInput((prev) => prev.slice(0, -1));
    } else if (val === 'CLR') {
      setIdInput('');
    } else {
      if (idInput.length < 16) {
        setIdInput((prev) => prev + val);
      }
    }
  };

  const handleVerifyBpjs = async () => {
    if (!idInput || (idInput.length !== 13 && idInput.length !== 16)) {
      setVerifyError('Harap masukkan 16 digit NIK atau 13 digit No. Kartu BPJS');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await verifyBpjsParticipant(idInput, bpjsConfig);
      if (res.success && res.data) {
        setVerifiedPatient(res.data);
        setStep('SELECT_POLI');
      } else {
        setVerifyError(res.message || 'Data peserta BPJS tidak ditemukan');
      }
    } catch (err: any) {
      setVerifyError('Gagal menghubungi server Bridging BPJS. Silakan coba kembali.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectPoliAndSubmit = async (poli: PoliInfo) => {
    let name = '';
    let nik = '';
    let noBpjs = '';
    let phone = '';

    if (patientType === 'BPJS' && verifiedPatient) {
      name = verifiedPatient.nama;
      nik = verifiedPatient.nik;
      noBpjs = verifiedPatient.noBpjs;
      phone = verifiedPatient.noHp;
    } else {
      name = generalName.trim() || 'PASIEN UMUM';
      nik = generalNik.trim() || '3201019900001234';
      phone = generalPhone.trim();
    }

    try {
      const createdItem = await addQueue({
        namaPasien: name,
        nik: nik,
        noBpjs: noBpjs,
        poliKode: poli.kode,
        tipePasien: patientType,
        keluhan: complaint || 'Konsultasi Rutin',
        noHp: phone,
      });

      setPrintedItem(createdItem);

      // Reset state for next kiosk user
      setStep('TYPE');
      setIdInput('');
      setGeneralName('');
      setGeneralNik('');
      setGeneralPhone('');
      setComplaint('');
      setVerifiedPatient(null);
    } catch (error) {
      console.error('Error generating queue:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Kiosk Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anjungan Mandiri Pasien</span>
              <span className="text-emerald-600">·</span>
              <span className="text-slate-300 font-normal">Bridging VClaim & PCare</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pendaftaran & Cetak Tiket Antrean
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
              TPMD DR. MACHMUJUR (Kode Faskes: {bpjsConfig.kdFaskes}) · Sentuh opsi di bawah untuk memulai
            </p>
          </div>

          {step !== 'TYPE' && (
            <button
              onClick={() => {
                setStep('TYPE');
                setVerifyError(null);
              }}
              className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors border border-white/15"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: SELECT REGISTRATION TYPE */}
      {step === 'TYPE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* BPJS Card */}
          <button
            onClick={() => {
              setPatientType('BPJS');
              setStep('INPUT_BPJS');
            }}
            className="group bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl p-5 sm:p-6 text-left transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between h-[270px]"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                Bridging VClaim / PCare
              </p>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Pasien BPJS Kesehatan
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Verifikasi kepesertaan aktif secara instan menggunakan 16 digit NIK KTP atau 13 digit No. Kartu BPJS.
              </p>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-semibold text-xs pt-3.5 border-t border-slate-100">
              <span>Ambil Nomor Antrean</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Pasien Umum Card */}
          <button
            onClick={() => {
              setPatientType('UMUM');
              setStep('INPUT_UMUM');
            }}
            className="group bg-white border border-slate-200/90 hover:border-teal-500 rounded-2xl p-5 sm:p-6 text-left transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between h-[270px]"
          >
            <div>
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-2xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">
                Mandiri / Asuransi Swasta
              </p>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Pasien Umum / Non-BPJS
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Pendaftaran mandiri untuk pasien bayar tunai atau asuransi rekanan. Cukup masukkan nama pasien.
              </p>
            </div>
            <div className="flex items-center justify-between text-teal-700 font-semibold text-xs pt-3.5 border-t border-slate-100">
              <span>Daftar Pasien Umum</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Check-in Mobile JKN Card */}
          <button
            onClick={() => {
              setPatientType('BPJS');
              setStep('INPUT_BPJS');
            }}
            className="group bg-white border border-slate-200/90 hover:border-indigo-500 rounded-2xl p-5 sm:p-6 text-left transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between h-[270px]"
          >
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                Konfirmasi Kehadiran
              </p>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Booking Mobile JKN
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Sudah reservasi nomor antrean melalui aplikasi Mobile JKN? Masukkan NIK/No. Kartu untuk check-in kedatangan.
              </p>
            </div>
            <div className="flex items-center justify-between text-indigo-700 font-semibold text-xs pt-3.5 border-t border-slate-100">
              <span>Check-In Mandiri</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* STEP 2A: INPUT NIK / BPJS NUMBER */}
      {step === 'INPUT_BPJS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Masukkan NIK atau No. BPJS</h2>
              <p className="text-slate-500 text-xs mt-1">
                Ketik 16 digit NIK (KTP/KK) atau 13 digit No. Kartu Indonesia Sehat (BPJS)
              </p>
            </div>

            {/* Display Input */}
            <div className="relative">
              <input
                type="text"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 3201011508890001 atau 0001234567890"
                maxLength={16}
                className="w-full text-center font-mono text-xl sm:text-2xl font-bold py-3.5 px-4 rounded-2xl border-2 border-emerald-500/50 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-slate-900 tracking-wider placeholder:text-slate-300 placeholder:text-base placeholder:font-sans placeholder:font-normal"
              />
              <div className="text-right text-[11px] text-slate-400 mt-1 font-mono">
                {idInput.length} / 16 digit
              </div>
            </div>

            {/* Quick Sample Selector for Demo Testing */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[11px] text-slate-500 font-medium mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Coba Cepat Data Peserta Contoh:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIdInput('3201011508890001')}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:border-emerald-500 text-slate-700 transition-colors"
                >
                  Bambang (PBI APBN)
                </button>
                <button
                  type="button"
                  onClick={() => setIdInput('3201022011920002')}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:border-emerald-500 text-slate-700 transition-colors"
                >
                  Siti (PPU BUMN)
                </button>
                <button
                  type="button"
                  onClick={() => setIdInput('3201031204850003')}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:border-emerald-500 text-slate-700 transition-colors"
                >
                  Hendra (Mandiri)
                </button>
              </div>
            </div>

            {/* Touchscreen Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="h-14 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xl font-bold rounded-xl transition-colors shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('CLR')}
                className="h-14 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-sm font-semibold rounded-xl transition-colors"
              >
                HAPUS SEMUA
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xl font-bold rounded-xl transition-colors shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('DEL')}
                className="h-14 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-sm font-semibold rounded-xl transition-colors"
              >
                ← BACKSPACE
              </button>
            </div>

            {verifyError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              onClick={handleVerifyBpjs}
              disabled={isVerifying || idInput.length < 13}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Bridging VClaim...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Verifikasi Data Peserta BPJS</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2B: INPUT DATA PASIEN UMUM */}
      {step === 'INPUT_UMUM' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Pendaftaran Pasien Umum</h2>
              <p className="text-slate-500 text-xs mt-1">Lengkapi data diri pasien untuk pencetakan nomor antrean</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Pasien *</label>
              <input
                type="text"
                value={generalName}
                onChange={(e) => setGeneralName(e.target.value)}
                placeholder="Contoh: Rahmat Hidayat"
                className="w-full py-3 px-4 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor KTP / NIK (Opsional)</label>
              <input
                type="text"
                value={generalNik}
                onChange={(e) => setGeneralNik(e.target.value.replace(/\D/g, ''))}
                placeholder="16 digit NIK"
                maxLength={16}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={generalPhone}
                onChange={(e) => setGeneralPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full py-3 px-4 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-sm font-mono"
              />
            </div>

            <button
              onClick={() => {
                if (!generalName.trim()) {
                  alert('Harap isi nama pasien terlebih dahulu.');
                  return;
                }
                setStep('SELECT_POLI');
              }}
              className="w-full mt-4 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Lanjutkan Pilih Poli Pemeriksaan</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VERIFIED CARD & SELECT POLI */}
      {step === 'SELECT_POLI' && (
        <div className="space-y-6">
          {/* BPJS Participant Badge Verified */}
          {patientType === 'BPJS' && verifiedPatient && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{verifiedPatient.nama}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {verifiedPatient.statusBpjs}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    No. BPJS: <span className="font-mono font-medium">{verifiedPatient.noBpjs}</span> · NIK:{' '}
                    <span className="font-mono">{verifiedPatient.nik}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 font-medium mt-1">
                    {verifiedPatient.jenisPeserta} · {verifiedPatient.kelasRawat} · {verifiedPatient.faskesTingkat1}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patient Umum Badge */}
          {patientType === 'UMUM' && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{generalName}</h3>
                <p className="text-xs text-teal-700">Pasien Umum · Mandiri</p>
              </div>
            </div>
          )}

          {/* Keluhan Input (Opsional) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keluhan Singkat Pasien (Opsional)
            </label>
            <input
              type="text"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Contoh: Demam tinggi 2 hari, pusing, batuk berdahak..."
              className="w-full py-2.5 px-3.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 text-slate-800"
            />
          </div>

          {/* Poli Choice Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Pilih Poli Tujuan Pemeriksaan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {poliList
                .filter((p) => p.kode !== 'FAR') // Pharmacy is typically for post-consultation prescription
                .map((poli) => {
                  const waitingCount = queues.filter(
                    (q) => q.poliKode === poli.kode && q.status === 'MENUNGGU'
                  ).length;
                  const estWait = waitingCount * poli.durasiRataRataMenit;

                  return (
                    <button
                      key={poli.kode}
                      onClick={() => handleSelectPoliAndSubmit(poli)}
                      className="group bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-5 text-left transition-all hover:shadow-xl active:scale-[0.98] flex flex-col justify-between h-56"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                            {poli.prefix}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            ± {estWait} mnt
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                          {poli.nama}
                        </h4>
                        <p className="text-xs font-medium text-slate-600 mt-1">{poli.dokter}</p>
                        <p className="text-[11px] text-slate-400">{poli.ruang}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Menunggu: <strong className="text-slate-800">{waitingCount} orang</strong>
                        </span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Pilih Poli <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Modal */}
      <ThermalTicketModal queueItem={printedItem} onClose={() => setPrintedItem(null)} />
    </div>
  );
};
